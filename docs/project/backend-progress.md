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
