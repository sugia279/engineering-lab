# Backend API + DB progress

## Milestone 0 — design freeze (2026-11-14)

- Branch: `feat/backend-foundation`; baseline `main@f3efbf33bc3f4dd75421b77762a96ab8bf1d5736`. Milestone commit: the commit containing this section (see `git log -- docs/project/backend-progress.md`).
- PR #19 was open/draft/unmerged; plan copied unchanged from `docs/backend-api-db-plan@c05ef1967098646ae125e0927c64c4ea0328da0e` before implementation. Existing main commits/archives/assets preserved.
- Read AGENTS.md and required README/business/architecture/development documents; only related auth/comments/routes/workflow code examined.
- Done: [ADR](../decisions/0001-backend-foundation.md), scoped checksum [inventory](backend-inventory.json), permissions/schema/rollback freeze and [load targets](backend-load-test.md). Full plan remains proposed beyond the accepted Phase 0–1 slice.
- Decisions: keep Pages/Astro/Git writers; local Supabase foundation, memory-only auth, owner by verified UUID, caller-scoped JWT, DB RPC authority; author-only text editing; owner moderation; production writes disabled.
- Checks: inventory generation succeeded; no imports, deploys or cloud writes. OpenAPI contract added with Phase 1 implementation. Runtime tests pending.
- Blockers: no Docker/Supabase runtime initially installed; cloud/OAuth/owner/billing unset. Inventory is a source checksum baseline, not an import rehearsal or proof of entity/author mapping.
- Next: implement migration/RLS/RPC/API/auth shells, automated negative permission tests; report embedded PostgreSQL versus real Supabase coverage separately.

## Milestone 1A — local foundation implementation (2026-11-14)

- Branch: `feat/backend-foundation`; Phase 0 commit `877dd4a`. Implementation commit: the commit containing this milestone (`git log -- docs/project/backend-progress.md`).
- Done: pinned SDK/CLI/Deno; local config (no cloud link); fresh migration for profiles/owner/entities/comments/revisions/audit; explicit grants + RLS + private transactional RPC; author-only edit/delete, owner moderation, pending/public separation, optimistic versions, idempotent create, 30/member/min mutation quota, DB kill switch default false.
- Done: portable DTOs, [OpenAPI](../api/backend-v1.openapi.json), thin caller-JWT Edge routes, strict CORS/input/body-size/cursor errors and request-ID-only logs; API client; memory-only PKCE popup auth and VI/EN account/callback/admin shells (no comment composer or moderation UI).
- Decisions: no email profile mirroring; no moderator role; owner does not edit another author's body; approved replies disappear publicly when their root is hidden. Every existing feature remains Git-backed. Cloud envs/production workflows unchanged. Separate backend CI only tests, never deploys.
- Verified so far: 22 backend tests pass (embedded PostgreSQL + HTTP/client/SDK transport), 227 existing unit tests pass, Deno entry/import graph typecheck passes, Astro check 0 errors/0 warnings; 87 published content entries validated. SQL syntax issue found by fresh migration test was fixed before passing; no checks bypassed.
- Tooling: `tsx` CLI cannot open its local IPC pipe in this executor; documented `node --import tsx scripts/<name>.ts` equivalent used for validation/build gates. Initial Deno registry fetch failed; using existing pinned node_modules with `--node-modules-dir=manual` succeeds without network resolution.
- Blockers / unverified: `supabase start` fails because Docker and Podman are absent. Embedded DB uses real PostgreSQL semantics with a minimal auth schema and simulated claims; no real Auth-issued JWT/PostgREST/Edge gateway, OAuth browser/provider, multi-session race, cloud staging, backup/restore or load measurements yet. Supplied full-stack integration command is deliberately environment-required; it has not passed here.
- Missing external setup: owner-controlled Supabase account, region/tier/billing, OAuth app/callback, verified owner auth UUID, secure local/staging env configuration. No secrets requested or committed.
- Next: finish existing-site quality gates, review diff and save final verification milestone; then run full local stack + real-JWT/OAuth checks on a container-enabled machine. Phase 2 UI/import/shadow reads/cutover stay deferred.

## Milestone 1B — Pages compatibility and browser bundle (2026-11-14)

