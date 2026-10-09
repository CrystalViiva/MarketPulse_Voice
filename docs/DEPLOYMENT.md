# Local and deployment handoff

**No public host was configured or authorised. No public deployment was attempted.** The runnable target is localhost:3000. Keep public deployment separate from local verification.

The single application can run on a Node host with persistent PostgreSQL. Files are in PostgreSQL bytea, not an ephemeral app filesystem, so evidence durability follows database durability. Prefer a regular Node process for this prototype. The server listens on loopback by default; an authorised host can use `next start --hostname 0.0.0.0 --port <assigned-port>` behind HTTPS. Do not expose the development server directly to the internet.

Once a host is selected:

1. Create a new production database and dedicated least-privilege application role. Configure verified TLS to the database and backups. Do not reuse local/test/demo URLs.
2. Set `DATABASE_URL`, a fresh random `BETTER_AUTH_SECRET`, exact HTTPS `BETTER_AUTH_URL`, `APP_ENV=production`, `TRANSCRIPTION_MODE=disabled`. Keep test/demo database URLs out of the deployed runtime. The local `check:env` script additionally expects test/demo URLs for developer reproducibility; use a production secret validator tailored to deployment.
3. Install with `npm ci`, run `npm run db:generate`, apply `npm run db:deploy` against production after backup/review, and run `npm run build` and `npm start`. Never run test, migration reset or demo seed against production.
4. Set secure proxy behavior, request-size limits (5 MB evidence; 1 MB normalized audio; 256 KB CSV), TLS, operational logs without payloads, app/database monitoring and scheduled backups. Rate limits persist in PostgreSQL; add ingress rate limiting for unauthenticated traffic.
5. Review authentication mail delivery/recovery, retention/deletion, quotas, concurrent connection limits, malware scanning and the chosen provider's data-processing terms before recruiting real traders.
6. Smoke-test sign-up/sign-in, tenant separation, confirmation, debt collection, import corroboration, private file access and report revocation/expiry over HTTPS. Verify a phone microphone on the actual device. A phone's localhost is the phone, not this workstation.

Prepare the concrete host configuration and final approval request before publishing. Host-specific CLI commands are intentionally not guessed without an account/project choice.

## Backup / restart

For local PostgreSQL use `pg_dump` with a protected password file or environment variable; never put passwords in command history. Restore to a new named database, migrate and smoke-test there before switching URLs. A Next.js process restart must not alter records. Stop the isolated local cluster only with `scripts/local-db.ps1 stop`; this targets `.local/postgres`, never the existing port-5432 service.
