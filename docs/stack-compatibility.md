# Application stack

Ilimmu runs as one Bun application backed by PostgreSQL. Exact dependency
versions are in `package.json` and `bun.lock`.

| Part | Role |
| --- | --- |
| SvelteKit and the Bun adapter | Pages, server rendering, and HTTP listener |
| Elysia | API routes under `/api` |
| Better Auth | Owner sign-in and database sessions |
| Drizzle and PostgreSQL | Persistent records and migrations |
| Zod | API validation and shared contracts |
| Tailwind and FlyonUI | Interface styling |
| Storybook, Vitest, and Playwright | Component, unit, integration, and browser checks |

Use `bun install --frozen-lockfile --ignore-scripts`. Keep related Storybook
and Vitest packages compatible when updating dependencies.

SvelteKit owns the HTTP listener. Elysia handles requests inside its API route.
Server-rendered pages call services directly. Keep database modules out of
browser imports.

FlyonUI JavaScript runs only in the browser. Initialize interactive components
after navigation or conditional rendering and dispose removed instances.
Check keyboard behavior and repeated navigation in the browser.

Run the checks in [development setup](development.md) after dependency changes.
A successful build alone doesn't verify sign-in, persistence, or accessibility.
