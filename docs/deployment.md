# Deployment, backup, and recovery

This guide covers installation, backups, and recovery for Ilimmu.
Bun 1.4.0 is mandatory for the application build/runtime. PostgreSQL 16 stores
both personal records and Better Auth credentials/sessions. A JSON personal-data
download is not a full database backup.

Remote deployment still requires a verified host, domain, proxy, and TLS.

## Configuration and durable state

Use the exact tested commit and frozen Bun lockfile. Store secrets in ignored,
restricted environment files locally and Dokploy's operator-managed environment
settings on the verified target. Never publish `docker compose config` output,
environment dumps, password hashes, session tokens, SQL data, or backup archives
as troubleshooting evidence.

| Setting | Operator contract |
| --- | --- |
| `DATABASE_URL` | Private PostgreSQL URL; in Compose use `db:5432/companion`, user `companion`, with the encoded password matching `POSTGRES_PASSWORD`. |
| `POSTGRES_PASSWORD` | Database initialization secret; changing this variable does not change an existing PostgreSQL role password. |
| `BETTER_AUTH_SECRET` | Random, at least 32 characters; keep stable across compatible restarts. Rotation requires session/recovery planning. |
| `BETTER_AUTH_URL` | Exact external origin, including HTTPS and any nondefault port, with no path/trailing slash. |
| `PUBLIC_ORIGIN` | Docker build argument supplied from `BETTER_AUTH_URL` by Compose. The build validates and embeds it as Kit 3 `paths.origin`. |
| `ORIGIN` | Required for a direct checkout build; align with `BETTER_AUTH_URL`. Runtime-only changes cannot rewrite the built Kit origin. |
| `OWNER_EMAIL`, `OWNER_PASSWORD` | Short-lived CLI inputs for `scripts/owner.ts`; not normal application service variables. |
| `PG_BIN` | Absolute PostgreSQL 16 client-tool directory for the restore rehearsal. Not supplied by the application image. |

The checked-in Compose database has no published host port. Only `app` binds
`127.0.0.1:4173:3000`; it shares `private` with the database and also joins
`web`. Keep the database private in the deployed preview. The
`companion-data` volume is durable state, not a replaceable application layer.
Back it up before modifying or replacing it.

## First start and owner access

