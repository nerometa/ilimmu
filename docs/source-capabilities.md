# Data sources

Ilimmu currently uses manual entry. These notes define limits for future
integrations, not working connectors.

| Source | Intended use | Limits |
| --- | --- | --- |
| Enka | Public profile and showcased builds | Doesn't establish a complete roster or inventory |
| GOOD files | Character, weapon, and artifact imports | Missing fields don't mean zero ownership; material coverage needs verification |
| Artiscan | Possible file source | Exact project, release, and sample export still needed |
| genshin-db | Static definitions and progression costs | Contains game data, not personal ownership or balances |
| HoYoLAB | Possible account data | Research only; no authenticated integration |
| Official announcements | Banner dates and rate-ups | No accepted automated feed |

## Import rules

Validate files before applying them. Show a preview, preserve duplicate weapon
copies, and ask before replacing manual corrections. Keep source observations
and build targets separate from actual records. Missing or failed imports must
never erase saved data.

Map stable game IDs explicitly. Don't match records by similar display names.
Pin the data version used for calculations and report unsupported records.

## Service rules

For Enka, follow the provider's request rules, use a descriptive User-Agent,
cache until the returned TTL expires, and don't enumerate UIDs. Preserve the
last successful result when a refresh fails and display its timestamp.

HoYoLAB needs separate approval and verified account behavior before use.
Some community wrapper methods can change account settings. Don't assume a
method is read-only because it retrieves data.

## References

Consult the provider contracts when implementing an integration:

- [Enka API rules](https://github.com/EnkaNetwork/API-docs/blob/master/api.md)
- [GOOD schema](https://github.com/frzyc/genshin-optimizer/blob/master/libs/gi/good/src/schemas/good-format.ts)
- [genshin-db](https://github.com/theBowja/genshin-db)
- [genshin.py](https://github.com/seriaati/genshin.py)

Review source licenses and game asset permissions separately before reusing
code or redistributing artwork.
