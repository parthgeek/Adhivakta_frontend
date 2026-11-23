# Adhivakta test results — 11 November 2026

The application does **not** pass every test. This run reproduced 10 failing test cases across 9 issues. Application behavior was left unchanged; the failing assertions remain executable regression tests.

## Execution summary

| Check | Result | Details |
| --- | --- | --- |
| Existing backend baseline | PASS | 41 passed before adding tests |
| Expanded backend suite | FAIL | 115 tests: 113 passed, 2 failed |
| New frontend suite | FAIL | 37 tests: 29 passed, 8 failed |
| Combined automated suites | FAIL | 152 tests: 142 passed, 10 failed; no skips/cancellations |
| Frontend TypeScript | FAIL | 8 compiler diagnostics in forgot-password and calendar components |
| Frontend production build | BLOCKED by environment | `next/font` failed to resolve `fonts.googleapis.com` (`ENOTFOUND`); optimized build could not finish |
| Full browser / database / external-service workflows | NOT EXECUTED | No browser automation package installed; this pass used isolated fixtures and mocked persistence/HTTP |

Counts use Node's test-runner totals, including the authentication parent test and its 11 subtests. There were 111 additional runner-reported tests compared with the 41-test baseline. Environment: Node v24.12.0, Next.js 15.2.6, installed local dependencies. No new packages were needed.

Logs from the final runs are in [test-results/2026-11-11](test-results/2026-11-11/). The test suites exit with status 1 because the application fails their assertions. TypeScript exits with status 2. The build exits with status 1 because of the font-fetch errors.

## Reproducible failures

P1 means fix before release; P2 means functional correctness or resilience. Severity reflects the tested behavior; exploitability through persisted data or a deployed browser was not tested.

| Test ID | Priority | Reproduction | Expected | Actual | Source / suggested correction |
| --- | --- | --- | --- | --- | --- |
| EDGE-DOC-01 | P1 | Set a synthetic stored auth token and call `getDocumentOpenUrl({fileUrl: 'https://outside.example/api/file'})` | External origin receives no application token | Returned external URL contains `token=fake-test-token` | `lib/document-url.js`, `appendToken`: require a trusted backend origin as well as an API pathname before adding credentials; reject unsafe URL schemes |
| EDGE-SES-01 | P1 | Three active sessions; call `pruneSessionsToLimit(sessions, 1, 'old')` | Only the preferred current device remains | All three devices remain | Backend `utils/sessionPolicy.js`: `.slice(-0)` keeps the entire list; explicitly handle zero remaining slots. Used by `controllers/profile.controller.js:updateSecurity` |
| EDGE-MW-02 | P1 | Enable site protection; send `Bearer <base64 of valid Basic credentials>` | 401 for wrong authentication scheme | 200 | `middleware.ts`: validate the Basic scheme before decoding |
| EDGE-NAV-01 (2 cases) | P1 | Notification links `//outside.example/phishing` and `javascript:alert(1)` | Safe internal path or notifications fallback | Unsafe strings returned unchanged | `lib/notification-link.js`: validate relative paths and schemes before returning any target. Helper used by dashboard links and `router.push`; end-to-end browser execution was not tested |
| EDGE-MW-01 | P2 | Enable site protection; send `Authorization: Basic` with no payload | 401 without exception | `Buffer.from(undefined)` throws | `middleware.ts`: validate payload presence and handle malformed encoding |
| EDGE-MW-03 | P2 | Configure password `test:password`; send matching Basic credentials | 200 | 401 | `middleware.ts`: split decoded credentials at the first colon only |
| EDGE-ORG-01 | P2 | Select advocate ID `invalid-id` in an organization with an active advocate | Reject malformed selection or return an empty scope | Falls back to all active advocates plus the admin | Backend `utils/organizationScope.js`: distinguish missing selection from an invalid supplied selection. Observed broadening stays inside the organization; cross-organization access was not demonstrated |
| EDGE-NAV-02 | P2 | Pass `{link: {url: '/dashboard'}}` to `getNotificationTarget` | Safe fallback | `link.startsWith is not a function` | `lib/notification-link.js`: require a string before parsing |
| EDGE-CASE-01 | P2 | A `disposed` case has a hearing today | Normal priority, consistent with closed cases | Urgent priority | `lib/casePriority.js`: treat disposed status as terminal, subject to confirmation of the product's priority rule |

