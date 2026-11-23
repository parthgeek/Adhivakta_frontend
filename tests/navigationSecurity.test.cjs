const test = require('node:test');
const state = require('./helpers/state.cjs');
const assert = require('node:assert/strict');
const load = require('./helpers/load-source.cjs');
const { getNotificationTarget } = load('lib/notification-link.js');

test('missing notifications fall back to the notification list', () => {
  assert.equal(getNotificationTarget(null), '/dashboard/notifications');
});
test('document review notifications select the documents tab while preserving other parameters', () => {
  const result = getNotificationTarget({ type: 'document_review_request', link: '/dashboard/cases/123?foo=bar&tab=details#review' });
  assert.equal(result, '/dashboard/cases/123?foo=bar&tab=documents#review');
});
test('absolute dashboard links become local paths', () => {
  assert.equal(getNotificationTarget({ type: 'case', link: 'https://app.example/dashboard/cases/123' }), '/dashboard/cases/123');
});
for (const link of ['//outside.example/phishing', 'javascript:alert(1)']) {
  test(`EDGE-NAV-01: notification links reject unsafe target ${link}`, () => {
    const result = getNotificationTarget({ link });
    assert.ok(result.startsWith('/') && !result.startsWith('//'), `Expected a safe app path; received ${result}`);
  });
}
test('EDGE-NAV-02: malformed non-string notification links fall back safely', () => {
  assert.equal(getNotificationTarget({ link: { url: '/dashboard' } }), '/dashboard/notifications');
});

test('document download URLs normalize API paths and include a local test token', (t) => {
  state.env(t, 'NEXT_PUBLIC_API_URL', 'https://api.adhivakta.test/api');
  state.global(t, 'window', { location: { origin: 'https://app.adhivakta.test' } });
  state.global(t, 'localStorage', { getItem: () => 'fake-test-token' });
  const { getDocumentOpenUrl } = load('lib/document-url.js');
  const url = new URL(getDocumentOpenUrl({ _id: 'doc-123' }, { inline: true }));
  assert.equal(url.origin, 'https://api.adhivakta.test');
  assert.equal(url.pathname, '/api/documents/doc-123/download');
  assert.equal(url.searchParams.get('token'), 'fake-test-token');
  assert.equal(url.searchParams.get('disposition'), 'inline');
  assert.equal(getDocumentOpenUrl({}), null);
});
test('signed storage URLs do not receive the API token', (t) => {
  state.global(t, 'window', { location: { origin: 'https://app.adhivakta.test' } });
  state.global(t, 'localStorage', { getItem: () => 'fake-test-token' });
  const { getDocumentOpenUrl } = load('lib/document-url.js');
  const url = getDocumentOpenUrl({ signedUrl: 'https://storage.example/brief.pdf?signature=abc' });
  assert.equal(url, 'https://storage.example/brief.pdf?signature=abc');
});
test('EDGE-DOC-01: third-party API paths never receive the application auth token', (t) => {
  state.env(t, 'NEXT_PUBLIC_API_URL', 'https://api.adhivakta.test/api');
  state.global(t, 'window', { location: { origin: 'https://app.adhivakta.test' } });
  state.global(t, 'localStorage', { getItem: () => 'fake-test-token' });
  const { getDocumentOpenUrl } = load('lib/document-url.js');
  const url = new URL(getDocumentOpenUrl({ fileUrl: 'https://outside.example/api/file' }));
  assert.equal(url.searchParams.has('token'), false);
});
