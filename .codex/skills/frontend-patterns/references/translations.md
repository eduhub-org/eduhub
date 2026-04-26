# EduHub Translation Notes

## Mandatory German Tone

Use informal German "Du", never formal "Sie".

## File Location

- `frontend-nx/apps/edu-hub/locales/de.json`
- `frontend-nx/apps/edu-hub/locales/en.json`

## Key Naming

- namespace: camelCase
- component group: PascalCase
- translation key: snake_case
- DB enum-backed translation keys may remain ALL_CAPS when they map directly to database enum values

## Practical Rule

When adding a new user-facing label, error, or aria label:

1. add the key in both locale files
2. keep the wording consistent with nearby keys
3. preserve the "Du" form in German
