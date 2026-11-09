# Wiki catalog audit

The catalog now has a reproducible local snapshot of the Genshin Impact Wiki.
Reference game data stays in version control; account progression and builds
stay in PostgreSQL. The application does not need to scrape the Wiki at runtime.

## Findings

The prior importer read 63 artifact records but required every record to have an
image URL. Only 43 survived that image check. Missing artwork therefore removed
valid set data. This was an importer completeness problem, independently of the
age of the fallback image repository.

The Wiki's [artifact set list](https://genshin-impact.fandom.com/wiki/Artifact/Sets)
provides 63 records that join existing stable game IDs, including newer sets
such as Night of the Sky's Unveiling, Silken Moon's Serenade, Celestial Gift,
Scarlet Proof, and Heart of the Furnace. The list also includes **Initiate**,
which has neither a two-piece nor four-piece bonus and has no existing game ID
in this application. It is explicitly recorded as unmapped.

The [weapon list](https://genshin-impact.fandom.com/wiki/Weapon/List) supplies
252 current weapon entries. Every name joins the existing stable ID registry.
The normalized records use Wiki rarity, passive text, maximum base ATK, and
maximum secondary-stat values. Passive text contains the Wiki's refinement
ranges; it does not invent all five intermediate refinement values. Weapon
types come from the Wiki's [Sword](https://genshin-impact.fandom.com/wiki/Sword),
[Claymore](https://genshin-impact.fandom.com/wiki/Claymore),
[Polearm](https://genshin-impact.fandom.com/wiki/Polearm),
[Catalyst](https://genshin-impact.fandom.com/wiki/Catalyst), and
[Bow](https://genshin-impact.fandom.com/wiki/Bow) lists.

The [playable character list](https://genshin-impact.fandom.com/wiki/Character)
normalizes to 121 matched identities, including one **Traveler**. The Wiki lists
**Wonderland Manekin** as one identity, while the existing application has
separate Manekin and Manekina IDs. That identity difference remains explicit in
the manifest so existing account records can be preserved deliberately.

The application projects Traveler into seven elemental entries, for 127 roster
entries. Anemo retains the legacy Aether/Lumine joins; the other elements use
stable application IDs with separate progression and builds.

The Wiki's human-facing pages were blocked by the fetch tools, but its public
MediaWiki API returned usable JSON. The checked-in cache contains the rendered
list responses, eight source-page revisions, and individual revision IDs and
timestamps for all 436 normalized entities. These per-entity revisions matter:
a list page's own revision does not change whenever an embedded entry changes.

## Assets

The correct slot symbols are the Wiki's
[Circlet](https://genshin-impact.fandom.com/wiki/File:Icon_Circlet_of_Logos.png),
[Goblet](https://genshin-impact.fandom.com/wiki/File:Icon_Goblet_of_Eonothem.png),
and [Sands](https://genshin-impact.fandom.com/wiki/File:Icon_Sands_of_Eon.png)
category icons. They are cached as `static/game/slot-circlet.png`,
`slot-goblet.png`, and `slot-sands.png`. These are category symbols rather than
individual artifact item art. The original Wiki URLs and image timestamps are
recorded in `src/lib/game/wiki-source.json`.

The combined Traveler image is cached at `static/game/traveler.webp`, using the
[user-provided image](https://ggartifact.com/character/traveler.webp). Missing
newer artifact images were downloaded from the exact Wiki URLs in the set list.
Artwork belongs to HoYoverse; Wiki editorial content is attributed to its source
pages and remains subject to the Wiki's applicable license.

## Refresh and integration

Run the importer from the repository root:

```sh
# Reproduce normalized output from the checked-in cache without network access.
python3 scripts/sync-wiki-catalog.py

# Refresh Wiki responses, identities, and revision metadata.
python3 scripts/sync-wiki-catalog.py --refresh

# Also cache any missing Wiki artwork and category icons.
python3 scripts/sync-wiki-catalog.py --refresh --download-art
```

Normalized data is written to `src/lib/game/wiki-cache/normalized.json`, with
integration copies at `/tmp/wiki-catalog.json`, `/tmp/wiki-weapons.json`, and
`/tmp/wiki-characters.json`. The importer does not overwrite the active catalog
or personal database. Its stable-ID registry joins Wiki names to existing game
identities; Wiki page IDs are stored separately. Newly encountered identities
require a reviewed stable-ID mapping rather than silent removal.

Each fetched response has a URL, retrieval timestamp, and SHA-256 digest in
`wiki-cache/fetch-log.json`. Cache-only runs preserve retrieval timestamps, so
rebuilding a snapshot cannot make old data appear newly retrieved. Images never
control whether a data record exists.

When adopting refreshed two-piece bonuses, map saved effect strings by stable
artifact identity or explicit aliases. Wiki wording can differ from the old
catalog even when the effect is mechanically identical; strict parsing of old
saved strings against only the new wording could otherwise reject valid builds.

The importer passed Python compilation, a complete cache-only normalization,
and a repeat run that left freshness metadata unchanged.
