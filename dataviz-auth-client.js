// dataviz-auth-client.js
// ※ これは 2024 年頃の Supabase JS v2 の API 記憶にもとづく例です。

// ---- 設定（あなたの環境に合わせて置き換え） ----
const SUPABASE_URL = "https://vebhoeiltxspsurqoxvl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYmhvZWlsdHhzcHN1cnFveHZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA1NjgyMywiZXhwIjoyMDgwNjMyODIzfQ.vq7xTIU6-U6W7Bx6g8aagm64JNuxn4vTvAKZ0a-AcBc";
const AUTH_APP_URL = "https://auth.dataviz.jp";
const API_BASE_URL = "https://api.dataviz.jp";
const DEBUG_PARAM = "auth_debug";

// ---- クッキーでセッションを共有するためのストレージ実装 ----
// localhost (またはIPアクセス) の場合はドメイン指定をしない (=カレントドメインのみ)
// 本番 (.dataviz.jp) の場合はサブドメイン間で共有するためにドメインを指定する
function getCookieDomain() {
  const hostname = window.location.hostname;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/) // IP address check
  ) {
    console.log("[dataviz-auth-client] Running on localhost/IP. Cookie domain: (none)");
    return null;
  }
  // 本番環境など
  console.log("[dataviz-auth-client] Running on production. Cookie domain: .dataviz.jp");
  return ".dataviz.jp";
}
// スクリプト読み込み時に即座に環境判定ログを出す
getCookieDomain();

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const cookieStorage = {
  getItem: (key) => {
    const cookies = document.cookie
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean);
    for (const c of cookies) {
      const [k, ...rest] = c.split("=");
      if (k === key) {
        // デコード前の生の値を保持（URLデコードは済ませておくのが安全だが、document.cookieは基本生）
        // 一般的には decodeURIComponent が必要
        const rawVal = decodeURIComponent(rest.join("="));
        console.log(`[dataviz-auth-client] Found cookie: ${key}, Raw length: ${rawVal.length}`);

        // 1. まずそのままJSONパースを試みる（サーバーがBase64してない場合）
        try {
          JSON.parse(rawVal);
          console.log(`[dataviz-auth-client] Cookie is raw JSON. Using as is.`);
          return rawVal;
        } catch (e) {
          // JSONでなければ次へ
        }

        // 2. Base64デコードを試みる（サーバーがBase64している場合）
        try {
          const decoded = atob(rawVal);
          // デコード結果がJSONかチェック
          JSON.parse(decoded);
          console.log(`[dataviz-auth-client] Cookie is Base64 encoded JSON. Digested.`);
          return decoded;
        } catch (e) {
          console.warn(`[dataviz-auth-client] Failed to parse cookie ${key} as JSON or Base64-JSON.`, e);
          // 3. 最後のあがき：もしかしたら「生トークン文字列」そのものかも？
          // Supabase JS は JSON を期待するが、もし文字列ならそのまま返す手もあるが一旦null
          // ログに中身を少し出してデバッグ
          console.log(`[dataviz-auth-client] Invalid cookie content head: ${rawVal.substring(0, 20)}...`);
          return null;
        }
      }
    }
    console.log(`[dataviz-auth-client] Cookie not found: ${key}`);
    return null;
  },
  setItem: (key, value) => {
    // console.log(`[dataviz-auth-client] setItem calling for ${key}. Value length: ${value.length}`);
    let encoded;
    try {
      encoded = btoa(value);
    } catch (e) {
      console.error(`[dataviz-auth-client] Failed to encode cookie value for ${key}`, e);
      return;
    }

    const domain = getCookieDomain();
    let cookieStr = `${key}=${encoded}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax; Secure`;

    if (domain) {
      cookieStr += `; Domain=${domain}`;
    }

    document.cookie = cookieStr;
    console.log(`[dataviz-auth-client] Set cookie: ${key} (Domain: ${domain || 'Current Host'})`);
  },
  removeItem: (key) => {
    const domain = getCookieDomain();
    let cookieStr = `${key}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;

    if (domain) {
      cookieStr += `; Domain=${domain}`;
    }

    document.cookie = cookieStr;
    console.log(`[dataviz-auth-client] Remove cookie: ${key}`);
  },
};

function isAuthDebugMode() {
  const params = new URLSearchParams(window.location.search);
  return params.has(DEBUG_PARAM);
}

// ---- Supabase クライアント作成（CDN 版・cookie storage） ----
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: cookieStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // URLのcode等を自動検知
  },
});

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
