# Development setup

Ilimmu uses Bun 1.4.0 and PostgreSQL 16. Install dependencies with
`bun install --frozen-lockfile --ignore-scripts`. Use synthetic data for tests.

## Local development

Use only synthetic data for development and test commands. The integration
suite creates and drops its own databases, so its PostgreSQL role needs
`CREATEDB`; it must never point at a production service.

1. Prepare a private local environment file:

   ```sh
   umask 077
   cp .env.example .env
   ```

2. Edit `.env` with a password shared by `POSTGRES_PASSWORD` and the database
   connection URL. Use the following meanings, not the example's placeholder
   values:

   | Variable | Local development value |
   | --- | --- |
   | `POSTGRES_PASSWORD` | Random local database password |
   | `DATABASE_URL` | PostgreSQL URL for user/database `companion` at `127.0.0.1:5432`; percent-encode password characters |
   | `BETTER_AUTH_SECRET` | Random secret of at least 32 characters |
   | `BETTER_AUTH_URL` | `http://127.0.0.1:4173` |
   | `ORIGIN` | `http://127.0.0.1:4173`, without a path or trailing slash |

3. In a separate terminal, start a development-only database using Compose's
   explicit loopback port override:

   ```sh
   docker compose --env-file .env run --rm \
     -p 127.0.0.1:5432:5432 db
   ```

   Do not also run the regular `db` service against the same volume. This
   development command publishes loopback only; normal production Compose does
   not publish PostgreSQL. Keep this terminal open until development ends.

4. In the checkout terminal, apply migrations, provision the sole owner, and
   start Bun. Enter owner credentials privately; do not put them in shell
   history or commit them:

   ```sh
   bun run db:migrate
   read -r -p "Owner email: " OWNER_EMAIL
   read -r -s -p "Owner password (12-128 characters): " OWNER_PASSWORD
   printf '\n'
   export OWNER_EMAIL OWNER_PASSWORD
   bun run owner provision
   unset OWNER_EMAIL OWNER_PASSWORD
   bun run dev --port 4173
   ```

   The prompts above use Bash. Open `http://127.0.0.1:4173` and sign in.
   Registration is deliberately disabled. There is no SMTP setup or emailed
   password-reset flow.

For an already-running development PostgreSQL instance, skip the Compose
database command and set `DATABASE_URL` to that synthetic database instead.
Bun loads `.env`; shell tools such as `psql` do not automatically load it.

## Verification commands

Run these from the checkout with the synthetic environment configured. The
browser command needs the installed Chromium binary and the repository's E2E
configuration; check the results before releasing.

```sh
bun run check
bun run test
bun run test:integration
bun run build
bun run build-storybook
bun --bun playwright install --with-deps chromium
bun run test:storybook
bun run test:e2e
```

The CI workflow in `.github/workflows/ci.yml` runs frozen installation,
checks, unit/integration tests, application/Storybook builds, Chromium
installation, Storybook interaction/accessibility tests, and E2E tests against
a disposable PostgreSQL service. Inspect
the actual CI result before treating a release as verified. Storybook's
interaction/accessibility configuration is a separate concern from merely
building its static output.

Run the isolated restore rehearsal with PostgreSQL 16 tools:

```sh
PG_BIN=/usr/lib/postgresql/16/bin bun scripts/verify-restore.ts
```

`DATABASE_URL` must include a username and application database; the script
accepts an optional `sslmode` URL parameter. It makes its own temporary dump,
restore database, and independent schema-reference database, compares schema
and all table data including authentication records, and reports cleanup
without printing authentication values. A migrated source
with a nonempty synthetic credential account is required.

## Local production-shaped Compose

Use a separate ignored `.env.compose`, with the same variable names as `.env`
but an internal `DATABASE_URL` using hostname `db`, not `127.0.0.1`.
Set `BETTER_AUTH_URL` to the exact public origin before the build; Compose passes
it as Docker build argument `PUBLIC_ORIGIN`. The Kit 3 origin is baked into
the build. Changing runtime `ORIGIN` alone does not move an existing image to
a different origin.

```sh
docker compose --env-file .env.compose build
docker compose --env-file .env.compose up -d db
docker compose --env-file .env.compose run --rm migrate
# Export privately entered OWNER_EMAIL and OWNER_PASSWORD as above.
docker compose --env-file .env.compose run --rm --no-deps \
  -e OWNER_EMAIL -e OWNER_PASSWORD app bun scripts/owner.ts provision
unset OWNER_EMAIL OWNER_PASSWORD
docker compose --env-file .env.compose up -d app
docker compose --env-file .env.compose ps
curl --fail http://127.0.0.1:4173/api/health
```

The migration service is one-shot and must exit zero before the application
starts. The owner command can use `reset` instead of `provision` only for the
existing owner email; it replaces the credential hash and invalidates sessions.
See [deployment and recovery](deployment.md) for backups, upgrades,
Dokploy target checks, and destructive-migration recovery.
