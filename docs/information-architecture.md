# Information Architecture - Adhivakta Dashboard

## 1. Scope
This IA covers the authenticated dashboard experience in:
- `Adhivakta_frontend/app/dashboard/*`
- Related dashboard components and backend access/domain models in:
- `Adhivakta_backend/controllers/*`
- `Adhivakta_backend/models/*`

The architecture is case-centric: almost every workflow is anchored to a `Case` record.

## 2. Primary Users
- `lawyer`
- `client`
- `admin`

Notes from current behavior:
- Lawyers and clients can create cases.
- Access to a case is granted when user is creator, primary lawyer/client, or listed in `lawyers[]` / `clients[]`.
- Deleting a case is restricted to primary lawyer or primary client.

## 3. Navigation Architecture

### 3.1 Global Frame
- App shell: `Header + Sidebar + Main Content`
- Sidebar = primary navigation
- Header = utility navigation (search, notifications, profile menu)

### 3.2 Primary Navigation (Sidebar)
- `Dashboard` -> `/dashboard`
- `Cases` -> `/dashboard/cases`
- `Clients & Parties` -> `/dashboard/clients-parties`
- `Hearings` -> `/dashboard/hearings`
- `Calendar` -> `/dashboard/calendar`
- `Documents` -> `/dashboard/documents`
- `Messages` -> `/dashboard/messages`
- `Settings` -> `/dashboard/settings`

### 3.3 Utility Navigation (Header)
- Notifications -> `/dashboard/notifications`
- Profile -> `/dashboard/profile`
- Settings -> `/dashboard/settings`
- Logout

### 3.4 Secondary/Supporting Routes (currently outside primary nav)
- `/dashboard/help`
- `/dashboard/reports`
- `/dashboard/lawyers`

## 4. Sitemap (Current Route Map)

```text
/dashboard
  /calendar
  /cases
    /new
    /[id]
    /[id]/edit
  /clients-parties
  /documents
  /hearings
  /help
  /lawyers
  /messages
  /notifications
  /profile
  /reports
  /settings
```

## 5. Domain Information Architecture (Data Model)

### 5.1 Core Object
- `Case`
- Core fields: title, caseNumber, caseType, status
- Court metadata: state, district, bench, courtType, court, hall, complex
- Timeline: filingDate, hearingDate, nextHearingDate
- Legal metadata: priority, stage, actSections, reliefSought, notes

### 5.2 Nested/Related Objects
- `Parties`
- `parties.petitioner[]`
- `parties.respondent[]`
- `People`
- `lawyers[]` (structured, can map to user)
- `clients[]` (structured, can map to user)
- `advocates[]` (client-side advocate entries)
- `stakeholders[]` (witness/expert/other)
- `Documents`
- many documents per case
- category, status, tags, file metadata, access controls
- `Events`
- many events per case
- hearing + non-hearing events
- status, priority, schedule/location
- `Messages`
- one case chat `Group` + many `Message`
- group membership based on case participants
- `Notifications`
- user-level notices linked to case/event/document updates

### 5.3 Relationship Summary
- One case -> many documents
- One case -> many events
- One case -> one chat group -> many messages
- One case -> many people (lawyers/clients/advocates/stakeholders/parties)
- One user -> many accessible cases

## 6. Content Structure by Module

### 6.1 Dashboard
- KPI cards (active cases, clients, hearings)
- Recent cases list
- Priority alerts (urgent/high cases)
- Quick actions
- Recent activity (documents)

### 6.2 Cases
- Case list with filters/search
- Case create wizard (5 tabs)
  - Case Details
  - Court Info
  - Party Section
  - Documents
  - People
- Case details (tabbed)
  - Case details
  - People
  - Documents
  - Hearings
- Case edit

### 6.3 Hearings + Calendar
- Hearings list with status/type filters
- Calendar month/week view
- Add/edit/delete event
- Hearing data may be sourced from both `Event` and case `nextHearingDate`

### 6.4 Documents
- List and grouped-by-case views
- Upload and attach to case
- Filter by category/status/search
- View/download/delete + sharing hooks

