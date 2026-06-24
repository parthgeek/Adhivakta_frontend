# Adhivakta — QA Test Plan & Flow Verification

**Scope:** Frontend (`Adhivakta_frontend`, Next.js App Router) against backend API (`NEXT_PUBLIC_API_URL`, default `http://localhost:5050/api`).
**Date:** 2026-06-24
**Build status at time of QA:** `pnpm build` → exit 0 (clean, no compile errors) on all 40 routes.

> Legend — **P0** blocker, **P1** major, **P2** minor. Status: ✅ pass / ⚠️ needs backend / 🐞 bug / 🔧 fixed.

---

## 1. Summary of findings

| # | Severity | Area | Finding | Status |
|---|----------|------|---------|--------|
| B1 | P1 | Auth / API | `services/api.js` calls `window.__authLogout()` on every 401, but nothing ever assigned it → auto-logout on expired/invalid token was dead code. Users stayed on a broken dashboard after the backend rejected their token. | 🔧 fixed — `auth-context.js` now sets `window.__authLogout = logout`. |
| B2 | P1 | Auth / Login | New Google users (no account yet) trigger `requiresRole`, but `login-form.jsx` never opened the role-selection dialog (`setShowRoleDialog(true)` was never called). The dialog was dead UI; new Google sign-in from the **login** page failed with a generic error. | 🔧 fixed — `login-form.jsx` now opens the role dialog on `error.requiresRole`. |
| O1 | P2 | Auth guard | `dashboard/layout.jsx` gate only checks that `localStorage["user"]` exists, not token validity. Token-expiry handling lives in `AuthProvider.validateSession`. With B1 dead, an expired session could render the shell before per-call 401s. B1 fix closes most of this gap. | Observation |
| O2 | P2 | Login form | "Remember me" checkbox state is set but never used (no effect on token persistence/expiry). | Observation |
| O3 | P2 | Dead code | `context/auth.tsx` is not imported anywhere (the live provider is `context/auth-context.js`). Safe to delete to avoid confusion. | Observation |

All fixes were re-verified with `pnpm build` → exit 0.

---

## 2. Environment / preconditions

- Backend running at `NEXT_PUBLIC_API_URL`; Firebase project configured; Razorpay + reCAPTCHA keys set (see `.env`).
- Socket server at `NEXT_PUBLIC_SOCKET_URL` for realtime chat/notifications/counts.
- Test accounts: at least one **lawyer/advocate** and one **client**; one unverified email account.
- `middleware.ts`: when `PROTECT_SITE=true`, the whole site is behind HTTP Basic auth (`ADMIN_USER`/`ADMIN_PASS`). Verify both protected and unprotected modes.

---

## 3. Flow-by-flow test cases

### 3.1 Registration  (`/auth/register`, `register-form.jsx`, `register-form-email.jsx`)

| ID | Test case | Steps | Expected |
|----|-----------|-------|----------|
| REG-01 | Email register happy path | Pick role → email form → valid name/email/pwd(≥6) → submit | Firebase user created, verification email sent, backend register OK, redirect to verification-sent. Firebase session signed out (no auto-login). |
| REG-02 | Register without role | Click Google/email before selecting account type | Blocked with "Account Type Required". |
| REG-03 | Google register | Select role → Continue with Google → consent | Account created with chosen role, redirect to dashboard. |
| REG-04 | Duplicate verified email | Register with an email that already has a verified account | "An account already exists… please sign in." No duplicate created. |
| REG-05 | Duplicate **unverified** email | Re-register same unverified email | Verification email re-sent; no crash. |
| REG-06 | Backend failure rollback | Force backend register to fail | Firebase user is deleted (rollback) — verify no orphan Firebase account. |

**Edge cases:** password exactly 6 chars (accept) / 5 chars (reject); email with leading/trailing spaces; invalid email format; role tampered to something other than lawyer/client → coerced to `client` (`auth-context.js:284`); network drop mid-register; Firebase reachable but backend down.

