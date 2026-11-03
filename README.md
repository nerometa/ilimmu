# Ilimmu

Ilimmu is a private Genshin Impact tracker for your characters, weapons,
materials, and build goals. It works on desktop and mobile.

Record what you own, then set targets for what you want to build. Changing a
goal never changes your actual progress. Each record shows its source and when
it was saved.

You can:

- Track character levels, ascension, constellations, and talents.
- Keep separate records for each weapon copy.
- Update material and Mora quantities.
- Set named build targets and priorities.
- Review conflicting values before replacing a manual correction.
- Download your records as JSON.

Data entry is manual. Account syncing and file imports aren't available yet.
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

Read the [design guide](DESIGN.md) for layout and visual rules.
Installation operators can use the [deployment and recovery guide](docs/deployment.md).

Ilimmu is an unofficial project and isn't affiliated with HoYoverse.
