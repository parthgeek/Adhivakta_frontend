const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load-source.cjs');
const frontend = load('lib/dashboard-layout.js');
const backend = require('../../Adhivakta_backend/utils/dashboardLayout.js');

test('dashboard defaults agree between frontend and backend', () => {
  assert.deepEqual(frontend.getDefaultDashboardSettings(), backend.getDefaultDashboardSettings());
});
test('saved dashboard layouts normalize consistently on both sides', () => {
  for (const input of [undefined, {}, { widgets: [{ id: 'unknown' }] },
    { widgets: [{ id: 'casesByStatus', visible: false, width: 'half' }, { id: 'casesByStatus', width: 'full' }] }]) {
    assert.deepEqual(frontend.normalizeDashboardSettings(input), backend.normalizeDashboardSettings(input));
  }
});
