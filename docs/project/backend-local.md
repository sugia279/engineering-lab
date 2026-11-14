# Run the backend foundation locally

Status: local foundation only; existing pages still use Git/Issues. No production migration or deployment commands are required here.

## Prerequisites and commands

Use Node from `.nvmrc`, `npm ci`, Docker Desktop/Rancher Desktop (Docker-compatible engine) or Podman, and enough local RAM. CLI/SDK/Deno versions are pinned in package-lock.json. Storage/realtime/analytics are disabled in this slice to reduce local services. Docker was unavailable in the implementation executor; the full stack sequence below is pending verification.

```sh
npm ci
npm run test:backend
npm run check:edge
npm run backend:start
npm run backend:reset
```

`backend:reset` is local only and destroys the local test DB; never add `--linked`/`--db-url` against a real DB. `backend:start` uses only local containers; it does not create a Supabase cloud project. Do not enable the backend in a production Pages build yet.

Copy `.env.example` to `.env`, and `supabase/.env.example` to ignored `supabase/.env`. Get the **local anon/publishable key** from `npx supabase status` on your machine, set public URL/API base/key, and set `PUBLIC_BACKEND_ENABLED=true` for local development. Never copy the service-role key into public variables, logs, Issues or chat. The browser config rejects service-role and `sb_secret_` keys. Restart `npm run dev` after env changes.

For local Edge serving, set exact browser origins in `supabase/.env` then run:

```sh
npm run backend:serve
```

Do not allow wildcard CORS. Function gateway JWT verification is disabled to allow anonymous reads; the handler verifies every supplied session via Auth and calls PostgreSQL with the caller JWT, never service-role. Public database wrappers are SECURITY INVOKER; privileged mutation functions are private, with pinned search_path and explicit ownership/version/quota checks.

## GitHub OAuth and session behavior

Create an OAuth app owned by you, with local provider callback `http://127.0.0.1:54321/auth/v1/callback`. Set its client ID/secret in ignored `supabase/.env` and set `[auth.external.github].enabled=true` locally. No credential should be committed. Application callbacks are the exact VI/EN URLs listed in config.toml, including `/hiens-nha/`. Restart the local stack after provider config changes. A hosted staging app needs its own callback and redirect allowlist; do not reuse production credentials without a separate decision.

Visit `/hiens-nha/account/` (or `/hiens-nha/en/account/`). OAuth opens a popup; PKCE verifier, session and refresh token stay in originating page memory. Callback hands a code only to the same-origin opener and immediately clears URL query/hash; opener checks origin + popup identity. Page reload/navigation loses the local session. `/admin/` signs in independently and asks `/me` for DB-backed role; hiding UI never grants access. Current admin is an identity shell, not a moderation editor. OAuth refusal, popup blocking, refresh, revocation and logout against the actual provider remain unverified until a real local/staging app is available.

## Owner bootstrap and fixture registration

After a verified GitHub sign-in, compare the auth UUID to its provider identity in local Studio. Do not match on display name/email alone. Use local SQL as postgres, never browser RPC, with your verified UUID:

```sql
-- Substitute a verified UUID locally; this is not a signup endpoint.
insert into public.role_assignments(user_id, role)
values ('VERIFIED-AUTH-UUID'::uuid, 'owner')
on conflict (user_id) do nothing;
```

No role is bootstrapped automatically. Keep numeric provider ID provenance for the future legacy-account claim process. This phase has no moderator role. Test members with `user_metadata.role=owner` must remain ordinary members.

Register an isolated local fixture entity (not a real imported thread), then enable writes only in the disposable local DB:

```sql
insert into public.content_entities(collection, legacy_key, canonical_path)
values ('page', 'local-permission-fixture', '/hiens-nha/local-permission-fixture/')
returning id;
update private.backend_settings set comments_writes_enabled=true where singleton;
```

When done: `update private.backend_settings set comments_writes_enabled=false where singleton;`. On a real migrated feature, stopping writes is maintenance, not a rollback to Git. Public frontend flags cannot bypass this DB switch.

## Verification layers

- `npm run test:backend`: actual embedded PostgreSQL grants/RLS/transactions against a minimal auth schema + HTTP/client contract tests. Claims are set with SQL as a test administrator; this is **not real JWT verification**. PostgreSQL extensions/network/concurrent sessions and Supabase default roles/grants are not emulated fully.
- `npm run check:edge`: Deno checks the actual entry/import graph. Not an Edge gateway deployment or runtime test.
- `npm run test:backend:integration`: requires a running **loopback-only** Supabase stack, local publishable key, registered fixture entity, write switch enabled, and three valid Auth-issued access tokens for member A, member B, owner. Set `LOCAL_SUPABASE_URL`, `LOCAL_PUBLISHABLE_KEY`, `LOCAL_ENTITY_ID`, `LOCAL_MEMBER_A_JWT`, `LOCAL_MEMBER_B_JWT`, `LOCAL_OWNER_JWT` privately in the process environment. Tokens stay in memory; command reports assertions only. It tests HTTP + direct Data API/RPC pending/ownership/moderation/version/bypass defenses. It refuses remote hosts and fails if configuration is missing; never reports an omitted suite as passing.
- CI runs embedded DB/HTTP/client and Deno checks in a separate non-deploying workflow. Full stack/provider/browser/load/backup restore are outstanding gates, not green CI implications.

The shared DTO is imported by browser/Node/Deno. SDK dependency has one pinned version. Do not introduce a third copied business implementation. Public raw comment reads also enforce RLS. API responses use no-store (including errors); API errors stay visible to the client and do not become empty lists.

## Deferred release work

Phase 2: entity mapping using the existing canonical-page helper, comment composer, owner moderation UI, pilot import + dry-run/rerun/shadow diff, source mode marker and archive-writer freeze. Full-stack concurrent moderation/edit and idempotency races need real PostgreSQL sessions. IP-level rate limiting/provider quotas and read-abuse protection require staging infrastructure decisions; Phase 1 enforces per-user mutation quotas in DB, not a global IP limit. Plan cleanup/retention for quota/idempotency/revision data before launch. Backups/restore, region latency and [10–20 / 50 RPS tests](backend-load-test.md) are still unmeasured.

Cloud blockers: owner-controlled Supabase account; project region and Free/Pro/billing decision; staging/production environments and OAuth app/allowlist; verified owner UUID; secure environment configuration. No secrets need to be sent through chat. No cloud resource was provisioned here.
