---
name: pencil-design
description: Work with Pencil .pen design files via the Pencil MCP (batch_design, variables, guidelines). Use when creating or editing .pen files, exploring UI layouts in Pencil, generating wireframes for EduHub, or when the user mentions Pencil, .pen, or the highagency Pencil extension.
---

# Pencil design files (.pen)

## Rules

1. **Do not read `.pen` files with the Read or Grep tools** — they are encrypted/binary; use Pencil MCP tools only.
2. **Read tool schemas before calling** — tool descriptors live under the workspace MCP folder (e.g. `batch_design.json`); parameters must match exactly.
3. **Prefer a repo path for persistence** — e.g. `/home/steffen/git/eduhub/design/<name>.pen`. Open with `open_document` using that path or `"new"`, then save from Pencil if the file should live in git.

## Workflow

1. **`get_editor_state`** — see active document and top-level node IDs.
2. **`open_document`** — pass an absolute `.pen` path or `"new"` if nothing is open.
3. **`get_guidelines`** — list guides/styles; load `Web App`, `Design System`, `Table`, etc. as needed for the task.
4. **`get_variables`** — if `{}` or missing keys, tokens like `$--background` resolve to **black** (`#000000`) in the canvas.
5. **`batch_design`** — insert/update frames and content; **max ~25 operations per call**; every `I`/`C`/`R` needs a binding name; follow property rules in the tool description (e.g. `alignItems` only `start`/`center`/`end`, no invalid node props).
6. **`batch_get`** — inspect nodes; use `resolveVariables: true` to see resolved colors (when variables are defined).
7. **`set_variables`** — define colors/strings/numbers **before or after** designs; variable names **without** `$` (e.g. `--background`); reference in nodes as `$--background`. For theme-aware colors, use the `{ value, theme }` array form from `set_variables` docs.
8. **`replace_all_matching_properties`** — bulk fix baked colors (e.g. replace `#000000` fills) under chosen parent node IDs.
9. **`get_screenshot`** — verify layout after substantive changes when needed.

## Avoid “all black” canvases

On a **new or empty-variable** document, **`$--*` fills and text often resolve to black**. Before or right after building screens:

- Run **`set_variables`** with at least `--background`, `--foreground`, `--muted-foreground`, `--card`, `--border`, `--primary`, `--secondary` (and `--radius-m` / `--radius-pill` if used in `cornerRadius`), **or**
- Use **explicit hex** in `batch_design` `U(...)` / `I(...)` (e.g. `fill: "#EBEBEB"`) for wireframes that must always read clearly.

If nodes already show black, use **`replace_all_matching_properties`** (`fillColor`, `textColor`, `strokeColor`) from `#000000` to intended values under the screen parent IDs, then fine-tune with `U(...)`.

## EduHub alignment

When designing screens that will be implemented in the app, cross-check **`frontend-nx/apps/edu-hub/.cursor/rules/theme-and-styling.mdc`** for semantic tokens (e.g. brand green, label/fill/border roles). Pencil variables can mirror those roles even if hex values are approximations for the design file.

## EduHub color schema (use variables, never hard-coded hex)

EduHub screens are **dark by default**, with **light "content" surfaces** (TableGrid rows, editors, A4 previews, dialogs use the `.light` theme in code). Seed both sets once, then reference tokens as `$name` (Pencil here uses bare names, e.g. `$brand`, not `$--brand`). Mirror `frontend-nx/apps/edu-hub/styles/globals.css`.

Seed with `set_variables`:

```
# Dark surface + functional (globals.css :root)
brand #00A398 · brand-light #00C4B8 · brand-dark #008078
bg-primary #222222 · bg-secondary #333333 · bg-card #2A2A2A · bg-deep #0F0F0F
border #444444
label-primary #F2F2F2 · label-secondary #D8D8D8 · label-muted #888888
success #A2EBA0 · warning #FFA665 · error #D45A5A · info #1982fc · white #FFFFFF

# Light surfaces (globals.css .light) — text/borders on white cards
on-light-primary #222222 · on-light-secondary #666666 · on-light-muted #999999
light-border #D8D8D8 · light-divider #E5E5E5 · light-bg-secondary #F2F2F2
```

Token usage rules:

