# Events on Rausgegangen

Events (courses in an `EVENTS` program) can be shared on
[rausgegangen.de](https://rausgegangen.de) through the Rausgegangen API
(`https://api.zentrale.rausgegangen.de/v2/`). The API key belongs to one
Rausgegangen team, so it is stored per organization.

## Activation and setup

1. **A super admin activates the feature.** Under Settings → Organizations,
   open the organization and tick "Veranstaltungen auf Rausgegangen
   veröffentlichen" under "Freigeschaltete Funktionen".
   - These checkboxes are the general per-organization feature mechanism: the
     `OrganizationFeature` table, with the `OrganizationFeatureOption` enum.
   - Only `admin` can write them.
2. **Enter the API key in the same place.** You get it from
   zentrale@rausgegangen.de.
   - It is stored encrypted (`Organization.rausgegangenApiKeyEncrypted`).
   - Only the node functions decrypt it.
3. **Test mode is on by default.** Events are sent unpublished; check them
   through the preview link, then switch test mode off.
4. **Share each event separately.** In course management, the event's
   "Rausgegangen" section has the switch "Auf Rausgegangen veröffentlichen",
   plus category and tags.
   - Super admins can use it, as can org admins with `canManageEvents` or
     `canManageSettings`.

Deactivating the feature unpublishes all of the organization's events on
Rausgegangen. Unpublishing an event in EduHub first asks whether to unpublish
it there too; that option is preselected.

## Mapping

| Rausgegangen | EduHub |
|---|---|
| Event | The course: title, cover image and `coverImageCredits`, category and tags from `RausgegangenListing`, description, price (`basePrice`/`cost`) |
| Show | Exactly **one** per event: the first in-person session, with its location and the registration link. `end_date` is sent only for single-session events. |
| Location | The session's `LocationAddress`, using the structured fields (street, zip code, city, coordinates, …) |

Rausgegangen has no registration per show, while EduHub registration is for the
whole event. So multi-session events become one show, and every session is
listed under "Termine" in the description.

**Locations:**
- Each location is linked to a Rausgegangen venue
  (`LocationAddress.rausgegangenLocationId`).
- The first sync links an exact street + zip code match. If there is none, it
  creates our own venue, which needs a complete address and coordinates.
- Super admins can also link a venue by hand: Settings → Location addresses →
  "Auf Rausgegangen suchen".
- Only venues we created (`rausgegangenLocationOwned`) are updated by the sync.

## Sync

The node function `syncRausgegangenEvent` handles everything:
- **Event triggers** on `RausgegangenListing`, `Course`, `Session`,
  `SessionAddress`, `LocationAddress`, and on `OrganizationFeature` delete.
- **The nightly cron** `reconcile_rausgegangen_events`, which also catches
  sold-out changes.
- **The action** `syncRausgegangenEventNow`, the "Jetzt synchronisieren" button.

Objects are addressed by `mapping_id`, so every write is idempotent. The
outcome is recorded on the listing: `syncStatus`, `syncError`, `previewUrl`
and `publicUrl`.

## Environments

There is no Rausgegangen sandbox: every environment talks to the live API.
`lib/rausgegangen.js` therefore enforces the following outside production
(`ENVIRONMENT !== 'production'`):

- Events and locations are always sent with `published: false`.
- Mapping ids carry the environment (`eduhub-staging-event-12`), so staging
  never overwrites production objects.
- Stored Rausgegangen ids are never sent. This protects production objects
  when a staging database was restored from production.

`RAUSGEGANGEN_API_URL` overrides the API base URL. The default is the live API.

## Open questions for dev-support@rausgegangen.de

- The exact request shape of PATCH and DELETE when addressing by `mapping_id`.
  The client sends it in the body of a request to the collection URL.
- Whether `/locations/search` needs the API key. The client always sends it.
- Rate limits.