### 3.2 Email verification  (`/auth/verification-sent`, `email-verification.jsx`)

| ID | Test case | Expected |
|----|-----------|----------|
| VER-01 | Resend verification | New email sent; rate-limit message on rapid repeat (`auth/too-many-requests`). |
| VER-02 | Verify then login | After clicking link, login succeeds; unverified login blocked with `auth/email-not-verified`. |
| VER-03 | `checkEmailVerified` polling | Reflects verified state from backend `getMe` or Firebase `reload()`. |

### 3.3 Login  (`/auth/login`, `login-form.jsx`)

| ID | Test case | Expected |
|----|-----------|----------|
| LOG-01 | Email login happy path | Valid creds → token+user stored → redirect `/dashboard`. |
| LOG-02 | Wrong password | "Invalid email or password." (covers `auth/invalid-credential`,`auth/wrong-password`). |
| LOG-03 | Unknown account | "No account found… sign up first." |
| LOG-04 | Unverified email | Blocked with verify-email message. |
| LOG-05 | Backend→Firebase fallback | Backend login fails (non-409) → Firebase path attempted (`auth-context.js:246`). |
| LOG-06 | **Active session conflict** | `ACTIVE_SESSION_EXISTS`/409 → conflict dialog → "Logout previous device" → `forceLogin` succeeds, "Previous session closed" toast. |
| LOG-07 | Google login existing user | Redirect to dashboard; `previousSessionTerminated` toast when applicable. |
| LOG-08 | **Google login new user (B2)** | Role dialog opens → select Advocate/Client → account created → dashboard. *(Was broken before fix.)* |
| LOG-09 | Google account-not-found | Error + auto-redirect to `/auth/register` after 2s. |
| LOG-10 | Too many attempts | `auth/too-many-requests` message. |

**Edge cases:** submit with empty fields (HTML `required` blocks); rapid double-submit (button disabled while loading); cancel popup mid-Google login; `remember` toggled (currently no effect — see O2); login while already authenticated.

### 3.4 Forgot / reset password  (`/auth/forgot-password`)

| ID | Test case | Expected |
|----|-----------|----------|
| PWD-01 | Request reset, existing email | Backend check + Firebase reset email sent; success message. |
| PWD-02 | Unknown email | Friendly "No account found" (mapped from `auth/user-not-found`). |
| PWD-03 | Invalid email format | "Please enter a valid email address." |
| PWD-04 | Rate limited | "Too many attempts… try later." |
| PWD-05 | Reset via token | `resetPassword(token,…)` sets new password; expired/invalid token rejected. |

### 3.5 Session lifecycle (cross-cutting — `auth-context.js`, `dashboard/layout.jsx`)

| ID | Test case | Expected |
|----|-----------|----------|
| SES-01 | Token expiry on load | Expired JWT (exp within 30s skew) → `logout()` → redirect login. |
| SES-02 | `validateSession` throttle | Re-validation skipped within 30s window unless forced. |
| SES-03 | **401 from any API call (B1)** | Backend returns 401 → `window.__authLogout()` fires → user logged out & redirected. *(Was dead before fix.)* |
| SES-04 | Inactivity timeout | No activity for `sessionTimeout` minutes (default 30) → redirect `/auth/login?reason=timeout`. |
| SES-05 | Activity resets timer | Mouse/key/scroll/touch resets inactivity countdown. |
| SES-06 | Logout other sessions | Settings → "Logout other sessions" keeps current device signed in. |
| SES-07 | Direct dashboard URL when logged out | No `user` in storage → redirect `/auth/login`. |

**Edge cases:** malformed JWT (try/catch → treated expired); `sessionTimeout` set to 0/negative/NaN → falls back to 30 min (`layout.jsx:50`); clock skew; multi-tab logout consistency.

### 3.6 Dashboard home  (`/dashboard`, `dashboard/page.jsx`)

