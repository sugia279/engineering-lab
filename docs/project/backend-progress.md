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
