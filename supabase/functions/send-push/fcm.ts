// Minimal FCM HTTP v1 client for Deno (no Firebase SDK).
// Auth: service-account JWT (RS256) exchanged for a short-lived OAuth token.

export interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

export interface FcmMessage {
  token: string;
  title: string;
  body: string;
  channelId: string;
  data: Record<string, string>;
}

export type FcmResult = { ok: true } | { ok: false; unregistered: boolean; error: string };

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const BRAND_COLOR = "#f59e0b";

let cachedToken: { value: string; expiresAt: number } | null = null;

const base64Url = (input: ArrayBuffer | string): string => {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const importPrivateKey = (pem: string): Promise<CryptoKey> => {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
};

const getAccessToken = async (account: ServiceAccount): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.value;

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: FCM_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const key = await importPrivateKey(account.private_key);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  const assertion = `${header}.${claims}.${base64Url(signature)}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!response.ok) throw new Error(`Google OAuth failed: ${response.status} ${await response.text()}`);

  const json = await response.json() as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: now + json.expires_in };
  return json.access_token;
};

export const sendFcmMessage = async (account: ServiceAccount, message: FcmMessage): Promise<FcmResult> => {
  const accessToken = await getAccessToken(account);
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token: message.token,
          notification: { title: message.title, body: message.body },
          data: message.data,
          android: {
            priority: "high",
            notification: { channel_id: message.channelId, color: BRAND_COLOR },
          },
        },
      }),
    },
  );

  if (response.ok) return { ok: true };

  const errorText = await response.text();
  // 404 UNREGISTERED / 400 INVALID_ARGUMENT on the token → the app was uninstalled or the token rotated
  const unregistered = response.status === 404 || errorText.includes("UNREGISTERED") ||
    (response.status === 400 && errorText.includes("registration token"));
  return { ok: false, unregistered, error: `${response.status} ${errorText}`.slice(0, 500) };
};
