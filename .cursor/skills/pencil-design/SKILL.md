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

## MCP server

Use the **Pencil** MCP server enabled in Cursor (e.g. `user-highagency.pencildev-extension-pencil`). Tool names include: `get_editor_state`, `open_document`, `get_guidelines`, `get_variables`, `set_variables`, `batch_get`, `batch_design`, `snapshot_layout`, `get_screenshot`, `find_empty_space_on_canvas`, `search_all_unique_properties`, `replace_all_matching_properties`, `export_nodes`.
