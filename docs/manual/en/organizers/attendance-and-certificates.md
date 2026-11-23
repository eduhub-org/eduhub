---
title: Attendance and certificates
slug: organizers/attendance-and-certificates
audience: [organizer, admin]
order: 40
language: en
summary: How attendance is recorded automatically, how Organizers check and correct it, and how certificates are issued.
---

## How attendance is recorded

Every night EduHub checks the Sessions that have ended and sets an **attendance** (attended or missed) for each participant:

- **Online:** from the Zoom participant list. Someone counts as attended after spending at least half of the Session in the meeting. Several entries of the same person (renamed for breakout rooms, phone dial-in) are added up. People are recognised by their email address or their name, so ask participants to join with the name they use in EduHub.
- **On site:** from check-ins made between 30 minutes before the Session starts and 30 minutes after it ends. A check-in counts regardless of time.

Until a Session has been checked its attendance is unknown, never missed. If Zoom or the check-in data can't be read, the Session is checked again the next night.

## Checking attendance

- **Dates** tab: each Session shows how many people attended, for example "12 / 15 attended", or **Recorded after the session**. **Review raw attendance data** shows the entries Zoom and the check-in delivered, including those that matched nobody.
- **Participations** tab (or **Projects & Participations**): one dot per Session for each participant, and an overall status: **Attendance requirement met**, **not met**, or **Attendance status pending**. Hover over a dot to see why it was set.

## Correcting attendance

Click a participant's dot for a Session to set the attendance by hand. A manual attendance always wins over the automatic one and is marked as manual. Click again until it matches the automatic result to revert it; the automatic result comes back. The nightly check never overwrites a manual attendance.

## Certificates

Which certificates a course awards, the ECTS credits and the **Maximum Missed Sessions** are set under **Award certificates** in the course list (see [Setting up a course](course-setup.md#settings-in-the-course-list)).

- **Attendance Certificate:** for participants whose missed mandatory Sessions, together with those not checked yet, stay within the allowed number (**Attendance requirement met**).
- **Achievement Certificate:** additionally requires a completed project rated as passed.

Certificates are issued by Admins, on the **Participations** tab with **Generate Attendance Certificates** or **Generate Achievement Certificates**. Participants who don't meet the requirements are skipped. Each participant gets an email when a certificate is ready and finds it under **My Certificates**.

Participants who reach the maximum number of missed Sessions automatically get an email asking whether they want to continue the course.
