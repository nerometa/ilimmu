# Ilimmu

Ilimmu is a private Genshin Impact tracker for your characters, weapons,
materials, and build goals. It works on desktop and mobile.

Record what you own, then set targets for what you want to build. Changing a
goal never changes your actual progress. Each record shows its source and when
it was saved.

You can:

- Mark characters owned in a fixed roster, then track levels, ascension, and talents.
- Save one weapon and artifact build per character, including seven elemental
  Traveler entries with independent progression and builds.
- Choose a four-piece artifact set or two two-piece effects, plus valid main
  stats for Sands, Goblet, and Circlet.
- Filter by ownership, element, weapon type, and rarity. Search accepts names
  and rarity terms such as `5 ★`, `4*`, or `5-star`.
- Keep separate records for each weapon copy.
- Update material and Mora quantities.
- Set named build targets and priorities.
- Review conflicting values before replacing a manual correction.
- Download your records as JSON.

Progression and ownership are entered manually. Reference catalogs are bundled
from a versioned Genshin Impact Wiki snapshot. Filter icons come from the shared
Penpot design components. See [catalog and artwork sources](src/lib/game/SOURCES.md).
Account syncing and file imports aren't available yet.
Ilimmu has one owner account and no public registration.

Dev Note: This project is intended for one user for now (that's me tho).

## Open the local preview

On the configured workstation, run:

```sh
bun run preview
```

Open <http://localhost:4173> and sign in. Your local credentials are in
`.local/preview/login.txt`. Keep the terminal open. Press Ctrl+C to stop the
preview. Your records stay saved.

The preview uses private files that aren't included in a fresh checkout.
For a new installation, follow the [setup guide](docs/development.md).

## More information

Development uses Bun 1.4.0, PostgreSQL 16, and Node 24 for Vitest. With the local
preview already running, `bun run test:character-drafts` checks editing conflicts,
draft retention during filtering, and image recovery using synthetic fixtures
and intercepted writes. The [development guide](docs/development.md) covers the
full verification suite and setup.

Read the [design guide](DESIGN.md) for layout and visual rules.
Installation operators can use the [deployment and recovery guide](docs/deployment.md).

Ilimmu is an unofficial project and isn't affiliated with HoYoverse.