| ID | Test case | Expected |
|----|-----------|----------|
| DSH-01 | Summary stats | Cards show totals; falls back to zeros if API empty (`api.dashboard.getSummary`). |
| DSH-02 | Cases-by-status / category / court-state charts | Render distributions; empty-state shown when no cases. |
| DSH-03 | Upcoming hearings table | Shows next ≤5 future events sorted ascending; empty-state otherwise. |
| DSH-04 | Cause-list search card | Auto-selects nearest upcoming-hearing case; load eCourts judges → captcha → fetch. |
| DSH-05 | Captcha refresh | "Refresh Captcha" reloads image with cache-busting nonce. |
| DSH-06 | Captcha error auto-refresh | Server error matching `/captcha/i` auto-refreshes captcha. |
| DSH-07 | Personalized cause list preview | Latest saved list renders; empty/loading/error states. |
| DSH-08 | Approval-review reminder | `document_review_request` unread notifications surface; "remind later" suppressed via sessionStorage; logout reminder shown once. |

**Edge cases:** case with no hearing date (excluded from recommendation, falls back to most-recent then first); invalid date strings (`toValidDate` guards); court-hall normalization ("Court No. 5" → "5"); 0 cases (all empty-states); very long case titles (truncation).

### 3.7 Cases  (`/dashboard/cases`, `new`, `[id]`, `[id]/edit`, `[id]/prep`)

| ID | Test case | Expected |
|----|-----------|----------|
| CAS-01 | List cases + filters | `getAll` with filters; high limit (1000) returns all without pagination. |
| CAS-02 | Create case (manual) | Required fields validated; case persisted; redirect to detail. |
| CAS-03 | Auto-fill by case number (eCourts) | Load captcha → enter → fetch → fields populated. |
| CAS-04 | Auto-fill by CNR | CNR captcha → fetch → populate. |
| CAS-05 | Captcha refresh / wrong captcha | Refresh works; wrong captcha shows error, allows retry. |
| CAS-06 | View case detail | Timeline, documents, parties, hearings load. |
| CAS-07 | Edit case | Update persists; concurrent stale-edit handled. |
| CAS-08 | Delete case | Confirm dialog; removed from list; related views update. |
| CAS-09 | Add client/lawyer by email | `addClientByEmail`/`addLawyerByEmail`; unknown email error surfaced. |
| CAS-10 | Case transfers | List/add/update/delete transfer records. |
| CAS-11 | Send reminder | `sendReminder(id)` triggers notification. |

**Edge cases:** captcha session expiry between load and fetch; duplicate case number; adding self/duplicate party; transferring to nonexistent user; deleting a case referenced by events/documents.

### 3.8 Documents  (`/dashboard/documents`)

| ID | Test case | Expected |
|----|-----------|----------|
| DOC-01 | Upload with progress | XHR progress events update bar; success adds doc. |
| DOC-02 | Upload to a case | `uploadToCaseId` attaches to case. |
| DOC-03 | Invalid file / oversize | Backend rejection surfaced via parsed error message. |
| DOC-04 | Review / approve / reject | `review(id,…)` updates status; approver notified. |
| DOC-05 | Share with users | `share(id,users)`; shared users gain access. |
| DOC-06 | Favorite toggle | `toggleFavorite` flips state. |
| DOC-07 | Delete | Confirm → removed. |

**Edge cases:** network error during upload (`xhr.onerror` → "Network error…"); non-JSON server response (handled); 0-byte file; very large file; concurrent uploads; share with empty user list.

### 3.9 Calendar / Hearings / Events  (`/dashboard/calendar`, `/dashboard/hearings`)

| ID | Test case | Expected |
|----|-----------|----------|
| EVT-01 | Create event/hearing | Persisted; appears on calendar + dashboard upcoming. |
| EVT-02 | Edit / reschedule | Updated time reflected everywhere. |
| EVT-03 | Delete event | Removed from all views. |
| EVT-04 | Notify | `sendNotification(id)` delivers reminder. |
| EVT-05 | Filter by case | `getByCaseId` returns that case's events. |