Only fake tokens and fixture URLs were used. The document-token finding demonstrates URL construction; it did not send any credentials to an external server.

## Automated case coverage

These tests assert expected behavior rather than marking existing defects as passing or skipping them.

| Test file | Cases and edges covered | Outcome |
| --- | --- | --- |
| Backend `tests/authProtection.test.js` | Missing/empty/malformed/expired tokens; revoked or missing device ID; valid bearer and document query tokens; suspended/deleted accounts; lawyer/client authorization | All pass; user lookup mocked |
| Backend `tests/sessionPolicy.test.js` | Limit clamping, fractional settings, newest/preferred session retention, unknown preferred device, duplicates, expiry, legacy token compatibility, clearing sessions, configured JWT lifetimes | One failure: single-device retention |
| Backend `tests/caseValidation.test.js` | Valid district case; eight missing fields; whitespace and 100/101-character title boundaries; case number/CNR format; unknown statuses/courts; invalid/past hearing; future filing; empty petitioners; blank respondent; optional CNR for high/supreme courts; hearing on filing day | All pass at schema level |
| Backend `tests/fileSecurity.test.js` | Uppercase extensions, basename normalization, hidden files, double extensions, MIME mismatch, SVG/RAR/unsupported extension, empty content, spoofed PDF, active PDF markers, ZIP traversal with Unix/Windows paths, encrypted entries, nested archives/executables/scripts, Office macros and missing package metadata | All pass for tested fixtures |
| Backend `tests/organizationScope.test.js` | Active membership, admin scope, selected advocate, outsider/inactive selection, malformed selection | One failure: malformed selection |
| Frontend `tests/apiClient.test.cjs` | Auth headers, successful JSON, protected 401 logout, login 401 without global logout, conflict code/status preservation, non-JSON gateway errors, no stored token, network errors | All pass; fetch/storage mocked |
| Frontend `tests/caseHelpers.test.cjs` | Hearing offsets -1/0/3/4/7/8 days; invalid/missing dates; closed/disposed cases; case-number formatting/round trip; category fallbacks; populated/legacy/empty legal teams and lead selection | One failure: disposed priority |
| Frontend `tests/dashboardLayout.test.cjs` | Frontend/backend default parity, unknown/duplicate widgets and saved-layout normalization | All pass |
| Frontend `tests/navigationSecurity.test.cjs` | Missing notification, document tab/query/hash preservation, absolute dashboard paths, unsafe/non-string links; document ID fallback, API normalization, inline query, signed storage URL, third-party API token handling | Four failures |
| Frontend `tests/siteProtection.test.cjs` | Protection disabled; missing/correct/incorrect credentials; malformed header; wrong scheme; password containing colon | Three failures |
| Existing backend tests | Admin roles/permissions, creator-only case deletion, layout defaults/presets, eCourts integration fixtures, high-court parsing and display-board adapters | All 41 continue to pass |

Upload tests create temporary files and remove them in `finally`. ZIP fixtures are minimal local-header records for scanner branches, not complete extraction/antivirus integration tests. PDF fixtures exercise signature and active-content checks, not full PDF validity. These passing cases do not certify the scanner against all malicious documents.

## TypeScript and build findings

`./node_modules/.bin/tsc --noEmit --incremental false` reports:

- `app/auth/forgot-password/page.tsx:22`: implicit `any` event parameter.
- The same file at lines 36, 38, 40, 43 and 49: caught `err` has type `unknown`.
- `components/ui/calendar-shadcn.tsx:23`: `selected` does not exist on `CalendarProps`.
- The same file at line 111: props do not satisfy the `DayPickerProps` union.

