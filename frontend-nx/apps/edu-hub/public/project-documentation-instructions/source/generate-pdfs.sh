#!/usr/bin/env bash
# Build default instruction PDFs from markdown in this directory.
# Requires: pandoc, google-chrome or chromium (headless).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$(dirname "$SCRIPT_DIR")"

CHROME=""
for candidate in google-chrome chromium chromium-browser; do
  if command -v "$candidate" >/dev/null 2>&1; then
    CHROME="$candidate"
    break
  fi
done

if ! command -v pandoc >/dev/null 2>&1; then
  echo "pandoc is required (e.g. sudo apt install pandoc)" >&2
  exit 1
fi

if [ -z "$CHROME" ]; then
  echo "google-chrome or chromium is required for PDF output without pdflatex" >&2
  exit 1
fi

CSS="body{font-family:system-ui,sans-serif;max-width:800px;margin:2em auto;line-height:1.45;font-size:11pt}"
CSS="${CSS}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 8px}"
CSS="${CSS}h1{font-size:1.4em}h2{font-size:1.15em;margin-top:1.2em}hr{margin:2em 0}"
CSS="${CSS}header#title-block-header{display:none}"

for f in "$SCRIPT_DIR"/*.md; do
  [ "$(basename "$f")" = README.md ] && continue
  base="$(basename "${f%.md}")"
  html="$SCRIPT_DIR/.build-${base}.html"
  pdf="$OUT_DIR/${base}.pdf"

  # PDF body = markdown only (no pandoc metadata title block).
  pandoc "$f" -o "$html" --standalone -M title=" " -c "data:text/css,${CSS}"

  "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="$pdf" "file://${html}"

  rm -f "$html"
  echo "Wrote $pdf"
done