**Edge cases:** all-day vs timed events; past-dated events (excluded from "upcoming"); timezone rendering (`en-IN`/`en-US` locale formatting); event with no linked case.

### 3.10 Cause list & display board  (`/dashboard/cause-list`, `/search`, `/display-board`)

| ID | Test case | Expected |
|----|-----------|----------|
| CL-01 | Daily cause list by date | `getDaily(date)` renders entries. |
| CL-02 | Search by case | Judges → captcha → `searchForCase`; matches table or empty state. |
| CL-03 | Search by court | `getJudgesForCourt` → `searchForCourt`. |
| CL-04 | Personalized live | `startPersonalizedLive` → captcha → `searchPersonalizedLive`; latest saved via `getLatestSavedPersonalized`. |
| CL-05 | High court display board | `getHighCourtDisplayBoard(stateCode)` + personalized variant. |

**Edge cases:** captcha expiry/refresh loop; no entries for date; state with no high court; date in far future (`max=2099-12-31`); switching civil/criminal resets context (verify captcha/options reload).

### 3.11 Clients-Parties & Lawyers  (`/dashboard/clients-parties`, `/dashboard/lawyers`)

| ID | Test case | Expected |
|----|-----------|----------|
| CP-01 | List clients/parties | Renders; empty state when none. |
| CP-02 | Lawyer/legal-team summary | `formatLegalTeamSummary` renders correctly. |

**Edge cases:** party object vs string (`safeText` guards); missing names → initials/fallbacks.

### 3.12 Messages / Chat  (`/dashboard/messages`, `lib/socket.js`)

| ID | Test case | Expected |
|----|-----------|----------|
| MSG-01 | Load groups + messages | `getGroups`, `getMessages(groupId,limit)`. |
| MSG-02 | Send message | Optimistic send; appears for both sides via socket. |
| MSG-03 | Delivered / seen | `markAsDelivered` / `markAsSeen` update ticks; `markAsRead` aliases seen. |
| MSG-04 | Archive / unarchive / pin / unpin | State toggles persist. |
| MSG-05 | Delete message (me / everyone) | `deleteMessage(id, scope)` respects scope. |
| MSG-06 | Unread counts | `getUnreadCounts` + realtime context badge accurate. |

**Edge cases:** socket disconnect/reconnect; sending to archived group; deleting already-deleted message; empty message body; very long message; message ordering on rapid sends.

### 3.13 Notifications  (`/dashboard/notifications`, `NotificationListener.jsx`, `UseNotifications.jsx`)

| ID | Test case | Expected |
|----|-----------|----------|
| NOT-01 | List | `getAll`; newest first. |
| NOT-02 | Unread count | `getUnreadCount` uses `/count`, falls back to client-side filter on 404. |
| NOT-03 | Mark as read | `markAsRead(id)`; badge decrements. |
| NOT-04 | Delete | Removed. |
| NOT-05 | Realtime push | Socket-driven new notification appears without refresh. |
| NOT-06 | Deep link | `getNotificationTarget`/`getNotificationLink` routes to correct entity. |

**Edge cases:** `/count` endpoint missing (404 fallback path, `api.js:1162`); notification with no `createdAt` (sort guard); unknown notification type link fallback.

### 3.14 Profile & Settings  (`/dashboard/profile`, `/dashboard/settings`)

| ID | Test case | Expected |
|----|-----------|----------|
| SET-01 | Update profile | `users.updateProfile`; persisted + reflected in header. |
| SET-02 | Change password | `auth/changePassword` or `users.changePassword`; wrong current pwd rejected. |
| SET-03 | Appearance | `updateAppearance` (note: theme forced light in provider — verify intended). |
| SET-04 | Notification prefs | `updateNotifications` persists. |
| SET-05 | Security / session timeout | `updateSecurity`; `sessionTimeout` written to localStorage drives SES-04. |
| SET-06 | Subscription settings | Current plan, payment history, cancel. |

