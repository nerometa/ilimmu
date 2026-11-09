---
name: Ilimmu
description: Private Genshin Impact account and build planning companion
colors:
  canvas: "#0d1424"
  surface: "#172237"
  raised: "#202e45"
  ink: "#edf1f8"
  muted: "#a9b8cd"
  border: "#35445b"
  primary: "#e0c48b"
  rail: "#111b2d"
  rarity-1: "#606776"
  rarity-2: "#4c755b"
  rarity-3: "#446c88"
  rarity-4: "#705a91"
  rarity-5: "#936131"
typography:
  title:
    fontFamily: "system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
  body:
    fontFamily: "system-ui, sans-serif"
    lineHeight: 1.6
  label:
    fontFamily: "system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  supporting:
    fontFamily: "system-ui, sans-serif"
    fontSize: "14px"
rounded:
  control: "8px"
  equipment-tile: "10px"
  character-row: "12px"
  dialog: "16px"
spacing:
  sm: "8px"
  row: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  character-row:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.character-row}"
    padding: "16px"
---

# Design System: Ilimmu

## Overview

**Creative North Star: "Character-focused planning workspace"**

Ilimmu uses a quiet dark workspace with warm gold actions and sourced game art.
Compact editing rows keep equipment and progression readable. Artwork identifies
characters beside editable data.

This refresh records the implemented Characters surface and existing shell.
Frontmatter describes runtime values from `src/app.css` and Characters
components. The earlier intended system below remains future direction where
it differs; this redesign does not apply a global palette or font migration.

**Key Characteristics:**

- Dark navy surfaces with restrained gold actions.
- Portrait navigation and compact equipment editing.
- Actual progression remains separate from named targets.

## Colors

Runtime uses the frontmatter palette. Canvas contains the page; surface groups
rows; raised marks selected or hovered controls. Gold identifies actions and
selected navigation. Element colors accompany written element names.

### Earlier intended palette for other routes

These preserved design targets are not the current runtime token values.
They do not override the implemented Characters palette or rarity colors.

| Role / token suffix | Value | Use |
| --- | --- | --- |
| `color.canvas` | `#10131D` | App background |
| `color.rail` | `#141925` | Navigation |
| `color.panel` | `#1B2130` | Grouped content |
| `color.raised` | `#252D3E` | Hover and selected neutral surface |
| `color.seam` | `#394357` | Decorative separators |
| `color.boundary` | `#8591A8` | Meaningful control outline |
| `color.text` | `#F3F0E9` | Main text |
| `color.muted` | `#B5BDCF` | Secondary and placeholder text |
| `color.gold` | `#E3BD73` | Primary action, target emphasis, focus |
| `color.goldHover` | `#EDCD91` | Primary hover |
| `color.goldPressed` | `#CCA253` | Primary pressed |
| `color.ink` | `#181610` | Text on gold and pale semantic fills |
| `color.success` | `#8ED9BE` | Saved state, Anemo |
| `color.error` | `#FFB4B2` | Invalid and destructive |
| `color.errorHover` | `#FFD0CF` | Destructive hover |
| `color.errorPressed` | `#E09696` | Destructive pressed |
| `color.info` | `#A5C9FF` | Source information, Hydro |
| `color.electro` | `#CBB6F0` | Electro, always named |
| `color.disabled` | `#667086` | Disabled control fill |

## Typography

Characters uses the system UI family, including its page and profile headings.
Desktop titles are 30px; the roster title is 28px on mobile, and the profile
name is 24px below 600px. Row names are 18px, reducing to 16px on mobile.
Build labels are 12px, metadata is 11px, and compact selectors are 13px.
Other routes retain the existing Georgia page headings. The observed type
steps are 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 30, and 32px. The 10px
step serves compact equipment hints and mobile ownership; 14px serves roster
supporting text, effect rows, profile text, and shared metadata. The 20px step
serves picker headings, and 32px remains the shared page heading default.

### Earlier intended typography for other routes

The following font direction remains a future target, not an installed font
change in this scoped implementation. Characters uses the runtime system UI
steps above, not the earlier Cinzel and Manrope proposal.

Manrope is the UI family. Use weights 400, 500, 600, and 700. Cinzel 500 is
reserved for page titles and character names. Type sizes are 12 for short
metadata, 14 for secondary labels, 16 for body and controls, 20 for section
headings, 28 for mobile titles, and 36 for desktop titles. Body line height is
1.5. Keep supporting paragraphs within 65 characters where practical.

## Layout

