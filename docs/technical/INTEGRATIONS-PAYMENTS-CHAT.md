# Integrations, payments and messaging — implementation checkpoint

Implemented routes are composed in `backend/src/server.js`. Admin settings UI: `/admin/integrations` (admin only). API credentials are write-only to browser clients, encrypted with AES-256-GCM and context binding. Version checks prevent overwriting concurrent edits; audit events contain field names, not secrets.

## Deployment variables
- `NIMKAT_SETTINGS_KEY`: mandatory in production, exactly 64 hexadecimal characters. Generate via `openssl rand -hex 32`, install through a server secret manager. Back up securely separately from database. Losing this key makes stored credentials/payment snapshots unreadable. Rotation requires decrypt/re-encrypt migration, not simply replacing the key.
- Development generates a local `settings.key` in the ignored data directory. Never commit it.
- `PUBLIC_SITE_URL`: canonical public HTTPS origin, used for gateway callbacks. Not inferred from browser headers.
- `OLLAMA_URL`: server-operator-controlled Ollama endpoint, defaults to local port 11434. No browser connection or admin-supplied arbitrary URL. Model installation/resources are external operational requirements.
- Existing auth variables/cookie/CSRF protections remain required (see AUTH-SESSIONS.md). Environment files are not automatically loaded by the API.

## Financial invariants
Amounts in the append-only double-entry ledger are integer rial; UI/legacy catalog uses toman. Legacy seeded wallet transactions are NOT real balance. New booking writes require an idempotency key. Holds expire after 15 minutes; seat claims are unique per class/seat. Only server-side gateway verification creates a journal/confirmed reservation. Late verified payments credit the wallet instead of reusing a released seat. Duplicate callback/reference cannot create a second journal. Sandbox payments use isolated sandbox ledger accounts, never spendable wallet funds or confirmed real bookings.

Paid structure currently charges **the entire reservation**, not one person's share. Split payments are not implemented. The approved booking box layout is retained; button explicitly states whole-reservation payment. Unconfigured gateway gives 503 rather than simulated success. Cancelled gateway return does not prove failure: intent remains pending for reconciliation. Automatic provider reconciliation, stalled intent recovery, refunds, cancellation policy and settlements remain pending.

## Messaging and support
Legacy globally readable seed chats are no longer exposed. Membership required on every read/write; public community requires explicit join. Confirmed bookings add the purchaser to a class room. Private rooms created by admin require an actual end timestamp and close 72h later. Full scheduling-bound lifecycle is not yet implemented for course rooms. Text-only messaging supports retry-safe client IDs, search, read cursors, typing, report and deletion. SSE persists no credentials in URL, revalidates session every 15s and caps connections. Events, presence and rate-limit maps are single-process only: Redis/pubsub/distributed quotas needed before multi-replica deployment. Attachments, invitations/self-service moderation and historical pagination UI remain pending.

Support API stores private user threads, knowledge articles, human escalation and admin replies. Knowledge engine only uses published articles (no seeded pretend answers). Optional Ollama runs server-side and has timeout/fallback; generated answers are not account/payment authority. Human presence is explicitly false, not fabricated. Support/admin inbox UI is implemented at `/admin/support`; model/provider end-to-end testing remains pending.

## Verified at this checkpoint
Backend unit/integration tests cover encrypted settings, idempotent verified payments, capacity, late payment wallet fallback, immutable balanced journal, chat membership/expiry and sandbox isolation. Frontend baseline unit tests, TypeScript and production build run separately. Provider calls are mocked: NOT certification of Kavenegar/Zarinpal connectivity. Support UI browser E2E checks are described below; payment/provider browser acceptance is still pending.

## Still NOT production ready
PostgreSQL/Redis, real schedule conflict prevention, teacher approval and user/teacher ownership mapping, classroom adapter (settings only), financial reconciliation/refunds/settlements, removal of remaining sample panel/catalog/club data, advanced support assignment/SLA and operational monitoring, complete editor parity, upload scanning, monitoring/backups/restore/load/security/UAT and provider sandbox/live acceptance all remain required. Do not interpret saved credentials or a successful build as production readiness.