`next.config.mjs` sets both `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` to true, so a future successful build alone would not establish type/lint correctness. Lint was not executed; no lint result is claimed.

The build attempted font downloads for Geist, Geist Mono and Noto Sans and failed on DNS resolution. Repeat it in an environment with font access, or separately implement local font hosting. This run cannot establish whether there are additional compilation/rendering failures after the fonts load.

## Remaining acceptance and edge-case matrix

These cases are **not executed**, not passes. Use isolated test accounts/data and controlled external-service configurations for the next integration/browser pass. The older [QA_TEST_PLAN.md](QA_TEST_PLAN.md) provides additional workflow steps; its historical pass/fixed labels do not represent this run.

| Area | Acceptance workflow | Important remaining edges |
| --- | --- | --- |
| Registration and verification | Lawyer/client email and Google registration; verify then sign in | Duplicate email, unverified email, missing role, Firebase/backend partial failure and rollback, resend limits |
| Login and account recovery | Email/Google login; conflict dialog; forced device logout; password reset | Wrong password, expired reset token, rapid submission, popup cancellation, multi-tab logout, inactivity timeout |
| Dashboard | Login as each role; compare summary/charts to seeded case/event totals; save/reload layout | Zero cases, failed summary API, long titles, invalid dates, approval reminders, keyboard/mobile layouts |
| Cases | Create, view, edit, delete; add legal team/parties; transfer | Duplicate case numbers/CNR, unrelated-user access, stale edits, deletion with linked documents/events, role-dependent requirements |
| Documents | Real upload/download, share, favorite, review/approve/reject/delete | Oversize uploads, interrupted upload, unauthorized download, storage expiry, concurrent review, zero-byte content, antivirus availability |
| Hearings/calendar | Create, reschedule and cancel hearing; compare calendar/dashboard | End before start, all-day event, IST/UTC midnight boundaries, invalid case ID, overlapping events, reminders |
| Organization | Admin invites advocate; advocate accepts; select advocate filter | Expired/duplicate invite, removed member, cross-organization resource access, malformed selection via actual API |
| Messages | Two test users exchange messages; verify delivered/seen/unread | Disconnect/reconnect, ordering, empty/oversize content, delete scope, unrelated group access |
| Notifications | Trigger workflow notification, follow link, mark read | Unsafe persisted links in browser, stale/deleted resource, repeated socket delivery, mark-all-read consistency |
| Court integrations | Load judges/captcha, search cause list, display personalized board | Wrong/expired captcha, upstream outage/maintenance/schema change, empty date, state/bench mismatch, live provider accuracy |
| AI Prep / NyaAI | Ask about an authorized case; generate brief/practice/weaknesses | Empty/large prompt, no documents, AI timeout, confidential case isolation, streaming interruption and provider failure |
| Subscription/billing | Test-mode order, payment verification, cancellation, access limits | Invalid signature, payment retries/webhook duplication, dismissal, expired subscription, unauthorized admin action |
| Profile/admin/reports | Save profile/security/preferences; role-restricted admin pages; export reports | Read-only admin, empty data, invalid pagination/date ranges, CSV content, revoked access, persisted session-limit setting |

No production server, database, scheduler, email sender, payment flow or AI provider was started by the added tests. The backend server starts scheduled work, so database and live-service checks should use a separately configured integration environment.

## Run again

From the workspace root, run each command independently:

```sh
npm --prefix Adhivakta_backend test
npm --prefix Adhivakta_frontend test
npm --prefix Adhivakta_frontend run build
```

For types, run this inside `Adhivakta_frontend`:

```sh
./node_modules/.bin/tsc --noEmit --incremental false
```

The frontend tests use the existing TypeScript compiler only to load JS/TS modules into Node; that transpilation is not a substitute for the separate type check. The dashboard parity test intentionally needs the sibling backend repository in this workspace. No production code was modified; the frontend package gained an `npm test` script.
