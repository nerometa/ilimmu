# Game catalog sources

The active catalog is a versioned local snapshot of the
[Genshin Impact Wiki](https://genshin-impact.fandom.com/wiki/Genshin_Impact_Wiki).
It contains 63 artifact sets, 252 weapons, and 121 matched playable character
identities, projected into 127 roster entries with seven elemental Travelers.
Anemo keeps ID 10000005 and the legacy Lumine alias 10000007. The other
variants use stable application IDs 90000001–90000006 (Geo, Electro, Dendro,
Hydro, Pyro, Cryo). These are application joins, not official game IDs.
Existing Traveler progress and builds remain under Anemo; each other element
has independent progress and a build. Account records and builds stay in
PostgreSQL; reference data does not require a database or live Wiki access.

`wiki-source.json` records retrieval times, page IDs, revisions, source URLs,
and explicitly unmapped entries. `wiki-cache` contains the source API responses,
stable game ID joins, and normalized output. Wiki page IDs and game IDs differ.
Missing artwork never removes a catalog entry.

Run `python3 scripts/sync-wiki-catalog.py --refresh --download-art` to prepare
an updated snapshot. Review its changes, then run the same command with
`--apply` to update the application catalog. An offline run without `--refresh`
reproduces the cached data. Unknown identities require a reviewed game ID.
Previous two-piece wording is kept in `legacy-effects.json`, so saved builds
continue parsing after Wiki text changes. Semantic effect keys also group
equivalent wording and punctuation while preserving the original source text.

Game artwork belongs to HoYoverse. The category symbols for Sands of Eon,
Goblet of Eonothem, and Circlet of Logos come from their Wiki File pages, recorded
in the manifest. The combined Traveler image is the user-provided reference at
[GGArtifact](https://ggartifact.com/character/traveler.webp).

Element and weapon-type filter icons are exported from the shared **Icons**
variants in the project's Penpot design system. Their local files and source
shape IDs are recorded in `static/game/icons/sources.json`. Elements retain
their native SVG paths; weapon symbols use PNG exports at twice their design
size. The app loads these local assets without contacting Penpot at runtime.

Previously cached official artwork remains usable. Its historical sources were
HoYoverse endpoints, HoYoWiki, Project Yatta, and the official-art cache in
[genshindev/api](https://github.com/genshindev/api). Repository license notices
for that history remain in `CATALOG-LICENSE` and `ARTWORK-CACHE-LICENSE`.
The active catalog's text, stats, completeness, and refresh authority are the
Wiki, rather than those bootstrap datasets.