**Edge cases:** password mismatch/confirm; weak new password; timeout value persisted as string; appearance change vs forced light theme.

### 3.15 Pricing & Subscriptions  (`/pricing`, `subscription-*`)

| ID | Test case | Expected |
|----|-----------|----------|
| SUB-01 | View plans by role | `getPlans(role)`; correct plans per advocate/client. |
| SUB-02 | Plan by slug | `getPlanBySlug`. |
| SUB-03 | Create order | `createOrder(planId)` returns Razorpay order. |
| SUB-04 | Verify payment | `verifyPayment` on success → plan active. |
| SUB-05 | Payment failure/cancel | Order not activated; user informed. |
| SUB-06 | Cancel subscription | `cancel(reason)`; status updated. |
| SUB-07 | Can-create-account gate | `canCreateAccount` enforced where used. |

**Edge cases:** Razorpay modal dismissed; payment verified but webhook lag; cancel with empty reason; expired plan.

### 3.16 AI Prep Room  (`/dashboard/ai-prep-room/*`)

| ID | Test case | Expected |
|----|-----------|----------|
| AI-01 | Ask | Query returns response; loading + error states. |
| AI-02 | Brief / Practice / Weaknesses / Activity | Each sub-route loads its data and renders. |
| AI-03 | Case prep (`cases/[id]/prep`) | Per-case prep loads. |

**Edge cases:** empty prompt; long response streaming; backend/AI timeout; case with no data to prep.

### 3.17 Misc routes  (`/dashboard/help`, `/dashboard/reports`)

| ID | Test case | Expected |
|----|-----------|----------|
| MIS-01 | Help page | Static content + loading skeleton render. |
| MIS-02 | Reports | Report data renders; empty state. |

### 3.18 Site protection middleware  (`middleware.ts`)

| ID | Test case | Expected |
|----|-----------|----------|
| MW-01 | `PROTECT_SITE` unset/false | Site served normally. |
| MW-02 | `PROTECT_SITE=true`, no auth header | 401 + Basic realm prompt. |
| MW-03 | Correct/incorrect Basic creds | Correct → pass; wrong → 401. |

**Edge case:** malformed `Authorization` header (no `Basic ` prefix) — currently `auth.split(" ")[1]` may be undefined → `Buffer.from(undefined)` throws; consider guarding if Basic-auth mode is used in production.

---

## 4. Regression checklist after the two fixes

1. Email login still works (B1 didn't break the success path). — verify LOG-01.
2. Expired token now logs the user out instead of showing a broken dashboard. — verify SES-03.
3. Google login for an **existing** user still goes straight to dashboard (B2 fix only triggers on `requiresRole`). — verify LOG-07.
4. Google login for a **new** user now opens the role dialog. — verify LOG-08.
5. Session-conflict dialog still appears before any role dialog (order of checks preserved). — verify LOG-06.

---

## 5. Recommended follow-ups (not changed — need product decision)

- **O1:** Have `dashboard/layout.jsx` also validate token expiry (or rely solely on `AuthProvider`) to avoid double sources of truth for "is logged in".
- **O2:** Wire "Remember me" to actually control token persistence, or remove the control.
- **O3:** Delete unused `context/auth.tsx`.
- **MW edge:** Guard malformed `Authorization` header in `middleware.ts` when `PROTECT_SITE=true`.
- Add automated coverage: Playwright E2E for auth + cases + cause-list captcha flows; unit tests for `auth-context` token-expiry and `services/api` 401 handling.

---

## 6. How to run

```bash
cd Adhivakta_frontend
pnpm install
pnpm build          # static verification (passes)
pnpm dev            # manual flow testing at http://localhost:3000
```
Backend must be running at `NEXT_PUBLIC_API_URL` for any data-dependent (⚠️) case.
