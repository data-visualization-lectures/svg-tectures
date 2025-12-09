// ---- 設定 ----
const SUPABASE_URL = "https://vebhoeiltxspsurqoxvl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYmhvZWlsdHhzcHN1cnFveHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAyMjI2MTIsImV4cCI6MjA0NTc5ODYxMn0.sV-Xf6wP_m46D_q-XN0oZfK9NogDqD9xV5sS-n6J8c4"; // 公開OKなAnon Key
const API_BASE_URL = "https://api.dataviz.jp"; // ユーザープロファイルAPIなど
const AUTH_APP_URL = "https://auth.dataviz.jp"; // ログイン画面

// ガイドに従った固定クッキー名
const AUTH_COOKIE_NAME = "sb-dataviz-auth-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1年

/**
 * クッキー操作ヘルパー
 * ガイド必須要件: Domain=.dataviz.jp, SameSite=None, Secure=true
 */
function getCookieDomain() {
  const hostname = window.location.hostname;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/)
  ) {

    return null;
  }
  return ".dataviz.jp";
}
// スクリプト読み込み時に即座に環境判定ログを出す
getCookieDomain();

const cookieStorage = {
  getItem: (key) => {
    // Supabase JSSDKはデフォルトのキー名で呼んでくるかもしれないが、
    // ここではガイドで指定された AUTH_COOKIE_NAME を優先的に（あるいは強制的に）探すべき。
    // ただし SDK 初期化時に storageKey を指定するので、key 引数は AUTH_COOKIE_NAME になるはず。


    const cookies = document.cookie
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean);

    for (const c of cookies) {
      const [k, ...rest] = c.split("=");
      // 名前が一致するかチェック
      if (k === key) {
        const rawVal = decodeURIComponent(rest.join("="));

        // 1. Raw JSON check
        try {
          JSON.parse(rawVal);

          return rawVal;
        } catch (e) {
          // Not raw JSON
        }

        // 2. Base64 check
        try {
          // Supabase SSR (v2-rcなど) は 'base64-' プレフィックスを付けることがある
          let toDecode = rawVal;
          if (toDecode.startsWith('base64-')) {
            toDecode = toDecode.slice('base64-'.length);
          }

          // URL Safe Base64対応: - -> +, _ -> /
          const base64Standard = toDecode.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = atob(base64Standard);
          JSON.parse(decoded);

          return decoded;
        } catch (e) {
          console.warn(`[dataviz-auth-client] Failed to parse cookie: ${key}`);
          return null;
        }
      }
    }

    return null;
  },
  setItem: (key, value) => {
    // 書き込み時もガイドに準拠
    let encoded;
    try {
      // Supabase JS は内部で JSON stringify して渡してくるので、
      // ここで Base64化するかどうかはサーバー側と合わせる必要がある。
      // 通常 cookie-storage アダプタはそのまま書き込むか、Base64するか。
      // ★安全策として Base64 エンコードして書き込む（読み込み側が両対応したので安全）
      encoded = btoa(value);
    } catch (e) {
      console.error(`[dataviz-auth-client] Encode failed`, e);
      return;
    }

    const domain = getCookieDomain();
    // SameSite=None, Secure は必須
    let cookieStr = `${key}=${encoded}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=None; Secure`;

    if (domain) {
      cookieStr += `; Domain=${domain}`;
    }

    document.cookie = cookieStr;

  },
  removeItem: (key) => {
    const domain = getCookieDomain();
    let cookieStr = `${key}=; Max-Age=0; Path=/; SameSite=None; Secure`;
    if (domain) {
      cookieStr += `; Domain=${domain}`;
    }
    document.cookie = cookieStr;

  },
};

// ---- Supabase クライアント作成 ----
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: cookieStorage,
    storageKey: AUTH_COOKIE_NAME, // ★重要: これで getItem(AUTH_COOKIE_NAME) が呼ばれる
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // flowType: 'pkce' は削除済み（Implicit/Auto）
  },
});

// ---- 認証・認可チェック & リダイレクト集約ロジック ----

function isAuthDebugMode() {
  const params = new URLSearchParams(window.location.search);
  return params.has("auth_debug");
}

/**
 * 実際にリダイレクトを行う（デバッグモードならログ出力のみ）
 */