### 6.5 Clients & Parties
- Aggregated person directory from case relationships
- Separate client and lawyer tabs
- Search by person and case metadata
- Jump to filtered case views

### 6.6 Messages
- Case group list
- Group chat thread (socket + API fallback)
- Participant sidebar
- Unread counters

### 6.7 Notifications
- User notification feed
- Mark read / mark all read / delete / clear all
- Optional deep-link to related resource

### 6.8 Settings & Profile
- Profile
- Password
- Notification preferences
- Security
- Appearance
- Subscription

## 7. Taxonomy and Facets

### 7.1 Case Taxonomy
- Case type: civil, criminal, family, commercial, writ, arbitration, labour, revenue, motor_accident, appeal, revision, execution, other
- Status: active, closed (UI also surfaces pending in places)
- Priority: low, normal/medium, high, urgent
- Stage: filing, pre_trial, trial, arguments, judgment, appeal, execution

### 7.2 Event Taxonomy
- Types: hearing, case_filing, evidence_submission, client_meeting, court_visit, mediation, arbitration, judgment, appeal
- Status: scheduled, confirmed, cancelled, completed, adjourned
- Priority: low, medium, high, critical

### 7.3 Document Taxonomy
- Categories include: pleading, affidavit, evidence, contract, judgment, order, notice, memo, report, civil, criminal, family, motor_accident, commercial, other
- Status: draft, active, archived, deleted

## 8. Permissions Architecture (Practical Matrix)

| Capability | Lawyer | Client | Admin |
|---|---|---|---|
| View associated cases | Yes | Yes | Yes |
| Create case | Yes | Yes | Yes |
| Edit associated case | Yes | Yes | Yes |
| Delete case (primary role only) | Yes | Yes | Yes |
| Upload case documents | Yes (authorized case) | Yes (authorized case) | Yes |
| Schedule/update events | Yes | Limited in UI | Yes |
| Use case chat groups | Yes | Yes | Yes |

## 9. Key User Journeys

### 9.1 Lawyer Case Intake
1. Open `/dashboard/cases/new`
2. Complete 5-tab wizard
3. Save case
4. Optional document upload
5. Auto-creates chat group and notifications/invites for participants
6. Redirect to case details

### 9.2 Client Case Intake
1. Same wizard path
2. Creator is enforced as primary client
3. Add advocates/lawyers and additional parties
4. Save and move into case workspace

### 9.3 Ongoing Case Management
1. Browse/filter in `/dashboard/cases`
2. Open `/dashboard/cases/[id]`
3. Work across details, people, documents, hearings
4. Use linked modules: documents, calendar/hearings, messages

### 9.4 Scheduling and Follow-up
1. Create hearing/event from calendar or case
2. See event in hearings list + calendar
3. Update status/outcome
4. Notify participants

## 10. IA Gaps to Resolve (Important)
- Navigation mismatch: routes like `notifications`, `profile`, `help`, `reports`, `lawyers` exist but are not consistently represented in primary nav.
- Duplicate dashboard implementation exists (`components/dashboard/NewDashboard.jsx` and `app/dashboard/page.jsx`), increasing IA drift risk.
- Some UI links target routes that are not present in app routing (`/dashboard/calendar/new`, `/dashboard/documents/upload`).
- Global search in header is present but not connected to a canonical search results architecture.
- Naming drift in backend filters (`creator` vs `createdBy`) can cause inconsistent summary behavior and user trust issues.

## 11. Recommended Canonical IA (Next Iteration)
- Keep `Case` as system anchor and enforce cross-module deep links from case context.
- Define two nav tiers clearly:
  - Primary work modules: Dashboard, Cases, Hearings, Calendar, Documents, People, Messages
  - Account/system modules: Notifications, Profile, Settings, Help
- Introduce a shared filter vocabulary across list pages (status, priority, date range, case type, owner/role).
- Create one source-of-truth route registry and remove orphan/dead links.
- Add a unified search architecture with scoped results (`cases`, `documents`, `people`, `messages`).

