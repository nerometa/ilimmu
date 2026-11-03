# Dependency review

The last recorded audit, October 23, 2026, found one moderate advisory in
`esbuild@0.18.20`, a development dependency reached through Drizzle Kit.
That audit doesn't establish the current security status.

The advisory affects esbuild's development HTTP server. The application starts
with `bun ./build`; its migration script uses Drizzle ORM. Neither starts that
server. Keep development services private.

Review the transitive dependency by November 6, 2026, or before adding an
esbuild development server. Run `bun audit` before a release and test any
updates with the application checks.

See [the esbuild advisory](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99).