function performRedirect(url, reason) {
  if (isAuthDebugMode()) {
    console.warn(`[dataviz-auth-client] Redirect suppressed (Debug Mode). Reason: ${reason}, Target: ${url}`);
    return;
  }
  window.location.href = url;
}

/**
 * ユーザーのアクセス権を検証し、必要に応じてリダイレクトする
 * @param {Object|null} session - Supabaseセッション
 * @returns {Promise<Object|null>} アクセスOKならUserProfileオブジェクト、NGならnull
 */
async function verifyUserAccess(session) {
  // 1. 未ログインチェック
  if (!session) {
    const redirectTo = encodeURIComponent(window.location.href);
    const signUpUrl = `${AUTH_APP_URL}/auth/sign-up?redirect_to=${redirectTo}`;
    performRedirect(signUpUrl, 'Unauthenticated');
    return null;
  }

  // 2. プロファイル取得
  let userProfile = null;
  try {
    userProfile = await fetchUserProfile(session);
  } catch (err) {
    console.error("[dataviz-auth-client] Failed to fetch user profile", err);
    // プロファイルが取れない場合どうするか？
    // 一旦エラーとして扱うか、リトライを促すか。ここでは安全側に倒してリダイレクトせず、UIでエラー表示などが望ましいかもしれないが、
    // 既存動作に合わせて特段リダイレクトはしない（あるいはログインし直しを促す）
    // 今回はサブスク判定ができないため、アクセスNGとして扱うのが安全。
    performRedirect(AUTH_APP_URL, 'Profile Fetch Error');
    return null;
  }

  // 3. サブスクリプション状態チェック
  const status = userProfile.subscription?.status || "none";
  const isActive = status === "active" || status === "trialing";

  if (!isActive) {
    performRedirect(AUTH_APP_URL, `Inactive Subscription (${status})`);
    return null;
  }

  return userProfile;
}

// ---- api.dataviz.jp から /api/me を取得 ----
async function fetchUserProfile(session) {
  const res = await fetch(`${API_BASE_URL}/api/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    // クッキーを使わない構成なら omit でもいいが、現状は include でも問題ないはず
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`GET /api/me failed status=${res.status}`);
  }

  return await res.json();
}

// ---- UI 更新ロジック（UI操作のみに専念） ----
function updateUiWithSubscriptionStatus(me) {
  // me が null の場合（ログアウト時など）は 'none' 扱い
  const status = me?.subscription?.status || "none";

  const statusEl = document.getElementById("subscription-status");
  if (statusEl) {
    statusEl.textContent = status;
  }

  const paidEl = document.getElementById("paid-feature");
  const upgradeEl = document.getElementById("upgrade-message");

  const isActive = status === "active" || status === "trialing";

  if (paidEl) paidEl.style.display = isActive ? "block" : "none";
  if (upgradeEl) upgradeEl.style.display = isActive ? "none" : "block";
}

// ---- エントリーポイント ----
async function initDatavizToolAuth() {
  getCookieDomain(); // 環境ログ用

  // イベントリスナー
  supabase.auth.onAuthStateChange(async (event, session) => {
    // console.log(`[Auth] ${event}`, session?.user?.id);

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
      if (session) {
        // URLパラメータ掃除
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has("code") || hashParams.has("access_token")) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // アクセス権検証 & UI更新
        const profile = await verifyUserAccess(session);
        if (profile) {
          updateUiWithSubscriptionStatus(profile);
        }
      }
    } else if (event === 'SIGNED_OUT') {
      // ログアウト時
      updateUiWithSubscriptionStatus(null);
      // 未ログイン状態として検証（リダイレクト発動）
      await verifyUserAccess(null);
    }
  });

  // 初期ロード時のチェック
  // onAuthStateChange(INITIAL_SESSION) が発火するはずだが、
  // 発火しないケース（既にチェック済み、あるいはタイミング問題）や、
  // 未ログインでセッションが無い場合はイベントが来ない可能性があるため明示的にチェックする。
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    // セッションがない場合 -> 未ログインとして処理
    await verifyUserAccess(null);
  }
  // セッションがある場合は INITIAL_SESSION イベント側で verifyUserAccess が走るのを待つ
}

// ページ読み込み後に実行
document.addEventListener("DOMContentLoaded", () => {
  initDatavizToolAuth();
});