Use the [Compose setup commands](development.md#local-production-shaped-compose)
with a private `.env.compose`. Build once for the correct public origin, start
the database, and run the one-shot `migrate` service. An unsuccessful migration
must prevent application startup. Do not run migrations in the request handler
or in a loop on every replica.

Provision the sole owner through a one-off app container after migrations.
Pass privately entered `OWNER_EMAIL` and `OWNER_PASSWORD` with `-e` names, not
literal credentials in command-line arguments. Then unset them in the shell.
`provision` refuses an existing owner. `reset` requires the existing email and
invalidates all its sessions. Both operations require the database; no public
signup endpoint, SMTP, or emailed reset link is needed.

Changing `POSTGRES_PASSWORD` in an environment file is not owner recovery.
Database role credentials, the application's owner password, and the
Better Auth session secret serve different purposes.

## Dokploy target gate

Before a deployment action, the operator must identify and authorize the
specific Dokploy instance, project/service, host, repository commit/image, domain,
and persistent storage. Verify access, available disk/RAM, backups, the migration
plan, and a rollback image on that target. An SSH hostname guess or an
unverified domain is not deployment evidence.

Dokploy references:
[Compose domains](https://docs.dokploy.com/docs/core/docker-compose/domains),
[Compose example](https://docs.dokploy.com/docs/core/docker-compose/example),
and [production hardening](https://docs.dokploy.com/docs/core/guides/production-hardening).
Dokploy can inject routing labels/network configuration for configured domains;
inspect **Preview Compose** before deployment rather than assuming the
checkout's local `web` network is already connected to Traefik.

For the accepted target:

1. Select the application service's internal port **3000**, not PostgreSQL or
   the local host binding. Preserve app-to-database private connectivity.
2. Set the deployment environment privately. Set the external HTTPS
   `BETTER_AUTH_URL` before building, and verify `PUBLIC_ORIGIN` receives it.
3. Verify DNS ownership and resolution, the proxy's route/network, certificate
   issuance, and HTTP-to-HTTPS redirection. HTTPS configuration is not proof of
   a valid certificate or redirect. Never add a public PostgreSQL mapping.
4. Apply the reviewed migration once, check its exit code, then start the app.
   Provision/reset the owner only through the operator CLI when necessary.
5. Verify external health, SSR navigation, sign-in/logout, secure cookies,
   authenticated mutation, foreign/missing-origin rejection, stale-revision
   409s, and a downloadable export. A successful health response alone is not
   acceptance.

Retain nonsecret results and an exact image/commit identifier. Do not deploy
from this workstation until target authorization and these prerequisites are
available. The current Dockerfile does not include PostgreSQL client tools;
run database-tool operations in the database container or a separately reviewed
operator environment, not by installing tools into the running application.

## Manual full backup

Stop application writes for an upgrade/recovery window and keep the database
running. A custom-format `pg_dump` is the operator backup; it contains
authentication data as well as personal records. Protect and encrypt it with
the operator's approved storage tooling, keep a copy outside the database
volume, and record the associated commit, migration level, timestamp, and
PostgreSQL version without recording secrets.

From the checkout using the correct Compose project/environment:

```sh
umask 077
BACKUP_DIR="$HOME/companion-backups"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/companion-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose --env-file .env.compose stop app
docker compose --env-file .env.compose exec -T db \
  pg_dump -U companion -d companion --format=custom > "$BACKUP_FILE"
test -s "$BACKUP_FILE"
chmod 600 "$BACKUP_FILE"
docker compose --env-file .env.compose exec -T db \
  pg_restore --list < "$BACKUP_FILE" > /dev/null
```

Check each exit code. An archive listing only checks readability, not recovery.
If `pg_dump` fails, the redirected file may exist but is not an accepted backup.
Do not erase the database, stop its volume, or proceed with a migration until
a valid backup and recovery plan exist.

The seven-day personal-export reminder tracks server-side export generation,
not a confirmed browser save, secure off-device storage, or a tested SQL
backup. Personal JSON excludes auth records and secrets and cannot restore
sessions, credential hashes, or the complete SQL schema.

## Isolated restore rehearsal

The shipped script produces a temporary custom-format dump and restores only
into its own unique `companion_restore_...` database and a
`companion_schema_...` schema-only reference database. It does not accept a dump
file or target database name from the caller and never writes application
records to the source database.

Run it from a trusted checkout with PostgreSQL 16 binaries and a private,
reachable database endpoint. Use synthetic data for development/CI proof.
The role needs read access to all source tables, access to the maintenance
database `postgres`, and permission to create/drop its own rehearsal database.
The URL must include the user/host/database and may contain `sslmode`; other
connection-query options are rejected rather than silently misapplied.

```sh
PG_BIN=/usr/lib/postgresql/16/bin bun scripts/verify-restore.ts
```

Bun loads `.env` if present. Alternatively, supply `DATABASE_URL` through the
operator's private environment. Never echo its value. The script:

- Holds an exported read-only, repeatable-read source snapshot shared with
  `pg_dump`, so ordinary concurrent row writes do not create comparison races.
- Creates a fresh isolated database and restores with `--no-owner --no-acl`,
  `--exit-on-error`, and `--single-transaction`.
- Compares the full restore's schema with an independent schema-only restore
  from the same archive. PostgreSQL itself canonicalizes CHECK-expression
  parentheses; meaningful SQL is not stripped to make the comparison pass.
  It compares sorted canonical row digests for every non-system table,
  including migration and auth tables. Output contains only table names/counts,
  tool exit codes, and cleanup receipts, not row values/digests.
- Closes its connections, drops both owned databases, and deletes its private
  dump/temp directory in `finally`, including after ordinary failures.

Require final status `COMPLETE`, process exit zero, and successful cleanup
receipts. A `PASS` comparison followed by failed cleanup is not complete.
Unexpected termination such as SIGKILL cannot run `finally`; use reported
unique resource names to inspect and remove only that rehearsal's leftovers.
The script is not a retained backup and does not prove cluster roles,
ownership/ACL policy, tablespaces, extensions on another host, application
compatibility, or remote recovery. Do not run it concurrently with schema
migrations.

## Upgrade, rollback, and destructive recovery

For a compatible application upgrade, stop writes, take and validate a full
backup, preserve the old image and environment, apply reviewed migrations once,
start the candidate, and run the acceptance journey. If the previous app is
compatible with the new schema, restore the previous image/configuration and
recheck health and data access. Do not undo committed user data merely to roll
back compatible application code.

A destructive or incompatible migration is different. Do not assume that
redeploying an old image reverses SQL changes. Keep the app stopped; preserve
the failed database/volume for investigation; restore the accepted pre-upgrade
archive into a **new database**, verify it in isolation, and point the
compatible old application at that database. This discards writes after the
backup; obtain the operator's explicit recovery/cutover decision first.

For a deliberate manual recovery, generate a new database name and restore
only there, never over the application database:

```sh
RECOVERY_DB="companion_recovery_$(date -u +%Y%m%dT%H%M%SZ)"
docker compose --env-file .env.compose exec -T db \
  createdb -U companion --template=template0 "$RECOVERY_DB"
docker compose --env-file .env.compose exec -T db \
  pg_restore -U companion --dbname="$RECOVERY_DB" \
  --no-owner --no-acl --exit-on-error --single-transaction < "$BACKUP_FILE"
```

Verify schema, record counts, authentication, and the actual application
journey before an authorized `DATABASE_URL` cutover. Rebuild if the public
origin also changes. Prefer operator password reset/session invalidation after
recovering an older authentication snapshot. Preserve the old volume until
recovery is accepted; there is no automated reverse-migration guarantee.

PostgreSQL behavior is grounded in its
[pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html),
[pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html), and
[snapshot synchronization](https://www.postgresql.org/docs/16/functions-admin.html#FUNCTIONS-SNAPSHOT-SYNCHRONIZATION)
documentation. Review the deployed PostgreSQL maintenance version and backup
storage protections before a real upgrade.