## Responsive support desk checkpoint — 2026-10-20
- Global support launcher (not inside editor/admin): guests browse published guides; authenticated users start/resume private requests and view their recent history. Explicit human escalation and closed-history/new-request flow.
- `/admin/support`: status filters, exact request ID/name search, paging, private message history, retry-safe replies, reply-and-close, explicit reopen, knowledge creation/editing/publish/unpublish with optimistic version checks. Restricted by both frontend gate and backend admin role.
- Mobile-first full-screen dialog, visualViewport keyboard resizing, safe-area spacing, 16px inputs, 44px minimum actions, focus trap/return, inert background, Escape close, scoped CSS/brand tokens/Yekan Bakh. Admin uses one-pane drill-down below 900px and two panes above it. Long unbroken messages wrap instead of expanding layout.
- Support intentionally uses bounded HTTP polling (6s conversations / 10s inbox, only visible tabs); it does NOT label a human as online. Existing SSE events are emitted for future shared subscriptions. Messages remain stored after disconnect. Multi-instance quotas, real staffing presence, assignment/SLA, provider/model acceptance and physical-device keyboard testing are not certified by these changes.
- Browser checks: 320×640, 375×812, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080 and 844×390 landscape; widget bounds, no horizontal overflow, keyboard focus, full user→admin reply/close flow, guide editing and long messages. Chromium viewport tests do not substitute for Safari/iOS and actual Android keyboard/device UAT.
- Test data: run browser suites only on a disposable development database. Fixtures close their threads and unpublish their articles, but leave audit/history for traceability. Do not run against customer accounts or production. OTP cooldown is respected across suites, not disabled.

Validation at this checkpoint: backend 25/25, frontend unit 10/10, combined production-build browser suites 18/18 (including previous editor/auth/SSR/responsive checks); production Next build and TypeScript pass. No external provider verification or physical-device certification is implied.

## Teacher review and scheduling checkpoint
New `/admin/teaching` and `/teacher/application` UI/routes provide teacher application,
admin-only review and explicit one-to-one user→catalog-teacher linking (no name-based
or teacher-1 fallback). Approval is optimistic-version checked. This is an admin review
workflow, not automated identity verification or a complete teacher onboarding/document system.
Approved accounts can have class occurrences published by admin. UTC times are persisted;
forms/display explicitly use the browser's local timezone. Server checks future times,
15min–6h duration, teacher overlap and learner's existing held/confirmed booking overlap.
New bookings require exactly the requested number of unique future occurrence IDs, rechecked
inside the booking transaction. Cancellation of a held/confirmed session is blocked until a
proper financial refund flow exists. Expired holds no longer block cancellation. Confirmed
booking links are available at `/api/schedule/mine`; student calendar UI is not complete yet.
Class chat closes 72h after the recorded final session and includes the approved teacher;
new schedules after chat creation still need a complete lifecycle/reconciliation service.

This is NOT a full scheduling/production completion: rescheduling/refunds, recurring sessions,
course publication/creation approvals, travel buffers for in-person classes, document verification,
physical-device UAT, concurrent PostgreSQL deployment and real classroom joins remain pending.
Legacy seeded occupancy remains a catalog baseline, not proof of live students. Search now reads
`/api/classes` rather than hardcoded result cards and consumes hero kind/mode/subject/segment
choices. Some older ancillary catalog/panel widgets still need removal of seed/sample content.

Latest regression checkpoint: 29 backend tests, 10 frontend unit tests and all 26
production-build Playwright tests passed. Final browser run used an isolated development
data directory, preserving the preview database and all normal OTP throttling. Covers late
anonymous bootstrap after OTP, mobile login/reload, cross-site iframe login/reload, working
hero selectors/filter propagation, Yekan field styling, 320px paging, panel file-grid overflow,
and responsive teaching desk/booking controls. Build, TypeScript and whitespace checks pass.
Physical Safari/iOS/Android testing and all previously listed production work remain open.
