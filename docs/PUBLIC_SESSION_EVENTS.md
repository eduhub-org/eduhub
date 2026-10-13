# Public sessions as events

Sometimes a single session of a course (an external speaker, a showcase) is
open to everyone, not only to the course's accepted participants. Such a
session is published as an **event**: listed under Events, with its own page
and direct registration, including guest registration.

## How it is modelled

The event is an ordinary `Course` in an `EVENTS` program. Its
`sourceSessionId` points at the course session it was created from (unique: one
event per session). Everything events already have works unchanged:
registration via `CourseEnrollment`, guest sign-up, mails, feeds, calendar and
capacity.

Course participants are **not** enrolled in the event. They keep attending
through the course; the event's registrations are the external people only.

## What the database does

Migrations `1791600000005_alter_table_public_Course_add_sourceSessionId` and
`1791600000007_sync_public_event_speakers`:

| Trigger | Effect |
|---|---|
| `check_Course_sourceSessionId` (before insert/update) | Source must be a course session of the same organization; the event must be in an `EVENTS` program; no chains (an event's session cannot be a source). A new event gets `registrationType = DIRECT_CONFIRMATION`. |
| `init_Course_from_sourceSession` (after insert, or update of `sourceSessionId`) | Copies the session (title, description, times), its locations and addresses, and its speakers into the event. |
| `sync_SessionSpeaker_to_public_event` | Adding or removing a speaker on the source session does the same on the event. Only the difference is applied, so speakers who stay are not mailed again. |
| `sync_Session_to_public_event` | Later changes to the source session's title, description or times are mirrored into the event's session. |
| `sync_SessionAddress_to_public_event` | Address changes on the source session rebuild the event's locations and addresses. |

The sync runs one way, from the course to the event, so the event's
"Programm" tab shows the synced session read-only: date, title, description,
location and speakers can't be edited there, and no sessions can be added or
deleted. The event's own title, texts, image, capacity and registration
settings stay editable. Deleting the source session unlinks the event
(`ON DELETE SET NULL`) and leaves it standalone.

When a source session is rescheduled and the editor confirms the notification,
`notifySessionParticipants` mails the course participants and the event's
registrants. The registrants' mail links to the event page.

## The workflow

1. Course management → **Termine** → expand a session → **Öffentliche
   Veranstaltung** → **Als Veranstaltung anlegen**. Visible to super admins and
   to org admins with `canManageEvents`. If the organization has several events
   programs, a picker asks which one to use.
2. An unpublished draft is created and opened. Its texts are pre-filled from
   the session ("Worum es in dieser Session geht") and the course ("Über den
   Kurs …").
3. Review the texts, image and capacity, open **Vorschau der Seite**, then
   **Veröffentlichen**. Only now does the event appear in the Events list and
   feeds.

The event page links back to the course ("Teil des Kurses …") while that course
is published.
