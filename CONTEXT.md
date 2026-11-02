# EduHub

Courses, events and degrees that people register for, and the organizers who run them.

## Language

### Taking part

**Course**:
Anything people register for: a course, an event or a degree, offered in a program.
_Avoid_: Offering (in code), Kurs/Veranstaltung used interchangeably

**Registration**:
A person's enrollment in a course, whatever its state. Direct registration needs no decision by an organizer; an application does.
_Avoid_: Sign-up (in code and copy)

**Place**:
One of a course's limited participant slots (`maxParticipants`). A place is **held** by someone confirmed, registered or invited.
_Avoid_: Seat, spot (except in user-facing English copy)

**Waitlist**:
The people who registered while no place was open to them, in the order they registered. Free places belong to the waitlist first: a course reopens to newcomers only when it has more free places than people waiting.
_Avoid_: Queue

**Invitation**:
An offer of a held place that the invited person accepts by a deadline (the invitation's last day). On an application course they confirm it; on a paid course they accept it by paying. An invitation that is not accepted in time expires and frees its place.
_Avoid_: Offer, promotion (for the invitation itself)

**Moving up**:
An organizer giving someone on the waitlist a place: confirmed straight away on a free direct-registration course, or an invitation everywhere else.
_Avoid_: Promotion (in copy), automatic moving up — it is always the organizer's decision

**Declining**:
An invited person giving up their invitation. Its place is free again and the organizers are told.

**Event**:
A Course whose Program has type `EVENTS`. It follows every Course rule; it is not a separate concept.
_Avoid_: treating externally synced listings (e.g. Rausgegangen) as Events

**Session**:
One scheduled meeting of a Course, with a start and an end.

**First Session**:
The Course's Session with the earliest start time.

**Participant**:
Someone whose Registration is confirmed or registered and is not a test enrollment.

**Overbooking**:
More places held than the course has. Only organizers can overbook, and are warned before they do; people registering themselves never can.

### Organizers

**Organizer**:
Someone who runs a course: its instructors and the admins of its organization who manage that kind of program.
_Avoid_: Kursleitung (as a role name in code)

### Communication

**Session Reminder**:
One email per Participant per Course, sent a set Reminder Lead Time before the Course's First Session. It is sent at most once: moving the First Session or adding an earlier one does not send another. A Participant who registers after the reminder time but before the First Session starts gets it late rather than not at all.
_Avoid_: reminders for later Sessions, multiple reminders per Course

**Reminder Lead Time**:
How long before the First Session the Session Reminder goes out, set per Course in hours, or off to send none.

**Session Change Notification**:
The email organizers send by hand when Sessions are rescheduled. Separate from the Session Reminder.

## Relationships

- A **Course** has a number of **Places** and at most one **Registration** per person
- A **Waitlist** belongs to one **Course**; **Moving up** takes someone off it
- An **Invitation** holds one **Place** until it is accepted, declined or expires
- A **Course** has one or more **Sessions**, exactly one of them its **First Session**
- A **Participant** receives at most one **Session Reminder** per **Course**

## Example dialogue

> **Dev:** "Someone cancelled on a full paid event and nobody is waiting — does the place go to the next person who registers?"
> **Domain expert:** "Yes. Only when people are waiting does a free place belong to the **Waitlist**; then the organizer **moves someone up** with an **Invitation**, and the place is held until they pay or the deadline passes."

## Flagged ambiguities

- "Invite" meant both the application decision (green rating) and moving someone up from the waitlist. Both are an **Invitation**: the same held place with a deadline; how it is accepted depends on the course (confirm or pay).
- "Session reminder" meant three emails (24h, 1h, 15min) before sessions. Resolved: one email, before the First Session only, at the Course's Reminder Lead Time.
