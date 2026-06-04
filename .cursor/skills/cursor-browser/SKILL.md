---
name: cursor-browser
description: Inspect UI via cursor-ide-browser (Cursor Browser tab); fall back to user-playwright if internal browser MCP is unavailable. Use for @Browser, open tab, layout checks, localhost — or when user explicitly asks for Playwright.
---
# Cursor IDE Browser

Use this skill for **Browser panel / UI verification** in the repo.

## MCP priority

1. **Primary:** `cursor-ide-browser` — user's open Cursor Browser tabs.
2. **Fallback:** `user-playwright` — when internal browser MCP is missing or failing,
   or user explicitly wants Playwright (headless / E2E / isolated session).

On fallback, state briefly that you are not on the user's Cursor tab.

## Workflow (`cursor-ide-browser`)

1. **List tabs:** `browser_tabs` with `action: "list"`.
2. **Pick tab:** Use `viewId` from the list, or `browser_tabs` `select` if needed.
3. **Lock** (existing tab): `browser_lock` with `action: "lock"` before interactions.
4. **Inspect:** `browser_snapshot` (structure), `browser_take_screenshot` (visual).
5. **Act:** `browser_click`, `browser_fill`, `browser_type`, `browser_scroll`, etc.
6. **Navigate:** `browser_navigate` — omit `position` unless the user wants the browser revealed.
7. **Unlock:** `browser_lock` with `action: "unlock"` when finished.

Read each tool's schema in the MCP folder before first use in a session.

## Fallback workflow (`user-playwright`)

Try `cursor-ide-browser` first. If unavailable:

1. Use `user-playwright` tools (`browser_navigate`, `browser_snapshot`, etc.).
2. Navigate to the URL the user cares about (e.g. `http://localhost:5000/...`).
3. Note that login state may differ from the user's Cursor tab.

## Common mistakes

- Using Playwright while `cursor-ide-browser` is available and the user meant their open tab.
- Assuming Playwright URLs match the user's Cursor Browser without checking `browser_tabs`.
- Using `browser_navigate` with `position: "active"` when a background check is enough.

Persistent rule: `.cursor/rules/cursor-browser-mcp.mdc` (always applied).
