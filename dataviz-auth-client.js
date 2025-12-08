// dataviz-auth-client.js
// ※ これは 2024 年頃の Supabase JS v2 の API 記憶にもとづく例です。

// ---- 設定（あなたの環境に合わせて置き換え）// ---- 設定 ----
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
    console.log("[dataviz-auth-client] Running on localhost/IP. Cookie domain: (none)");
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
    console.log(`[dataviz-auth-client] getItem called for key: ${key}`);

    const cookies = document.cookie
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean);

    for (const c of cookies) {
      const [k, ...rest] = c.split("=");
      // 名前が一致するかチェック
      if (k === key) {
        const rawVal = decodeURIComponent(rest.join("="));
        // ★デバッグ: 確実にログを出す
        console.log(`[dataviz-auth-client] RAW Cookie Value (first 100 chars): ${rawVal.substring(0, 100)}`);

        // 1. Raw JSON check
        try {
          JSON.parse(rawVal);
          console.log(`[dataviz-auth-client] Cookie is raw JSON.`);
          return rawVal;
        } catch (e) {
          // console.log(`[dataviz-auth-client] Not raw JSON: ${e.message}`);
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
          console.log(`[dataviz-auth-client] Cookie is Base64 JSON.`);
          return decoded;
        } catch (e) {
          console.warn(`[dataviz-auth-client] Failed to parse cookie. Error: ${e.message}`);
          return null;
        }
      }
    }
    console.log(`[dataviz-auth-client] Cookie not found: ${key}`);
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
    console.log(`[dataviz-auth-client] Set cookie: ${key} (Domain: ${domain || 'Current Host'})`);
  },
  removeItem: (key) => {
    const domain = getCookieDomain();
    let cookieStr = `${key}=; Max-Age=0; Path=/; SameSite=None; Secure`;
    if (domain) {
      cookieStr += `; Domain=${domain}`;
    }
    document.cookie = cookieStr;
    console.log(`[dataviz-auth-client] Removed cookie: ${key}`);
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

function isAuthDebugMode() {
  const params = new URLSearchParams(window.location.search);
  return params.has("auth_debug");
}

// ---- 未ログインなら auth.dataviz.jp へ飛ばす ----
async function requireLogin(session) {
  if (session) return session;

  if (isAuthDebugMode()) {
    console.warn("[dataviz-auth-client] debug mode: redirect suppressed");
    return null;
  }

  const redirectTo = encodeURIComponent(window.location.href);
  // auth.dataviz.jp 側で redirectTo を受け取って /account から戻す実装をしてある前提
  window.location.href = `${AUTH_APP_URL}/auth/sign-up?redirect_to=${redirectTo}`;
  return null;
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
    console.error("GET /api/me failed", res.status);
    throw new Error("api_me_failed");
  }

  return await res.json();
}

// ---- UI 更新ロジック（テスト用） ----
function updateUiWithSubscriptionStatus(me) {
  const status = me.subscription?.status || "none";

  const statusEl = document.getElementById("subscription-status");
  if (statusEl) {
    statusEl.textContent = status;
  }

  const paidEl = document.getElementById("paid-feature");
  const upgradeEl = document.getElementById("upgrade-message");

  const isActive = status === "active" || status === "trialing"; // 運用に合わせて

  if (paidEl) paidEl.style.display = isActive ? "block" : "none";
  if (upgradeEl) upgradeEl.style.display = isActive ? "none" : "block";
}

// ---- エントリーポイント ----
async function initDatavizToolAuth() {
  // 環境判定ログを表示するために実行
  getCookieDomain();

  // イベントリスナーをセットアップ
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log(`[dataviz-auth-client] Auth state changed: ${event}`, session?.user?.id);

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
      if (session) {
        // URLパラメータの掃除はSDKがやってくれない場合があるので、ここで一応ケア
        // ただしSDKの処理完了前にやると壊れるので、sessionがある場合のみ
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has("code") || hashParams.has("access_token")) {
          window.history.replaceState({}, document.title, window.location.pathname);
          console.log("[dataviz-auth-client] URL cleaned after successful login.");
        }

        try {
          const me = await fetchUserProfile(session);
          console.log("[dataviz-auth-client] /api/me result:", me);
          updateUiWithSubscriptionStatus(me);
        } catch (err) {
          console.error("[dataviz-auth-client] Profile fetch failed:", err);
        }
      }
    } else if (event === 'SIGNED_OUT') {
      // ログアウト時の処理
      updateUiWithSubscriptionStatus({ subscription: { status: 'none' } });
      // 必要ならリダイレクト
      await requireLogin(null);
    }
  });

  // 初期セッションチェック
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("[dataviz-auth-client] Initial getSession error:", error);
  }

  // セッションがなければログインへ誘導
  // ※ onAuthStateChangeで INITIAL_SESSION が来ることもあるが、
  //   未ログイン時はイベントが来ないまま終わることもあるので明示的にチェック
  if (!data.session) {
    await requireLogin(null);
  } else {
    console.log("[dataviz-auth-client] Initial session found:", data.session.user.id);
    // ここでの処理は onAuthStateChange(INITIAL_SESSION) 側に任せても良いが、
    // 確実に走らせるためにここでも呼ぶか、awaitする設計にする
    // 今回は onAuthStateChange が走ることを期待して、ログだけ出す
  }
}

// ページ読み込み後に実行
document.addEventListener("DOMContentLoaded", () => {
  initDatavizToolAuth();
});
