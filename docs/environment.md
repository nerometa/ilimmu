# Environment requirements

Ilimmu needs Bun 1.4.0 and PostgreSQL 16. Docker Compose v2 is required for
container deployment. Restore checks also need PostgreSQL 16 client tools.

The local preview keeps its database, tools, and credentials in ignored
`.local/preview/`. Run `bun run preview` to start it. Don't run two previews
at once.

Before deploying, confirm the host's available memory and disk, the application
domain, DNS, TLS, private database networking, and persistent storage. Set up
backup storage and operator access before the first release.

See [development setup](development.md) and
[deployment and recovery](deployment.md) for commands.
