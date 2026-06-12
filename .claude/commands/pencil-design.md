Work with Pencil `.pen` design files via the Pencil MCP server.

Use this skill when:
- creating or editing `.pen` files
- exploring or wireframing EduHub screens in Pencil
- the user mentions Pencil, `.pen`, or the highagency Pencil extension

## Hard rules

1. **Never use Read or Grep on `.pen` files.** They are encrypted/binary and
   only the Pencil MCP tools can decode them.
2. **Load deferred tool schemas before calling.** The Pencil MCP tools
   (`mcp__pencil__*`) are deferred — their schemas must be fetched via
   `ToolSearch` (`select:mcp__pencil__batch_design,...`) before they can be
   invoked. Parameters must match each tool's schema exactly.
3. **Persist files inside the repo.** Save new designs to
   `/home/steffen/git/eduhub/design/<name>.pen` so they can be reviewed and
   versioned. Open with `open_document` using that absolute path, or `"new"`
   for a scratch document.

## Available tools

`get_editor_state`, `open_document`, `get_guidelines`, `batch_get`,
`batch_design`, `snapshot_layout`, `get_screenshot`, `get_variables`,
`set_variables`, `find_empty_space_on_canvas`,
`search_all_unique_properties`, `replace_all_matching_properties`,
`export_nodes`.

## Typical workflow

1. **`get_editor_state`** — see the active document and top-level node IDs.
2. **`open_document`** — pass an absolute `.pen` path or `"new"`.
3. **`get_guidelines`** — list available guides/styles; load `Web App`,
   `Design System`, `Table`, etc. as needed.
4. **`get_variables`** — if it returns `{}` or is missing keys, every
   `$--*` token resolves to **black** (`#000000`) on the canvas.
5. **`set_variables`** — define theme tokens **before or right after**
   building screens. Names go without the `$` (e.g. `--background`); reference
   them in node properties as `$--background`. Use the `{ value, theme }`
   array form for theme-aware colors.
6. **`batch_design`** — insert/update frames and content. Constraints:
   - **Max ~25 operations per call.**
   - Every `I` (insert), `C` (create child), or `R` (replace) op needs a
     binding name.
   - Property values must match the tool description exactly. Examples:
     `alignItems` accepts only `start`/`center`/`end`; do not pass invalid
     node props.
7. **`batch_get`** — inspect nodes; pass `resolveVariables: true` to see
   resolved colors once variables are defined.
8. **`replace_all_matching_properties`** — bulk-fix baked colors (e.g.
   replace `#000000` fills) under chosen parent node IDs.
9. **`get_screenshot`** — verify layout after substantive changes.

## Avoiding the "all black" canvas

On a fresh document or one with empty variables, `$--*` fills and text
resolve to `#000000`. Either:

- Run **`set_variables`** with at least `--background`, `--foreground`,
  `--muted-foreground`, `--card`, `--border`, `--primary`, `--secondary` (and
  `--radius-m` / `--radius-pill` if used in `cornerRadius`), **or**
- Use explicit hex in `batch_design` (`fill: "#EBEBEB"`) for wireframes that
  must always read clearly.

If nodes are already black, use `replace_all_matching_properties` on
`fillColor`, `textColor`, `strokeColor` from `#000000` to intended values
under the screen parent IDs, then fine-tune with `U(...)`.

## EduHub alignment

When designing screens that will be implemented in the app, mirror semantic
tokens from `frontend-nx/apps/edu-hub/.cursor/rules/theme-and-styling.mdc`
(brand green, label/fill/border roles). Pencil variables can stand in for
those roles even if the hex values are approximations.

## EduHub color schema (use variables, never hard-coded hex)

EduHub screens are **dark by default**, with **light "content" surfaces**
(TableGrid rows, editors, A4 previews, dialogs use the `.light` theme in code).
Seed both sets once with `set_variables`, then reference tokens as `$name`
(e.g. `$brand`). Mirror `frontend-nx/apps/edu-hub/styles/globals.css`:

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

