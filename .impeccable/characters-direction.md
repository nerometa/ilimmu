# Characters direction

## Scope and mode

Operate. Replace manual character creation with a static ownership roster.

## Chosen direction

The user approved mockup A, then requested a more compact, cleaner interpretation.
Keep one inline equipment build per character. Portraits open detailed profiles.

## First viewport

A quiet dark roster with search and filters above compact portrait-led rows.
Each owned row shows weapon, artifact combination, and three main-stat controls.
No role selectors, substats, weights, or add-character flow. Mobile stacks the
same controls and collapses advanced filters.

## Signature interaction

Click the portrait to edit character level and talents, or weapon progression.
The artifact picker switches between a four-piece set and two two-piece effects.

## Constraints

Preserve existing progression, goals, authentication, and exports. Ownership
changes retain records and builds. Save with revisions. Use official game art.
Main stat choices follow slot restrictions.

## Evidence

Reference: `.impeccable/mocks/characters-a.png`. The user explicitly authorized
layout refinements, so the image is composition direction rather than an exact
pixel contract. Browser screenshots are in `.impeccable/review/`.

The current revision updates the existing Penpot desktop roster
`805a3ba7-250d-80cb-8008-d7ebc9cd3284` and mobile roster
`805a3ba7-250d-80cb-8008-d7ebd065d8cf`. No new screen frames were added.
Four runtime masters were added within the existing shared-components sheet:
equipment tile, artifact effect stack, main-stat field, and ownership switch.
Existing screen instances are linked to those masters. Exports were inspected;
follow-up labels, slot fields, and artwork overrides were applied in place.
The connector intermittently suspends, so later export checks can require the
MCP plugin panel to remain awake.

The earlier `29fec944-...` draft frames and the old generation script are
superseded. Do not create or regenerate those frames for this work.

The current data authority is the Genshin Impact Wiki, with cached responses
and source revisions. Equivalent bonus wording shares a semantic effect key;
original Wiki text remains in the snapshot and equipment details. The roster
shows seven elemental Travelers using the shared portrait of both protagonists.
Legacy progression and builds remain under Anemo. Validation against the
existing localhost:4173 preview
used drafts only and asserted no account writes.
