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

**Overbooking**:
More places held than the course has. Only organizers can overbook, and are warned before they do; people registering themselves never can.

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

## Relationships

- A **Course** has a number of **Places** and at most one **Registration** per person
- A **Waitlist** belongs to one **Course**; **Moving up** takes someone off it
- An **Invitation** holds one **Place** until it is accepted, declined or expires

## Example dialogue

> **Dev:** "Someone cancelled on a full paid event and nobody is waiting — does the place go to the next person who registers?"
> **Domain expert:** "Yes. Only when people are waiting does a free place belong to the **Waitlist**; then the organizer **moves someone up** with an **Invitation**, and the place is held until they pay or the deadline passes."

## Flagged ambiguities

- "Invite" meant both the application decision (green rating) and moving someone up from the waitlist. Both are an **Invitation**: the same held place with a deadline; how it is accepted depends on the course (confirm or pay).
