# Portfolio CMS operations

The CMS is opt-in. Apply the overlay only after staging acceptance and an approved production cutover.

## Deployment configuration

Use `compose.yaml` plus `compose.cms.yaml`. Supply deployment secrets through a private env file or secret manager (never commit it):

- `CMS_DATABASE_PASSWORD`, `DATABASE_URL` (for local CLI only).
- `BETTER_AUTH_SECRET`: at least 32 random characters; preserve for TOTP/credential recovery.
- `CMS_ENCRYPTION_KEY`: exactly 32 random bytes encoded as base64; preserve separately from backups.
- `CMS_OWNER_EMAIL`, `BETTER_AUTH_URL` matching the HTTPS site origin.
- `CF_ACCESS_ISSUER=https://TEAM.cloudflareaccess.com`, `CF_ACCESS_AUD`.
- `CMS_ANALYTICS_SERVICE_TOKEN`: random shared secret, same value in portfolio and analytics service.
- `CMS_SMTP_ALLOWED_HOSTS`: comma-separated deployment-approved SMTP hosts.
- `CMS_CONTENT_SOURCE=database`, `CMS_MEDIA_DIR`, `CMS_BACKUP_DIR`.

Cloudflare Access must protect `/admin`, `/admin/*`, `/api/auth/*`, `/api/admin/*`, with one application audience. Restrict the Access policy to the owner identity. The application verifies signed Access tokens independently and denies production admin access when configuration is missing. Keep `/media/*` outside the Access path policy so published files remain public. Private files require both the owner session and a verified Access assertion (or the signed `CF_Authorization` cookie on this media route only). Verify browser cookie delivery in staging. Signature, issuer, audience, expiry and owner identity are checked for either token source; see [Cloudflare token validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).

Do not expose PostgreSQL or the worker publicly. Persistent volumes are `cms-database`, `cms-media`, `cms-backups`; portfolio and worker use UID 1001. The base analytics endpoint requires the shared service token when the overlay is enabled, so its public visibility cannot bypass the CMS proxy.

## Bootstrap and migration

From `web/`, with secrets loaded into the environment:

```sh
node --import tsx scripts/cms/migrate.ts
node --import tsx scripts/cms/seed.ts
node --import tsx scripts/cms/bootstrap.ts
```

Bootstrap also requires `CMS_BOOTSTRAP_PASSWORD` (minimum 16 characters); remove it from the environment immediately afterwards. A database lock prevents duplicate bootstrap. There is no public signup. Sign in through `/admin`, enroll TOTP, and save one-time recovery codes. No content access is granted before enrollment.

Seed is idempotent. Validate imported document counts and render parity before activation. Once `CMS_CONTENT_SOURCE=database`, content deletion never falls back to seed files. Keep the old content files only as migration/rollback input.

Run the worker with `node --import tsx scripts/cms/worker.ts`. `CMS_WORKER_ONCE=true` runs one iteration for testing. The worker persists schedules and job claims, treats interrupted email attempts as unknown, and does not automatically retry ambiguous delivery.

## Backup and staging restore

```sh
node --import tsx scripts/cms/backup.ts
```

Backups contain a consistent database snapshot plus immutable media, version manifest, encrypted credentials, and TOTP data. AES-256-GCM authenticates the complete archive. Session tokens/challenges are excluded. Daily backups run when `CMS_BACKUP_DIR` is configured, with 30-day retention.

Provision a separate empty staging database, then apply migrations with its `DATABASE_URL`. Restore using the original encryption key:

```sh
CMS_RESTORE_DATABASE_URL=postgresql://.../staging \
CMS_RESTORE_MEDIA_DIR=/separate/empty/media \
node --import tsx scripts/cms/backup.ts restore /backups/ID.cmsbak
```

Restore refuses the configured active database and media directory, verifies archive authentication before extraction, requires an empty migrated database, and leaves queued email jobs in `unknown` for operator review. Validate content, media, login, and counts in staging before deciding on a production restore. Keys must be restored through the separate deployment-secret procedure.

## Owner recovery

Use this only from a trusted local server terminal after verifying owner access:

```sh
CMS_RECOVERY_PASSWORD='new password from password manager' \
node --import tsx scripts/cms/recover.ts --reset-owner-factors
```

This revokes every session, resets the password, removes the lost authenticator, and requires fresh enrollment. Prefer exporting the password securely rather than leaving it in shell history. Recovery is audit logged. Ordinary admin cannot disable TOTP.

## Cutover and rollback

1. Complete staging acceptance, including round-trip editor, security, visual, gameplay and restore checks.
2. Stop writes during the final import and take a verified encrypted snapshot.
3. Start the overlay with migrated data and required Access policies/secrets.
4. Verify public pages, media, sitemap, owner login, contact persistence, and worker heartbeat.
5. If cutover fails, restore the previous application deployment and original source mode as an explicit operator rollback. Never implement an automatic fallback to seed content.

Do not roll back application/schema independently after new production edits. Restore the corresponding validated snapshot into staging first and plan the data transition.

## Local forwarded previews

If a local browser forwards the CMS to another loopback port, set `CMS_PREVIEW_ORIGINS` to its exact origin (for example `http://localhost:55178`) and restart the development server. Both the CMS CSRF gate and Better Auth use this explicit list. Only loopback HTTP/HTTPS origins are accepted; production ignores this variable and trusts only `BETTER_AUTH_URL`. Never enable wildcard origins or disable CSRF checks for preview.

## Owner-approved application authentication mode

Set `CMS_ACCESS_MODE=app` to use password + mandatory TOTP without Cloudflare Access. This skips only the external Access gate: server session validation, owner identity, enrollment, rate limiting, CSRF and sensitive-action reauthentication remain mandatory. Default `cloudflare` mode still requires issuer and audience. Unknown mode values fail closed. Production credentials and authenticator enrollment must be separate from preview accounts.
