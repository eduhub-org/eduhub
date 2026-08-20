# Default instruction PDFs — markdown source

Bilingual (German **Du** + English) source text for the **eight default**
instruction PDFs only. Custom instructions created in app-settings are stored
in **Google Cloud Storage**, not here.

Each `.md` file maps 1:1 to a PDF in the parent folder:
`../` (e.g. `../ONLINE_COURSE.pdf`).

## Filenames (export target)

| Project type | PDF filename |
|---|---|
| `ONLINE_COURSE` | `ONLINE_COURSE.pdf` |
| `CLASSIC_PROJECT` | `CLASSIC_PROJECT.pdf` |
| `PROJECT_WITH_DOCUMENTATION_ONLY` | `PROJECT_WITH_DOCUMENTATION_ONLY.pdf` |
| `PROJECT_WITH_LINK` | `PROJECT_WITH_LINK.pdf` |
| `PROJECT_WITH_PRESENTATION` | `PROJECT_WITH_PRESENTATION.pdf` |
| `PROJECT_WITH_LINK_AND_PRESENTATION` | `PROJECT_WITH_LINK_AND_PRESENTATION.pdf` |
| `PRESENTATION_WITHOUT_DOCUMENTATION` | `PRESENTATION_WITHOUT_DOCUMENTATION.pdf` |
| `PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION` | `PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION.pdf` |

## How to turn these into PDFs

### Regenerate all eight (repo script)

From this directory:

```bash
./generate-pdfs.sh
```

Uses **pandoc → HTML → headless Chrome** (no `pdflatex` required). PDFs are
written to `../<TYPE>.pdf`.

### Manual / fillable `ONLINE_COURSE`

Pandoc PDFs are **not fillable**. For the reflection questionnaire, open
`ONLINE_COURSE.md` in LibreOffice or Acrobat and add AcroForm fields over each
underline (field names are listed at the top of that file).

### Why `pandoc -o file.pdf` fails here

`pandoc` alone needs a LaTeX engine (`pdflatex`). Ubuntu’s `pandoc` package
does not install it. Either install `texlive-latex-base` (or use the script
above), and run from **this** `source/` folder — not `docs/` (that path was
removed).

Wrong output path (do **not** use from `source/`):

```bash
# Broken: one too many ../ segments
pandoc "$f" -o "../../frontend-nx/apps/edu-hub/public/..."
```

Correct relative output: `../${f%.md}.pdf`

## Content principles (from the product plan)

- One PDF per type, **both languages in one file** (DE block, then EN block,
  except `ONLINE_COURSE` which uses separate fillable forms per language).
- **ONLINE_COURSE:** fillable self-reflection questionnaire (Reflexionsfragebogen).
- **CLASSIC_PROJECT** and publishable types: describe what to submit in EduHub
  and what good documentation looks like.
- **No-documentation types:** primary deliverables are presentation (+ link
  where applicable) and cover image; written documentation is **optional**.

Accepted upload formats in EduHub (for reference in the PDFs):

- Documentation: PDF, Word (.doc, .docx), ODT, ZIP — max. 23 MB
- Presentation: PDF, PowerPoint (.ppt, .pptx), ODP — max. 23 MB
