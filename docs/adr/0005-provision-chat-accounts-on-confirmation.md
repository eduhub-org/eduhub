# ADR 0005: Provision Chat Accounts when a Registration is confirmed

## Status
Accepted (2026-11-12)

## Context

A Chat Account (see `CONTEXT.md`) used to come into existence only on the
person's first login to the chat: the login service (MAS) took the Chat Handle
from Keycloak and only then did the Matrix homeserver create the user. Until
then, nobody could invite the person to a Course Chat ("this person does not
exist"), so entering a Course Chat depended on the participant finding and
clicking the "Zum Chat" link, logging in with the right account and not
creating a matrix.org account in a mobile app instead.

Alternatives considered:

- **Link only.** Keep "Zum Chat" as the only way in. Simple, but the room never
  appears in the participant's chat app by itself, and app users who do not
  open EduHub never find it.
- **Create a Chat Account for every EduHub account.** About 25,000 accounts,
  including spam sign-ups and job-board employers who never take part in a
  course.
- **Create the Chat Account on the first confirmed Registration in a Course
  that has a Course Chat**, then invite. Chosen.

## Decision

When a Registration becomes confirmed in a Course that has a Course Chat,
EduHub (Hasura event, serverless function):

1. creates the Chat Account through the MAS admin API if it does not exist
   yet, with the person's Chat Handle, and links it to their Keycloak account,
   so their first login lands in that account;
2. invites the Chat Account to the Course Chat.

The "Zum Chat" link stays as the second way in. Nobody is removed from a
Course Chat automatically.

## Consequences

- EduHub needs a MAS admin client (secret in Google Secret Manager) in
  addition to the Matrix bot token.
- Chat Accounts exist for people who have never logged into the chat. They
  show up in the chat's user directory before their first login.
- A Chat Handle must exist before confirmation. The Keycloak listener
  therefore assigns it on every path an account can be created or used, and
  MAS rejects logins without one (`claims_imports.localpart.action: require`,
  `on_conflict: add`).
- Rooms of earlier semesters are not touched; the current semester is synced
  once with the existing join script.
