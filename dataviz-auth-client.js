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
        const val = rest.join("=");
        try {
          // Base64 decode
          // JSON stringとして入っているはずなので、デコードしてそのまま返す
          // (Supabase側で JSON.parse される)
          return atob(val);
        } catch (e) {
          console.warn(`[dataviz-auth-client] Failed to decode cookie ${key}:`, e);
          return null;
        }
      }
    }
    // console.log("[dataviz-auth-client] cookieStorage.getItem miss", { key });
    return null;
  },
  setItem: (key, value) => {
    // Base64 encode
    // value は JSON string
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
    detectSessionInUrl: true,
  },
});

// ---- セッション取得 ----
async function getSession() {
  console.log("[dataviz-auth-client] getSession start. href:", window.location.href);
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("getSession error", error);
    return null;
  }
  console.log("[dataviz-auth-client] getSession result:", data);
  return data.session ?? null;
}

// ---- リダイレクト後のURLハッシュからセッションを復元 ----
async function recoverSessionFromUrl() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);

  const hasSupabaseParams =
    hashParams.has("access_token") ||
    hashParams.has("refresh_token") ||
    hashParams.has("code") ||
    searchParams.has("code") ||
    searchParams.has("access_token");

  if (!hasSupabaseParams) return null;

  // hash / query のどちらでも拾えるように url を明示指定
  const { data, error } = await supabase.auth.getSessionFromUrl({
    storeSession: true,
    url: window.location.href,
  });
  if (error) {
    console.error("getSessionFromUrl error", error);
    return null;
  }

  // ハッシュ・クエリは不要なので消す（同一ページでの再読込ループを防ぐ）
  window.history.replaceState({}, document.title, window.location.pathname);
  console.log("[dataviz-auth-client] session recovered from url", data);
  return data.session ?? null;
}

// ---- 未ログインなら auth.dataviz.jp へ飛ばす ----
async function requireLogin() {
  // リダイレクト直後にハッシュからセッションを取り込む
  await recoverSessionFromUrl();

  const session = await getSession();
  if (!session) {
    console.log("[dataviz-auth-client] session missing. cookies now:", document.cookie);
  }
  if (!session) {
    if (isAuthDebugMode()) {
      console.warn("[dataviz-auth-client] debug mode: redirect suppressed");
      return null;
    }
    const redirectTo = encodeURIComponent(window.location.href);
    // auth.dataviz.jp 側で redirectTo を受け取って /account から戻す実装をしてある前提
    window.location.href = `${AUTH_APP_URL}/auth/sign-up?redirect_to=${redirectTo}`;
    return null;
  }
  return session;
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
  try {
    const session = await requireLogin();
    if (!session) return; // サインイン画面へ飛んだ

    const me = await fetchUserProfile(session);
    console.log("[dataviz-auth-client] /api/me result:", me);

    updateUiWithSubscriptionStatus(me);
  } catch (err) {
    console.error("[dataviz-auth-client] init error", err);
    const statusEl = document.getElementById("subscription-status");
    if (statusEl) {
      statusEl.textContent = "エラー";
    }
  }
}

// ページ読み込み後に実行
document.addEventListener("DOMContentLoaded", () => {
  initDatavizToolAuth();
});