- **Dark page chrome**: backgrounds `$bg-primary` / `$bg-secondary` / `$bg-card` / `$bg-deep`; text `$label-primary` / `$label-secondary` / `$label-muted`; borders `$border`; accents `$brand`.
- **White surfaces** (`fill: "$white"`): text `$on-light-primary` (body), `$on-light-secondary` (secondary/icons), `$on-light-muted` (placeholder/disabled); borders `$light-border`; row dividers & the TableGrid expand column `$light-divider`; subtle inner panels `$light-bg-secondary`.
- **Destructive** uses `$error` (e.g. the TableGrid delete trash icon).
- **No translucent tints** — Pencil fills do not support alpha. For active sidebar items and note/callout boxes use a **solid** `$bg-secondary` / `$bg-card` fill with a `$brand` accent border instead of a baked `#00A398xx` tint.
- Filled "primary" buttons use `fill: "$label-primary"` with `$on-light-primary` icon/text (matches `bg-label-primary text-fill-primary`). Do **not** use `$fill-primary` — it is not a token and resolves to black.

## EduHub standard component layouts

Replicate the structure/sizing of these real components (`components/common/`):

- **Settings sidebar**: width `240`, `fill: "$bg-deep"`, `padding: [20,0]`, right `$border`. Group label (10px `$label-muted`, padded `[0,16,4,16]`) then nav items height `36`, `padding: [0,16]`, text 13px `$label-secondary`. **Active item** = `fill: "$bg-secondary"` + left border `{left:3}` `$brand` + `$brand` text. A clickable "Settings" title (chevron-left + label, `$brand`) returns to the overview.
- **TableGrid** (`components/common/TableGrid`): rounded `12` container, `clip`, `$border`. Header row height `48`, `fill: "$bg-secondary"`, cells 12px/600 `$label-secondary`. Data rows on `$white`, height `48–64`, bottom divider `$light-divider`, text `$on-light-primary`. Built-in **toolbar above the table**, space-between: **AddButton left**, **Search right**. Optional **delete column** = fixed `80` wide, transparent, centered `$error` `trash-2` icon (disable = faint `$light-divider`). Optional **expand column** = fixed `40` wide, `$light-divider` fill, `chevron-down`/`chevron-right` icon.
- **AddButton**: rounded-full pill, `fill: "$label-primary"`, `padding ~[9,16]`, `circle-plus` icon + label, both `$on-light-primary`.
- **Search field**: width `256`, height `40`, `fill: "$bg-card"`, `$border`, cornerRadius `4`, "Search" label `$label-secondary` + `search` icon.
- **Button** (`Button.tsx`): rounded-full. Outline = transparent + 2px border + label (on light: `$on-light-primary`; on dark: `$border`/`$label-secondary`). Filled = `fill: "$label-primary"` (dark page) or `$on-light-primary` (in a light dialog) with contrasting text.
- **Dialog** (`DialogShell` + `QuestionConfirmationDialog`): **light/white** card (`fill: "$white"`, `$light-border`, rounded `8`, width ~`480`). Top row = title (`$on-light-primary`) + `x` close (`$on-light-secondary`). Body = plain text `$on-light-primary` (the whole message, incl. consequences, lives in the `question` string). Actions row = **Cancel** (outline pill) + **Confirm** (filled `$on-light-primary` pill, `$white` text). Backdrop = solid `$bg-deep`.
- **Inputs / dropdowns on white surfaces**: `fill: "$white"`, `$light-border`, cornerRadius `6–8`; dropdowns are space-between with a `chevron-down` `$on-light-secondary`.
- **Cards / panels**: `fill: "$bg-card"`, `$border`, cornerRadius `12`, `padding 16–20`.
- **EmailEditor** (`components/common/EmailEditor`, reused for certificate HTML): full-width subject input (`$white`), a header with a **Visual/HTML** toggle (`$bg-secondary` track, active segment `$bg-primary` + `$brand`), a formatting toolbar (`$white`, `$light-divider` divider, `$on-light-secondary` icons), a row of variable **chips** (`$light-border` outline, `$on-light-secondary` text), the editor area (`$white`), and a separate preview block.

## MCP server

Use the **Pencil** MCP server enabled in Cursor (e.g. `user-highagency.pencildev-extension-pencil`). Tool names include: `get_editor_state`, `open_document`, `get_guidelines`, `get_variables`, `set_variables`, `batch_get`, `batch_design`, `snapshot_layout`, `get_screenshot`, `find_empty_space_on_canvas`, `search_all_unique_properties`, `replace_all_matching_properties`, `export_nodes`.
