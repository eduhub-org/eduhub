# Course Widget Documentation

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

## Security Considerations

- The widget uses CORS headers to allow embedding from any domain
- API keys are validated server-side
- Only published courses are displayed
- The widget route is excluded from search engine indexing (`noindex, nofollow`)

## Support

For questions or issues with the widget, please contact the EduHub support team.
