const test = require('node:test');
const state = require('./helpers/state.cjs');
const assert = require('node:assert/strict');
const load = require('./helpers/load-source.cjs');
const { middleware } = load('middleware.ts');
const req = (authorization) => ({ headers: new Headers(authorization ? { authorization } : {}) });
const basic = (value) => `Basic ${Buffer.from(value).toString('base64')}`;
const configure = (t, password = 'test-password') => {
  state.env(t, 'PROTECT_SITE', 'true');
  state.env(t, 'ADMIN_USER', 'qa');
  state.env(t, 'ADMIN_PASS', password);
};
test('site protection disabled allows requests', (t) => {
  state.env(t, 'PROTECT_SITE', 'false');
  assert.equal(middleware(req()).status, 200);
});
test('site protection challenges requests without credentials', (t) => {
  configure(t);
  const result = middleware(req());
  assert.equal(result.status, 401);
  assert.match(result.headers.get('www-authenticate'), /Basic/);
});
test('site protection accepts correct credentials and rejects incorrect credentials', (t) => {
  configure(t);
  assert.equal(middleware(req(basic('qa:test-password'))).status, 200);
  assert.equal(middleware(req(basic('qa:wrong'))).status, 401);
});
test('EDGE-MW-01: malformed Authorization header returns 401 without throwing', (t) => {
  configure(t);
  assert.equal(middleware(req('Basic')).status, 401);
});
test('EDGE-MW-02: a non-Basic authentication scheme cannot bypass the Basic guard', (t) => {
  configure(t);
  const encoded = Buffer.from('qa:test-password').toString('base64');
  assert.equal(middleware(req(`Bearer ${encoded}`)).status, 401);
});
test('EDGE-MW-03: Basic authentication accepts a colon inside the password', (t) => {
  configure(t, 'test:password');
  assert.equal(middleware(req(basic('qa:test:password'))).status, 200);
});
