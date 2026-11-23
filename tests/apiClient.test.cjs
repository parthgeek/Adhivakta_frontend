const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load-source.cjs');
const state = require('./helpers/state.cjs');

const setup = (t, status, body, { token = 'fake-test-token', nonJson = false } = {}) => {
  state.env(t, 'NEXT_PUBLIC_API_URL', 'https://api.adhivakta.test/api');
  let logouts = 0;
  const calls = [];
  state.global(t, 'window', { __authLogout: () => logouts++ });
  state.global(t, 'localStorage', { getItem: key => key === 'auth_token' ? token : null });
  t.mock.method(console, 'log', () => {});
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return { url, status, statusText: status === 502 ? 'Bad Gateway' : 'Unauthorized',
      ok: status >= 200 && status < 300,
      json: async () => { if (nonJson) throw new SyntaxError('Invalid JSON'); return body; } };
  });
  return { api: load('services/api.js').default, calls, logouts: () => logouts };
};

test('API client sends bearer credentials and returns successful JSON', async (t) => {
  const { api, calls } = setup(t, 200, { success: true, data: { name: 'QA User' } });
  assert.equal((await api.auth.getMe()).data.name, 'QA User');
  assert.equal(calls[0].url, 'https://api.adhivakta.test/api/auth/me');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer fake-test-token');
});
test('protected 401 logs out the current session and preserves the backend error', async (t) => {
  const { api, logouts } = setup(t, 401, { errors: [{ msg: 'Session expired' }] });
  await assert.rejects(api.auth.getMe(), /Session expired/);
  assert.equal(logouts(), 1);
});
test('login 401 does not trigger global logout', async (t) => {
  const { api, logouts } = setup(t, 401, { message: 'Incorrect credentials' });
  await assert.rejects(api.auth.login({ email: 'qa@example.com', password: 'test-password' }), /Incorrect credentials/);
  assert.equal(logouts(), 0);
});
test('session-conflict errors preserve their code and HTTP status', async (t) => {
  const { api } = setup(t, 409, { message: 'Another device is active', code: 'ACTIVE_SESSION_EXISTS' });
  await assert.rejects(api.auth.login({ email: 'qa@example.com', password: 'test-password' }), error => {
    assert.equal(error.code, 'ACTIVE_SESSION_EXISTS');
    assert.equal(error.response.status, 409);
    return true;
  });
});
test('non-JSON gateway errors produce a readable error', async (t) => {
  const { api } = setup(t, 502, null, { nonJson: true });
  await assert.rejects(api.auth.getMe(), /Server error: 502 Bad Gateway/);
});
test('unauthenticated requests omit bearer credentials and do not trigger logout', async (t) => {
  const { api, calls, logouts } = setup(t, 401, { message: 'No token' }, { token: null });
  await assert.rejects(api.auth.getMe(), /No token/);
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(logouts(), 0);
});
test('network failures propagate to callers', async (t) => {
  const { api } = setup(t, 200, {});
  globalThis.fetch.mock.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(api.dashboard.getSummary(), /Failed to fetch/);
});