Rules:

- **Dark chrome**: `$bg-primary`/`$bg-secondary`/`$bg-card`/`$bg-deep`,
  text `$label-primary`/`$label-secondary`/`$label-muted`, borders `$border`,
  accent `$brand`.
- **White surfaces** (`fill: "$white"`): text `$on-light-primary` /
  `$on-light-secondary` / `$on-light-muted`; borders `$light-border`; row
  dividers and the TableGrid expand column `$light-divider`; subtle inner
  panels `$light-bg-secondary`.
- **Destructive** uses `$error` (e.g. TableGrid delete trash icon).
- **No translucent tints** (Pencil fills lack alpha): active sidebar items and
  note/callout boxes use a **solid** `$bg-secondary` / `$bg-card` fill with a
  `$brand` accent border, not a baked `#00A398xx` tint.
- Filled primary buttons use `fill: "$label-primary"` with `$on-light-primary`
  text. `$fill-primary` is **not** a token (resolves to black) — do not use it.

## EduHub standard component layouts

Replicate the structure/sizing of these real components (`components/common/`):

- **Settings sidebar**: width `240`, `fill: "$bg-deep"`, `padding: [20,0]`,
  right `$border`. Group label (10px `$label-muted`) then nav items height `36`,
  `padding: [0,16]`, 13px `$label-secondary`. **Active** = `$bg-secondary` fill
  + 3px left `$brand` border + `$brand` text. Clickable "Settings" title
  (chevron-left + label, `$brand`) returns to the overview.
- **TableGrid**: rounded `12`, `clip`, `$border`. Header height `48`,
  `fill: "$bg-secondary"`, 12px/600 `$label-secondary` cells. Rows on `$white`,
  height `48–64`, bottom `$light-divider`, text `$on-light-primary`. Built-in
  **toolbar above the table** (space-between): **AddButton left**, **Search
  right**. **Delete column** = `80` wide, transparent, centered `$error`
  `trash-2` (faint `$light-divider` when disabled). **Expand column** = `40`
  wide, `$light-divider`, `chevron-down`/`chevron-right`.
- **AddButton**: rounded-full, `fill: "$label-primary"`, `padding ~[9,16]`,
  `circle-plus` icon + label, both `$on-light-primary`.
- **Search field**: width `256`, height `40`, `fill: "$bg-card"`, `$border`,
  cornerRadius `4`, "Search" `$label-secondary` + `search` icon.
- **Button**: rounded-full. Outline = transparent + 2px border + label. Filled
  = `$label-primary` (dark page) or `$on-light-primary` (light dialog) with
  contrasting text.
- **Dialog** (`DialogShell` + `QuestionConfirmationDialog`): **light/white**
  card (`fill: "$white"`, `$light-border`, rounded `8`, width ~`480`). Top =
  title `$on-light-primary` + `x` close `$on-light-secondary`. Body = plain
  text `$on-light-primary` (full message incl. consequences in the `question`
  string). Actions = Cancel (outline pill) + Confirm (filled `$on-light-primary`
  pill, `$white` text). Backdrop = solid `$bg-deep`.
- **Inputs / dropdowns on white**: `$white`, `$light-border`, cornerRadius
  `6–8`; dropdowns space-between with a `chevron-down` `$on-light-secondary`.
- **Cards / panels**: `$bg-card`, `$border`, cornerRadius `12`, padding `16–20`.
- **EmailEditor** (reused for certificate HTML): full-width subject input
  (`$white`); header with a **Visual/HTML** toggle (`$bg-secondary` track,
  active segment `$bg-primary` + `$brand`); formatting toolbar (`$white`,
  `$light-divider` divider, `$on-light-secondary` icons); variable **chips**
  (`$light-border` outline, `$on-light-secondary` text); editor area (`$white`);
  separate preview block.

## Output reporting

When you finish a Pencil task, mention:
1. Which document was opened (path or `new`).
2. Which guides/variables were applied.
3. Whether a screenshot or `batch_get` was used to verify the result.
