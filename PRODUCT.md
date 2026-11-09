# Ilimmu

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product purpose

Ilimmu is a private Genshin Impact account and build planning companion.
Keep actual progression separate from goals.

## Characters

The Characters page is a static game roster. Toggle characters owned or not
owned instead of manually adding them. Track one build per character on this
page, and open a character profile for detailed progression.

Weapons and artifacts come from static game catalogs. Builds select a weapon,
4-piece artifact set or two 2-piece effects, and main stats for Sands, Goblet, and Circlet. Each slot offers
only its valid main stats. Omit field-role selectors, combat-role selectors,
substats, and stat weights.

## Confirmed references

The user supplied GGArtifact screenshots as the reference for a clean,
compact roster and inline build editing. They approved mockup A and requested a more compact, cleaner layout with
portrait navigation and editable character, weapon, and talent progression.

## Existing constraints

The existing application uses SvelteKit, Svelte 5, PostgreSQL, and owner-only
authentication. Preserve stored progression, goals, and export behavior.
