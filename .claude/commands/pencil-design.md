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

## Output reporting

When you finish a Pencil task, mention:
1. Which document was opened (path or `new`).
2. Which guides/variables were applied.
3. Whether a screenshot or `batch_get` was used to verify the result.
