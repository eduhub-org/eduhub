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

**Session Location**:
A place a Session takes place at. A Course's Session takes place at all of the Course's locations unless one was removed for that Session (e.g. a Session that is exceptionally online only); it always keeps at least one.

**First Session**:
The Course's Session with the earliest start time.

**Participant**:
Someone whose Registration is confirmed or registered and is not a test enrollment.

**Overbooking**:
More places held than the course has. Only organizers can overbook, and are warned before they do; people registering themselves never can.

### Attendance

**Attendance Record**:
One entry from an attendance source for a Session: a Zoom participant or a submitted check-in (LimeSurvey) response. Records are kept as they came in; many match nobody (other courses, unsubmitted, unknown names).
_Avoid_: attendance (for a raw entry)

**Attendance**:
A Participant's result for one Session: attended or missed. It is set automatically from the Attendance Records, or by an Organizer as a Manual Attendance. Until a Session has been checked there is no Attendance: it is unknown, never missed. A checked Session with no Attendance Records at all makes everyone missed.

**Minimum Attendance Time**:
The share of a Session (50 %) someone must spend in the online meeting for it to count as attended. Several Zoom records of the same person (renamed for breakout rooms, phone dial-in) add up; time on two devices at once counts once. A check-in on site counts as attended regardless of time. When someone has both, the one that counts wins.

**Check-in Window**:
From 30 minutes before a Session starts to 30 minutes after it ends. Only check-ins inside it belong to the Session.

**Manual Attendance**:
An Attendance an Organizer set by hand. It always takes precedence over the automatic one, which is kept underneath and comes back when the Organizer reverts their setting.

**Attendance Location**:
Where an attended Attendance took place: on site (a Course location such as Kiel or Heide) or online. A Manual Attendance has none and is counted as "manual".

### Paying

**Invoice**:
The numbered document (Rechnung) a buyer receives for a paid course or job posting. Paid by card or **Direct debit**, it exists only once the money is collected, so for a direct debit it follows days after the purchase. Bought on account (bank transfer), it is issued first and paid afterwards.
_Avoid_: Receipt, Beleg (for the invoice itself)

**Direct debit**:
Paying by SEPA Lastschrift: the course place or job posting is granted at checkout, but the money is collected days later, and the invoice is sent separately once it is.
_Avoid_: SEPA (on its own, in copy)

### Organizers

**Organizer**:
Someone who runs a course: its instructors and the admins of its organization who manage that kind of program.
_Avoid_: Kursleitung (as a role name in code)

**Admin**:
Someone with full access to everything on the platform, across all organizations. Not tied to any one organization.
_Avoid_: Super admin

**Org Admin**:
Someone who manages the programs of one organization, limited to the kinds of program (courses, events, degrees) they are allowed to manage.

### Experts

**Expert**:
A person who taught, spoke or mentored on the platform: an instructor of a course (an organizer for events), a speaker at a session, a mentor of a project or a mentor of an achievement option. Only active accounts count. The **Expert Directory** lists them so admins can find someone for a topic again.
_Avoid_: Referent:in (as the umbrella term), Dozent:in

**Expert Role**:
One thing an **Expert** did: one course they led, one session they spoke at, one project or achievement option they mentored. Search, match explanations and similarity all work per role, not per person.

**Last Active**:
The date of an **Expert's** most recent **Expert Role**: a course's program start, a session's start, or when a mentored project or achievement option was created.

**Expert Note**:
A dated entry an **Admin** or **Org Admin** writes about an **Expert**, e.g. what they talked about or when they are available. Notes from central admins are seen by admins only; notes from an org admin are seen by that organization's admins and by central admins. Written as if the expert will read them: they can ask to see them.
_Avoid_: Bewertung, rating (notes are facts, not judgements)

**Similar Expert**:
An **Expert** who did not match the words of a search, but one of whose **Expert Roles** is close to it in meaning. Shown below the keyword results, with the role that made them similar.

**Do Not Contact**:
A mark on a person that they do not want to be contacted about new formats. Admins and the org admins of their courses can set it; only admins can remove it. The **Expert Directory** greys them out, hides the contact buttons and leaves them out of exports.

### Projects

**Project**:
Work done by a team of participants within a course: proposed, carried out, submitted and reviewed. It can be listed in more than one course.

**Project Template**:
A project offered in a course for teams to take on. It is not worked on directly: each team gets its own **Project Copy**.
_Avoid_: Vorlage (in code)

**Project Copy**:
A team's own project, created from a **Project Template**. Its title comes from the template and can't be changed while it is still linked to that template.

**Project Team**:
The participants accepted onto a project. They do the work and decide on **Join Requests**.
_Avoid_: owner (for the team)

**Project Proposer**:
The person who started a project: whoever proposed it, created it in a course, or took on the **Project Template** it was copied from. For a **Project Copy** that is the team member who took on the template, never the template's creator. Being the proposer gives no say over the project once a team exists.
_Avoid_: owner

**Join Request**:
A participant's request to become a member of an existing **Project Team**. The team accepts or declines it; course instructors can as well.

