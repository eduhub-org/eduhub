# EduHub

EduHub is opencampus.sh's platform for publishing courses and events, taking
registrations, and running them session by session.

## Language

### Offerings

**Course**:
Something people enroll in. It is run as one or more Sessions.
_Avoid_: Offering (UI wording only), class

**Event**:
A Course whose Program has type `EVENTS`. It follows every Course rule. It is
not a separate concept.
_Avoid_: treating externally synced listings (e.g. Rausgegangen) as Events

**Session**:
One scheduled meeting of a Course, with a start and an end.

**First Session**:
The Course's Session with the earliest start time.

### Participation

**Participant**:
Someone whose Course Enrollment is `CONFIRMED` or `REGISTERED` and is not a
test enrollment.

### Communication

**Session Reminder**:
One email per Participant per Course. It goes out a set Reminder Lead Time
before the Course's First Session. It is sent at most once: moving the First
Session or adding an earlier one does not send another. A Participant who
enrolls after the reminder time but before the First Session starts gets it
late rather than not at all.
_Avoid_: reminders for later Sessions, multiple reminders per Course

**Reminder Lead Time**:
How long before the First Session the Session Reminder goes out. It is set per
Course in hours, or "Off" to send no Session Reminder for that Course.

**Session Change Notification**:
The email instructors send by hand when Sessions are rescheduled. It is
separate from the Session Reminder.

## Relationships

- A **Course** has one or more **Sessions**, and exactly one of them is its
  **First Session**
- A **Participant** receives at most one **Session Reminder** per **Course**

## Flagged ambiguities

- "Session reminder" used to mean three emails (24h, 1h, 15min) before
  sessions. Resolved: one email, before the First Session only, at the
  Course's Reminder Lead Time.
