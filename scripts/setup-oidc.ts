/**
 * Configures the local Pocket ID from docker-compose.oidc.yml for development:
 * creates a test user and the "music-yoinker" OIDC client, writes the AUTH_* settings
 * into .env, and prints a one-time login code. Safe to run more than once.
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const ISSUER = 'http://localhost:1411';
const API_KEY = '70fca68b2d1d8a95696f7a8083b0ac2ec742f4a20cce419a'; // matches docker-compose.oidc.yml
const APP_URL = 'http://localhost:3000';
const CLIENT_ID = 'music-yoinker';
const USERNAME = 'yoinker';
const ENV_FILE = new URL('../.env', import.meta.url).pathname;

async function api<T>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T }> {
  const res = await fetch(`${ISSUER}/api${path}`, {
    method,
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = res.status === 204 ? undefined : await res.json();
  if (!res.ok && res.status !== 404) {
    throw new Error(`${method} ${path} failed with ${res.status}: ${JSON.stringify(data)}`);
  }
  return { status: res.status, data: data as T };
}

async function waitForPocketId() {
  for (let i = 0; i < 30; i++) {
    try {
      if ((await fetch(`${ISSUER}/.well-known/openid-configuration`)).ok) return;
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Pocket ID is not reachable at ${ISSUER}. Start it with: docker compose -f docker-compose.oidc.yml up -d`);
}

async function ensureUser(): Promise<string> {
  const { data } = await api<{ data: { id: string; username: string }[] }>('GET', `/users?search=${USERNAME}`);
  const existing = data.data.find(u => u.username === USERNAME);
  if (existing) return existing.id;

  const created = await api<{ id: string }>('POST', '/users', {
    username: USERNAME,
    email: `${USERNAME}@localhost.test`,
    firstName: 'Yoinker',
    lastName: 'Test',
    displayName: 'Yoinker Test',
    isAdmin: true,
  });
  return created.data.id;
}

async function ensureClient() {
  const { status } = await api('GET', `/oidc/clients/${CLIENT_ID}`);
  if (status !== 404) return;

  await api('POST', '/oidc/clients', {
    id: CLIENT_ID,
    name: 'Music Yoinker',
    callbackURLs: [`${APP_URL}/api/auth/callback/oidc`],
    logoutCallbackURLs: [],
    isPublic: false,
    pkceEnabled: true,
  });
}

/** Sets each key in .env, replacing an existing line or appending it. `keep` keys are only added when missing. */
function updateEnv(values: Record<string, string>, keep: string[]) {
  let env = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
  for (const [key, value] of Object.entries(values)) {
    const line = new RegExp(`^${key}=.*$`, 'm');
    const current = env.match(line)?.[0].slice(key.length + 1);
    if (current && keep.includes(key)) continue;
    if (current !== undefined) env = env.replace(line, () => `${key}=${value}`);
    else env += `${env && !env.endsWith('\n') ? '\n' : ''}${key}=${value}\n`;
  }
  writeFileSync(ENV_FILE, env);
}

await waitForPocketId();
const userId = await ensureUser();
await ensureClient();
const { data: secret } = await api<{ secret: string }>('POST', `/oidc/clients/${CLIENT_ID}/secrets`, { expiresAt: null });

updateEnv({
  AUTH_URL: APP_URL,
  AUTH_SECRET: randomBytes(32).toString('base64'),
  AUTH_OIDC_ISSUER: ISSUER,
  AUTH_OIDC_CLIENT_ID: CLIENT_ID,
  AUTH_OIDC_CLIENT_SECRET: secret.secret,
}, ['AUTH_URL', 'AUTH_SECRET']);

const { data: login } = await api<{ token: string }>('POST', `/users/${userId}/one-time-access-token`, { ttl: '1h' });

console.log(`
Pocket ID is configured and .env has been updated.

  1. Start yoinker:  npm run dev  (restart it if it is already running)
  2. Open ${APP_URL} and click "Log in"
  3. Log in as "${USERNAME}" with this one-time code (valid 1 hour): ${login.token}
     or open: ${ISSUER}/lc/${login.token}

Run "npm run setup-oidc" again for a new code.
`);
