const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load-source.cjs');
const { getCasePriority, getNextCaseHearingDate } = load('lib/casePriority.js');
const team = load('lib/legal-team.js');
const cases = load('lib/caseTypeUtils.js');
const now = new Date(2026, 10, 11, 12);

for (const [offset, expected] of [[-1, 'normal'], [0, 'urgent'], [3, 'urgent'], [4, 'high'], [7, 'high'], [8, 'normal']]) {
  test(`hearing priority at ${offset} days is ${expected}`, () => {
    assert.equal(getCasePriority({ nextHearingDate: new Date(2026, 10, 11 + offset) }, { now }), expected);
  });
}
test('closed cases and invalid or absent hearing dates have normal priority', () => {
  for (const value of [{}, { nextHearingDate: 'invalid' }, { status: 'closed', nextHearingDate: now }]) {
    assert.equal(getCasePriority(value, { now }), 'normal');
  }
  assert.equal(getNextCaseHearingDate({ hearingDate: 'bad' }), null);
});
test('EDGE-CASE-01: disposed cases do not show urgent hearing alerts', () => {
  assert.equal(getCasePriority({ status: 'disposed', nextHearingDate: now }, { now }), 'normal');
});
test('case numbers normalize punctuation and round trip through formatting', () => {
  assert.equal(cases.normalizeCaseNumber(' cs/123/2026 '), 'CS1232026');
  const number = cases.buildCaseNumber({ caseCode: 'cs', caseNumberMiddle: '123', caseYear: '2026' });
  assert.equal(number, 'CS/123/2026');
  assert.deepEqual(cases.parseCaseNumberParts({ caseNumber: number }), {
    caseCode: 'CS', caseNumberMiddle: '123', caseYear: '2026',
  });
});
test('incomplete case number and unknown category get safe fallbacks', () => {
  assert.equal(cases.buildCaseNumber({ caseCode: 'CS' }), '');
  assert.equal(cases.getCaseCategory({}), 'Uncategorized');
  assert.equal(cases.getBackendCaseType('unknown'), 'other');
});
test('case category uses the broad practice area instead of a subtype', () => {
  assert.equal(cases.getCaseCategory({ caseType: 'civil', caseSubType: 'Recovery Suit' }), 'Civil');
});
test('legal team supports populated users, legacy lawyers and empty data', () => {
  assert.deepEqual(team.getCaseLegalTeam({}), []);
  assert.equal(team.getCaseLegalTeam({ lawyer: 'Asha' })[0].name, 'Asha');
  const members = team.getCaseLegalTeam({ lawyers: [null, { user: { name: ' Asha ', email: 'a@example.com' } }] });
  assert.equal(members.length, 1);
  assert.equal(members[0].name, 'Asha');
});
test('legal team picks an explicit lead before a senior member', () => {
  const members = [{ name: 'Senior', level: 'Senior' }, { name: 'Lead', isLead: true }];
  assert.equal(team.getLeadLegalTeamMember(members).name, 'Lead');
  assert.equal(team.formatLegalTeamSummary([...members, { name: 'Junior' }]), 'Senior, Lead +1 more');
  assert.equal(team.formatLegalTeamSummary([]), null);
});
