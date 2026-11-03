# Ilimmu design

This guide defines Ilimmu's intended interface. Some layouts are still awaiting
implementation.

## Visual direction

Build a character-focused planning workspace. Warm gold actions and occasional
Cinzel headings give the interface a Genshin identity. Manrope labels, compact
rows, explicit sources, and calm charcoal-navy surfaces support daily editing.
Artwork establishes character identity; it must not sit behind editable data.
Keep daily editing clear and direct.

The Moodboard pins the direction. Retain its dark app environment, character
art, roster density, and warm action hierarchy. Evolve the existing navy world
toward softer neutral panels and better typography. Do not copy the references'
branding, promotional claims, AI features, resin totals, or social features.

## Foundations

Bind fills, borders, type sizes, and radii to shared design tokens.
No light theme is specified by the mixed-theme component references.

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

Spacing is 4, 8, 12, 16, 24, 32, 48, and 64 pixels. Controls use an 8-pixel
radius; panels use 16. Small status badges use a pill radius. Do not turn every
content section into a card. Use separators and whitespace for ordinary rows.

Manrope is the UI family. Use weights 400, 500, 600, and 700. Cinzel 500 is
reserved for page titles and character names. Type sizes are 12 for short
metadata, 14 for secondary labels, 16 for body and controls, 20 for section
headings, 28 for mobile titles, and 36 for desktop titles. Body line height is
1.5. Keep supporting paragraphs within 65 characters where practical.

Controls are 44 pixels high; fields are 48. Compact visual tabs and checkboxes
still have 44-pixel hit regions. Focus-visible is a 2-pixel gold outline with
a 3-pixel canvas gap. Hover changes fill or boundary; pressed darkens fill.
Loading keeps the control width and replaces its label with an explicit verb.
Disabled controls explain why the action is unavailable when unclear.

Use one consistent 20-pixel outline icon vocabulary, 1.75-pixel stroke. Do not
substitute Unicode symbols for icons. Portraits are decorative beside names.
Use existing sourced game images rather than cropping screenshots into UI.

## FlyonUI source contract

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

## Sitemap and primary flows

Login is the sole public destination. Successful authentication opens Overview.
Authenticated navigation contains Overview, Characters, Inventory, Goals,
Conflicts, Profile, and Export & backup. Inventory contains Weapons and
Materials tabs. Sign out returns to Login. No public registration exists.

| Destination | Primary task | Primary action | Next destination |
| --- | --- | --- | --- |
| Overview | Choose the next progression task | Continue build | Goals for selected character |
| Characters | Find an owned character and inspect actual progression | Add character | Character edit |
| Inventory | Correct a weapon copy or material quantity | Add weapon / Save quantity | Same item with saved status |
| Goals | Compare actual with independent named targets | New target | Target editor |
| Conflicts | Compare protected manual data with an observation | Review values | Explicit keep or accept decision |
| Profile | Set UID and explicit server | Save profile | Same form with saved status |
| Export & backup | Generate a personal-data download | Generate export | Pending, ready, download |

Edit actual: select record, edit values, validate, save with revision, show
saved provenance. Target editing never writes actual progression. A stale
revision retains input and asks the user to reload/reconcile. Conflict review
shows both values, source, timestamp, and an explicit decision before writing.
Export generation preserves the last usable record while pending; failure
offers retry; readiness includes the generated date and a download action.

## Screen composition and responsive behavior

Desktop boards are 1440 pixels wide with a 224-pixel navigation rail,
40-pixel content inset, and a clear page heading. Overview combines one
character-led continuation region with a compact build queue and record
activity. Avoid a dashboard of invented metrics. Characters uses a portrait
grid followed by selected-character progression. Goals uses one actual record
and two named target rows. Inventory and Conflicts prioritize readable rows.

Mobile boards are 390 pixels wide with 20-pixel gutters. Below 768 pixels,
replace the rail with a brand header and labeled Menu action. The drawer lists
every destination and Sign out. Stack comparisons with explicit Actual and
Target labels; use two portrait columns, single-column forms, and full-width
primary actions where needed. Below 360 pixels, reduce gutters to 16 and use
one roster column if labels cannot fit. Never hide source or conflict choices.
At intermediate widths use a compact rail and two-column content only when
both columns retain readable values. Dialogs fit viewport minus 32 pixels.

## State and interaction contract

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

## Design review

Inspect exported desktop and mobile screens together, then fix defects in one
batch and confirm once. Check contrast, text wrapping, containment, all variant
combinations, token bindings, and use of library instances. Penpot variants
are state specifications; static exports do not prove live hover or keyboard
behavior. Later application work must implement and test those behaviors.

Keep review notes, board IDs, and exported proof in `.local/`.