**Project Page**:
The page showing one project. Anyone can see a published project or an open **Project Template**; every other project only the people who can see it in its course: its team, its proposer, its mentors, the course's instructors and participants.

**Passed Project**:
A project whose review rated it as passed, whether it has been published or not, and any project shown in the public showcase. A project rated as not passed and not shown in the showcase is not a passed project.

**Removing a project from a course**:
Taking a project out of one course. The project stays in every other course it is listed in, and is only deleted once no course is left. A **Passed Project** can't be taken out of its last course, since that would delete it.
_Avoid_: Deleting (when the project is still listed in other courses)

### Communication

**Session Reminder**:
One email per Participant per Course, sent a set Reminder Lead Time before the Course's First Session. It is sent at most once: moving the First Session or adding an earlier one does not send another. A Participant who registers after the reminder time but before the First Session starts gets it late rather than not at all.
_Avoid_: reminders for later Sessions, multiple reminders per Course

**Reminder Lead Time**:
How long before the First Session the Session Reminder goes out, set per Course in hours, or off to send none.

**Session Change Notification**:
The email organizers send by hand when Sessions are rescheduled or their Session Locations change. It says what the Session was before. Separate from the Session Reminder.

**Registration Confirmation**:
The email a person gets once their Registration is confirmed. It is the same for Events and other Courses: when and where it names follow the Course's Sessions and Session Locations, not its Program type.
_Avoid_: event confirmation vs. course confirmation as separate emails

### Assistant

**Assistant**:
The in-app AI chat that answers questions about the platform, its courses and the asker's own data, and helps **Organizers** set up their courses. It acts only on behalf of the person chatting and can never see or do more than they can. It is plainly a machine: it has no human name or persona and never claims to be human.
_Avoid_: Chatbot, agent, bot (in copy), any persona name

**Proposed Change**:
A change to a course the **Assistant** has drafted for an **Organizer**, shown as before and after. Nothing is saved until the Organizer applies it; they can also discard it.
_Avoid_: Action, auto-edit

## Relationships

- A **Course** has a number of **Places** and at most one **Registration** per person
- A **Waitlist** belongs to one **Course**; **Moving up** takes someone off it
- An **Invitation** holds one **Place** until it is accepted, declined or expires
- A **Course** has zero or more **Sessions**; when it has any, exactly one of them is its **First Session**
- A **Participant** receives at most one **Session Reminder** per **Course**
- A **Session** has many **Attendance Records** and at most one **Attendance** per **Participant** (or person who completed the Course); a **Manual Attendance** overrides the automatic one
- An **Attendance Record** belongs to at most one **Attendance**; an **Attendance** can combine several Zoom **Attendance Records** of the same person
- A **Session** has at most one **Manual Attendance** per **Participant**
- A **Project** is listed in one or more **Courses**; removing it from its last course deletes it, so a **Passed Project** can't be removed from its last course
- A **Project Template** has zero or more **Project Copies**; deleting the template keeps the copies as projects of their own
- A **Passed Project** can't be deleted by anyone, **Admins** included
- A **Join Request** is announced to the **Project Team**; only a project with no team yet announces it to its mentors (or, without mentors, the course instructors)
- An **Expert** has one or more **Expert Roles** and zero or more **Expert Notes**; each note belongs to no organization (central admins) or exactly one
- An **Org Admin** sees only the **Experts** of their organization's courses, and only their organization's **Expert Notes**
- An **Assistant** conversation belongs to one person and acts with that person's rights only; a **Proposed Change** belongs to one **Course** and is applied by one of its **Organizers**

## Example dialogue

> **Dev:** "Someone cancelled on a full paid event and nobody is waiting — does the place go to the next person who registers?"
> **Domain expert:** "Yes. Only when people are waiting does a free place belong to the **Waitlist**; then the organizer **moves someone up** with an **Invitation**, and the place is held until they pay or the deadline passes."

## Flagged ambiguities

- "Expertendatenbank" was the admin page of instructors and speakers. Resolved: it is the **Expert Directory**, and mentors of projects and achievement options are **Experts** too.
- "Invite" meant both the application decision (green rating) and moving someone up from the waitlist. Both are an **Invitation**: the same held place with a deadline; how it is accepted depends on the course (confirm or pay).
- "Attendance" meant both a raw Zoom/LimeSurvey entry and a Participant's result for a Session. Resolved: the entry is an **Attendance Record**, the result an **Attendance**.
- "Session reminder" meant three emails (24h, 1h, 15min) before sessions. Resolved: one email, before the First Session only, at the Course's Reminder Lead Time.
- "Project owner" meant both the person who started a project and the team running it, and a **Project Copy** treated the template's creator as its starter. Resolved: the **Project Proposer** is whoever started that project (for a copy, the team member who took on the template), and the **Project Team** decides on **Join Requests**.
- "Event confirmation mail" was asked for as a separate template from the course one. Resolved: there is one **Registration Confirmation**; a Course with a single Session simply reads like an event invitation because it has one date.
- "Chatbot" was used for the in-app AI help, and "instructors" for those who may change courses through it. Resolved: it is the **Assistant**, and course changes through it are for **Organizers** (and **Admins**), within the rights they already have.