The existing shell retains its 232px desktop rail and 1200px maximum content
width with 32px padding. At 760px and below, the mobile Menu replaces the rail
and content uses 16px horizontal padding. Other routes retain their layouts.

Characters is a single stack of portrait-led rows, separated by 12px gaps.
Each row has 16px padding, reducing to 12px below 600px. Search, ownership,
element, weapon type, rarity, and sort controls precede the roster. Element
and weapon-type buttons use game icons; rarity buttons pair a number and star.
Selections combine across groups and allow multiple choices within each group.
On mobile, search fills its own row, followed by ownership and **Filters**.
The expanded groups wrap within the available width. Selected filters remain
visible in the count and result summary when collapsed.

Wide build rows place weapon, artifacts, Sands, Goblet, and Circlet in five
columns. Below a 620px build container, equipment occupies two columns above
three main-stat fields. Below a 420px container, equipment remains side by side and each main-stat
field uses its own row: an 84px icon-and-label column beside a flexible select.
Equipment columns are 76px and 92px on wide screens, followed by three
flexible main-stat columns. Weapon progression and talent fields stack on
narrow screens. Profile tabs
scroll horizontally rather than clipping their labels.

The earlier design's 224px rail, 40px desktop inset, 20px mobile gutters, and
768px shell breakpoint remain intended board measurements, not runtime claims.
Its general spacing scale remains 4, 8, 12, 16, 24, 32, 48, and 64 pixels.

## Elevation & Depth

Characters rows use flat tonal grouping without shadows. Equipment detail
popovers use `0 12px 32px #0005`. The existing shared
panel retains `0 8px 24px #03081326`. Equipment dialogs use a dark backdrop
(`#060910b3`), a border, and a contained scrolling results area.

## Shapes

Controls and game-image frames use 8px corners. Equipment tiles use 10px
corners; their detail popovers use 12px. Character rows and profile
content use 12px; equipment dialogs use 16px. Ownership switches use a compact
pill shape within a labeled 44px region. The earlier 16px panel target remains
intended direction; existing shared panels use 8px.

## Components

The runtime patterns below describe the implemented surface.

### Character rows and profile navigation

Portraits (56px) and character names link to `/characters/[gameId]`. Portraits
use rarity backgrounds for owned and unowned characters. The ownership switch changes ownership without
removing saved progression or equipment. Owned rows and rows with saved builds
show inline equipment; other rows offer **Plan build**.

### Equipment and main stats

Equipment choices are image-only 64px tiles, with shared `--rarity-1` through
`--rarity-5` backgrounds. Picker results use an auto-filling 64px grid. Names,
stars, weapon facts, and effects appear in native detail popovers. Desktop
pointer hover waits 180ms; keyboard focus opens details immediately. These
previews ignore pointer events so they cannot block selection. On touch
devices, picker tiles expose an explicit info button that opens interactive
details. Escape dismisses the popover.

Two-piece effect rows retain a horizontal arrangement on mobile. Their
supporting sets appear as overlapping 36px icons with accessible names and
no visible per-set text labels.

One build belongs to each static game character. Weapon selection is restricted
to the character's weapon type. The artifact dialog offers a four-piece set
with its two-piece and four-piece bonuses, or two two-piece effect bonuses.
Two-piece mode stores effects, not particular set identities, and lists
compatible sets. Repeated effects require two different supporting sets.

Sands, Goblet, and Circlet use official white category symbols sourced from
the Wiki File pages, not representative artifact pieces. They sit beside persistent
labels and slot-valid main-stat selects. Builds omit role selectors, substats,
and stat weights. **Save build** and **Reset** appear for dirty drafts; picker
selection changes the draft and does not save immediately.

### Detailed progression

Profiles offer **Level & talents**, **Weapon & artifacts**, and **Progression
targets**. Character level, ascension, and base talents save separately from
weapon level, ascension, refinement, and equipment. Progression targets remain
independent plans. A record retained after marking a character not owned stays
editable; a character without a record prompts **Mark owned** for progression.

### Shared controls and feedback

Shared buttons and fields have 44px minimum height; compact build action buttons
use 36px and selectors use 44px. Shared focus is a 3px gold outline with 3px
offset. Roster search has a 2px focus-within outline with 2px offset. Native
dialogs contain equipment selection. Profile and roster errors retain drafts.
Ownership and build feedback use status text as well as color.

### Preserved library and state direction

The earlier FlyonUI contract and state requirements remain design guidance.
They do not imply every earlier dimension or variant is implemented globally.

#### FlyonUI source contract