- Branch `feat/backend-foundation`; implementation `c9be4da`; follow-up commit is the commit containing this section.
- Existing static build/routes pass: 93 smoke tests (including 6 VI/EN backend shells), artifact verification 26/26, 21,530 links / 0 broken, HTML validation. Default Pages budgets pass 1277/1277 (515 KiB JS, existing 600,000-byte limit unchanged).
- The first build exposed a real regression: full Supabase browser SDK pushed total JS to 742 KiB. Fixed by using the matching pinned auth-only SDK in browser and statically omitting the backend module from the default disabled Pages build. SDK remains on Edge/Node only. This does not enable production login or comments.
- Edge and browser both reject configured secret/service-role keys. SDK transport test checks caller Authorization and singular RPC representation. Added committed-response guard and same-origin callback privacy metadata; no raw error/token/body logging.
- Still unverified: provider popup behavior, actual local Supabase, staging and performance. Disabled production build budgets do not establish latency/capacity or approval to enable backend.

## Milestone 1C — final local verification and remaining gates (2026-11-14)

- Branch `feat/backend-foundation`; design `877dd4a`, foundation `c9be4da`, browser isolation `f33a126`. Final verification commit: the commit containing this section. Main ref rechecked: still `f3efbf33bc3f4dd75421b77762a96ab8bf1d5736`, no intervening commits to merge.
- Phase 0 deliverables complete for the accepted slice. Phase 1 implementation is present locally, **exit gate is NOT complete** until real Supabase/Auth/browser/staging checks pass. No claim of a production-ready backend.
- Passed: 22 backend tests, 227 existing unit tests, Deno check, Astro check (0 errors/warnings), content validation (87 published entries), default production build, 93 smoke tests, artifact 26/26, 21,530 links with 0 broken, HTML validation, default Pages budgets 1277/1277. Tests use synthetic fixtures; no real submissions, API provisioning or production deploy.
- Enabled configuration build also compiles, but **raw total JS is 639,687 bytes, exceeding the unchanged 600,000-byte existing budget**. Default disabled build is 527,621 bytes. This is a known release blocker before enabling backend in Pages, not a passing enabled-mode performance gate. An alternative minifier experiment did not solve it and was reverted; no unrelated graph code or budget threshold was changed. Decide/implement a measured per-route loading/budget strategy before any enablement; do not silently raise or bypass the existing check.
- Browser smoke attempt could not launch Chromium: executor denies its singleton socket. Real popup/login/callback/logout/refresh browser verification remains unperformed; unit tests of message origin/source and memory storage are not equivalent.
- Full Supabase start remains blocked by missing Docker/Podman; JWT/Auth/PostgREST integration runner is supplied but not run. No multi-session concurrency, staging, backup restore, cloud quota/IP protection or load benchmark was verified. 10–20 RPS steady, 50 RPS burst, p95 <2s are targets to measure, with read-only k6 harness and mixed-write plan prepared.
- Next in order: container-enabled machine → fresh local reset and real-JWT direct-RPC tests → GitHub OAuth provider/browser tests and owner bootstrap → enabled Pages bundle gate → staging/account/region/tier setup after owner decisions → Phase 2 composer/moderation UI/import rehearsal. Existing features remain Git mode throughout this work.

## Published review branch

Branch: `feat/backend-foundation`. Git HTTPS push was unavailable in the executor, so GitHub's connected API published the same trees (each tree SHA compared exactly to local Git before publishing). Commit authorship metadata differs; original local milestone commits remain preserved locally.

| Milestone | Local commit | Published commit |
| --- | --- | --- |
| Design freeze | `877dd4a` | `03cfb8cdcf37807a6d18e0694b2019496c40c4c0` |
| Foundation | `c9be4da` | `da8c89a16dfd43c5684ca338978b1adb5964ea38` |
| Browser isolation | `f33a126` | `ef59149f50d3cfbd2f2c0d3d4e6db2bace5da4d1` |
| Verification | `a52e056` | `84c88f5cc3891f97306974f8b3bf268320790ddf` |

The commit adding this mapping only updates this progress document. Review is draft; no merge, production deploy or cloud provisioning is performed. CI status must be checked separately from local results above.

## Milestone 1D — review CI (2026-11-14)

- Branch `feat/backend-foundation`; tested commit `69efa83b8bb84d9b91eebc4a37cf0442e32089d7`.
- [Site CI run 21](https://github.com/sugia279/hiens-nha/actions/runs/43614034234) succeeded, including all original quality gates and the default disabled-backend production build. [Backend foundation checks run 1](https://github.com/sugia279/hiens-nha/actions/runs/43614034312) succeeded (embedded DB/HTTP/client contracts and Deno check).
- [PR #21](https://github.com/sugia279/hiens-nha/pull/21) remains draft. This evidence does not close real Supabase/OAuth/browser, enabled-mode bundle, staging or performance gates listed above. No merge/deploy/cutover.
- The commit recording this result changes documentation only; runtime source is identical to the tested commit. Next step remains full local stack on a container-enabled machine and the known enablement blockers.
