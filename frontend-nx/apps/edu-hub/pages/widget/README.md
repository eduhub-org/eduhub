# EduHub Widget Documentation

EduHub exposes two embeddable widgets that external organizations can drop into
their websites via a simple iframe:

- **`/widget/courses`** — a slider of published courses (documented below).
- **`/widget/projects`** — a slider of public projects (see [Project Widget](#project-widget)).
- **`/widget/jobs`** — a slider of published Stujo job postings (see [Job Widget](#job-widget)).

All widgets share the same transparent, borderless, responsive styling and the
same base-URL/API-key behaviour.

## Overview

The EduHub Course Widget allows external organizations to embed course sliders into their websites using a simple iframe. The widget displays published courses in a responsive slider format.

## Environment Configuration

The widget automatically detects the base URL based on the environment:

- **Development**: Uses `window.location.origin` (typically `http://localhost:5000`)
- **Staging**: Uses `window.location.origin` (typically `https://edu-staging.opencampus.sh`)
- **Production**: Uses `window.location.origin` (typically `https://edu.opencampus.sh`)

You can override this by setting the `NEXT_PUBLIC_BASE_URL` environment variable:

```bash
# Development
NEXT_PUBLIC_BASE_URL=http://localhost:5000

# Staging
NEXT_PUBLIC_BASE_URL=https://edu-staging.opencampus.sh

# Production
NEXT_PUBLIC_BASE_URL=https://edu.opencampus.sh
```

**Note**: Since the widget is served from the EduHub domain (even when embedded in iframes), `window.location.origin` will correctly resolve to the EduHub domain in all environments.

## Basic Usage

### Simple Embed (All Courses)

```html
<iframe 
  src="https://edu.opencampus.sh/widget/courses" 
  frameborder="0" 
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

### Filter by Course Group

```html
<iframe 
  src="https://edu.opencampus.sh/widget/courses?group=1&lang=de" 
  frameborder="0" 
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

### Organization-Specific Courses (with API Key)

```html
<iframe 
  src="https://edu.opencampus.sh/widget/courses?apiKey=edh_live_org123_sk_abcdef1234567890&group=1&lang=de" 
  frameborder="0" 
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `group` | number | No | Filter courses by group order (1-5). If not provided, shows all courses. |
| `lang` | string | No | Language code (`de` or `en`). Defaults to German. |
| `apiKey` | string | No | Organization API key for organization-specific filtering. Format: `edh_live_org123_sk_...` |

## Course Groups

Course groups are numbered 1-5 and represent different course categories. Use the `group` parameter to filter:

- `group=1` - First course group
- `group=2` - Second course group
- `group=3` - Third course group
- `group=4` - Fourth course group
- `group=5` - Fifth course group

## API Key Authentication

To show only courses funded by a specific organization:

1. Obtain an API key from EduHub (format: `edh_live_org123_sk_...`)
2. Include the `apiKey` parameter in the widget URL
3. The widget will validate the API key and filter courses accordingly

**Note**: API key validation happens server-side for security.

## Styling

The widget is responsive and adapts to the iframe container size. Recommended iframe dimensions:

- **Height**: 435px (matches the course tile height exactly)
- **Width**: 100% of container (responsive)

### Widget Features

- **Transparent Background**: The widget background is fully transparent, allowing the host page background to show through
- **Tile Shadows**: Course tiles have subtle soft shadows for better visibility on bright backgrounds
- **No Cookie Consent**: Cookie consent dialogs are automatically hidden in widget mode
- **Borderless**: The widget is designed to be embedded without borders

### Custom Styling

You can customize the iframe appearance:

```html
<iframe 
  src="https://edu.opencampus.sh/widget/courses?group=1" 
  frameborder="0" 
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

## Behavior

- **Course Links**: Clicking on a course opens the course detail page in a new tab
- **Responsive**: The slider adapts to different screen sizes
- **Loading State**: Shows a loading indicator while fetching courses
- **Error Handling**: Displays user-friendly error messages if courses cannot be loaded
- **Empty State**: Shows a message when no courses match the filter criteria

## Examples

### Example 1: All Tech Courses (Group 1) in German

```html
<iframe 
  src="https://edu.opencampus.sh/widget/courses?group=1&lang=de" 
  frameborder="0" 
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

### Example 2: Organization-Specific Courses in English

```html
<iframe 
  src="https://edu.opencampus.sh/widget/courses?apiKey=YOUR_API_KEY&lang=en" 
  frameborder="0" 
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

### Example 3: All Courses (No Filter)

```html
<iframe 
  src="https://edu.opencampus.sh/widget/courses" 
  frameborder="0" 
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

## Project Widget

The Project Widget (`/widget/projects`) embeds a slider of public projects. It
reuses the same slider shell and styling as the course widget; only the tile
content and data source differ.

**Home-eligible projects** are shown: published showcase projects plus open
project templates (proposed, still accepting participants). Tiles link to the
public project page and open in a new tab.

### Simple Embed (All Projects)

```html
<iframe
  src="https://edu.opencampus.sh/widget/projects"
  frameborder="0"
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

### Filter by Course Group

Same query parameters as the course widget (`group`, `groups`):

```html
<iframe
  src="https://edu.opencampus.sh/widget/projects?group=1&locale=de"
  frameborder="0"
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

Multiple groups (comma-separated option ids):

```html
<iframe
  src="https://edu.opencampus.sh/widget/projects?groups=3,7&locale=de"
  frameborder="0"
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

Projects are matched when any linked course belongs to the selected course group
(or program type, for program-type-based groups).

### Organization-Specific Projects (with API Key)

```html
<iframe
  src="https://edu.opencampus.sh/widget/projects?apiKey=edh_live_org123_sk_abcdef1234567890&locale=en"
  frameborder="0"
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

### Query Parameters

Uses the same parameters as the course widget:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `group` | number | No | Filter by course group order (1–5). If not provided, shows all home-eligible projects. |
| `groups` | string | No | Comma-separated `CourseGroupOption` ids. Projects linked to a course in any matching group are included. |
| `locale` | string | No | Language code (`de` or `en`). Defaults to German. |
| `apiKey` | string | No | Organization API key. When valid, only that organization's projects are shown (server-side). Format: `edh_live_org123_sk_...` |

When neither `group` nor `groups` is provided, all home-eligible projects are
shown (most recently updated first). Organization scoping uses `Project.organizationId`
on the server, analogous to course funding-organization filtering.

## Job Widget

The Job Widget (`/widget/jobs`) embeds a slider of published Stujo job postings.
It reuses the same slider shell and styling as the course and project widgets;
only the tile content and data source differ.

Only **published, non-expired, unrestricted** postings are shown (enforced by the
Hasura anonymous permission), ordered featured-first then newest. Each tile shows
the employer logo on a Stujo-branded background, the job title, type, company,
location and occupation, with a small Stujo sign in the top-right corner. Tiles
link to the Stujo job detail page and always open in a new tab
(`https://<stujo-domain>/stellenangebote/<id>?utm_source=eduhub`), so they work
from inside an iframe without any extra configuration.

### Simple Embed (All Jobs)

```html
<iframe
  src="https://edu.opencampus.sh/widget/jobs"
  frameborder="0"
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

### Filter by Job Slider

Same query parameters as the project widget (`group`, `groups`). A job slider is
a `CourseGroupOption` with `contentType = 'JOB'`; the widget narrows the result to
the union of the selected sliders' job types:

```html
<iframe
  src="https://edu.opencampus.sh/widget/jobs?group=1&locale=de"
  frameborder="0"
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

Multiple sliders (comma-separated option ids):

```html
<iframe
  src="https://edu.opencampus.sh/widget/jobs?groups=3,7&locale=de"
  frameborder="0"
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

A selected slider with no job-type selection contributes "all types", so no type
filtering is applied when any selected slider selects zero types.

### Organization-Specific Jobs (with API Key)

```html
<iframe
  src="https://edu.opencampus.sh/widget/jobs?apiKey=edh_live_org123_sk_abcdef1234567890&locale=en"
  frameborder="0"
  style="width:100%; height:435px; border:none; background:transparent;">
</iframe>
```

### Query Parameters

Uses the same parameters as the project widget:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `group` | number | No | Filter by job slider `order`. If not provided, shows all published jobs. |
| `groups` | string | No | Comma-separated `CourseGroupOption` ids of JOB sliders. Jobs whose type is in the union of the selected sliders' job types are included. |
| `locale` | string | No | Language code (`de` or `en`). Defaults to German. |
| `apiKey` | string | No | Organization API key. When valid, only that organization's postings are shown (server-side). Format: `edh_live_org123_sk_...` |

When neither `group` nor `groups` is provided, all published postings are shown
(featured first, then newest). Organization scoping uses `JobPosting.organizationId`
on the server.

## Security Considerations

- The widget uses CORS headers to allow embedding from any domain
- API keys are validated server-side
- Only published courses / home-eligible projects are displayed
- The widget routes are excluded from search engine indexing (`noindex, nofollow`)

## Support

For questions or issues with the widget, please contact the EduHub support team.