Use the pinned installed FlyonUI **2.4.1**, not assumptions about latest main.
The official [repository](https://github.com/themeselection/flyonui) is the
upstream reference. Its MIT-licensed CSS was inspected locally in
`node_modules/flyonui/components/`. Penpot components are native reconstructions
of those anatomies with this theme, not a claimed imported Penpot kit.

| Penpot family | Inspected source / classes | Theme adaptation |
| --- | --- | --- |
| Button | `button.css`: `btn`, `btn-primary`, `btn-outline`, `btn-text`, `btn-error`, `btn-square` | 44-pixel minimum, gold primary, visible focus, no default inset shadow |
| Field | `input.css`, `select.css`: `input`, `select` | Persistent label/help, 48-pixel height, strong boundary, explicit invalid text |
| Checkbox | `checkbox.css`: `checkbox`, `checkbox-primary` | 24-pixel visual inside 44-pixel hit area |
| Navigation | `menu.css`: `menu`, active item styling | 224-pixel desktop rail, active fill and text, mobile drawer |
| Status / priority | `badge.css`: `badge`, `badge-soft` | Named status, restrained semantic text |
| Feedback | `alert.css`, `skeleton.css`: `alert`, `alert-soft`, `skeleton` | Inline recovery, stable loading geometry, no decorative stripe |
| Dialog | `modal.css`: `modal`, `modal-dialog`, `modal-content` | Protected edit/decision only; safe focus entry, cancel, Escape, focus return |
| Data / character | `table.css`, `card.css`: `table`, `row-hover`, `card` | Flat rows and character tiles, minimal elevation, mobile labeled values |

Map canvas to theme `base-300`, panel to `base-100`, raised to `base-200`, text
to `base-content`, gold to `primary`, ink to `primary-content`, success/error/
info to their semantic names. Set `radius-field` to 8px, `radius-box` to 16px,
and override control sizing explicitly. Do not rely on FlyonUI's default
38-pixel medium button or 50%-opacity placeholder for this dark theme.

#### State and interaction contract

Use reusable state variants rather than loose painted specimens. Buttons have
Intent and State axes; inputs have Kind and State; navigation has State;
badges have Meaning; feedback has State; dialogs have Intent. Include default,
hover, pressed, focus, disabled, and loading buttons. Text fields include
invalid retained input. Selected tabs/filters use both fill and text weight.

Empty screens explain the missing record and offer a relevant add action.
Errors preserve user input and identify recovery. Loading placeholders retain
the final layout; do not show pretend account values. Stale records retain
their date. Conflict data is labeled sample observation in design boards.
Readiness and saved messages use text as well as color.

Runtime implementation must provide labels, field-linked errors, focus order,
dialog focus containment/return, Escape cancellation, status announcements,
and no color-only meaning. Motion is 140ms for control feedback and up to
180ms for an intentional drawer transition; reduced motion removes movement.
Theme selection, caret, focus, and scrollbars from this palette.

## Do's and Don'ts

Use these guardrails when extending the implemented surface.

### Do:

- **Do** use portraits and names as links to character profiles.
- **Do** keep actual progression and progression targets separate.
- **Do** preserve labeled main-stat rows on narrow screens.
- **Do** retain the existing shell outside the scoped Characters redesign.

### Don't:

- **Don't** restore manual character creation or a portrait-grid roster.
- **Don't** add role, substat, or weight fields to this build surface.
- **Don't** describe two-piece effect selection as saved artifact inventory.

### Design review

Inspect exported desktop and mobile screens together, then fix defects in one
batch and confirm once. Check contrast, text wrapping, containment, all variant
combinations, token bindings, and use of library instances. Penpot variants
are state specifications; static exports do not prove live hover or keyboard
behavior. Later application work must implement and test those behaviors.

Keep review notes, board IDs, and exported proof in `.local/`.

The Characters implementation passed build/typecheck, 12 unit tests, 14
integration tests, and four desktop/mobile end-to-end tests. Existing Penpot Characters desktop and mobile frames were updated rather
than creating new screen frames. Four library component masters were added
to the existing Character and record sheet, and existing row instances link
to those masters. Official artwork and category icons are applied. Exports were inspected and
corrected in place; the confirmed mobile export is saved in
`.impeccable/review/penpot-mobile.png`. The connector can require its plugin
panel to remain awake for later edits.

Storybook previews use the actual `EquipmentTile` and `CharactersPage` source
components. The full-screen harness renders `CharactersPage`. The four-screen
family is the desktop roster, mobile roster, character profile, and equipment
picker; component previews document their shared controls.
