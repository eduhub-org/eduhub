# ADR 0006: Course setup through an EduHub MCP server with propose and apply

## Status
Accepted

## Context

The **Assistant** lets **Organizers** set up a course: its texts, its settings
and its Sessions. Organizers also want to do this from their own assistants
(Claude, ChatGPT, Le Chat, …) later. Hasura's GraphQL API already enforces
permissions, but it is too low-level for an LLM and knows none of the
course-setup rules.

## Decision

1. **The course-setup operations are an EduHub MCP server**, not tools private
   to the Assistant. The Assistant is its first client; in v2 external clients
   connect with OAuth through Keycloak and act as that Organizer under Hasura's
   normal permissions.
2. **Changes are two steps in the API itself.** An operation returns a
   **Proposed Change** (before and after); only an explicit apply saves it, and
   the apply checks the rules again. So no client, ours or an external one, can
   save a change in one step.
3. **v1 operations:** course texts (German and English, also drafted from
   pasted notes), course settings, and Sessions. **Sessions can only be
   changed while the Course has no Participants**; after that, organizers
   change them by hand and send the Session Change Notification themselves.
   Actions on people (moving up, invitations, attendance) and emails are out of
   scope.

## Consequences

- A thin layer sits between clients and Hasura; it must not grant more than the
  caller's Hasura role, so it calls Hasura with the caller's token, never as admin.
- Opening it to external clients means data leaves our EU setup through the
  Organizer's chosen LLM; that is the Organizer's decision and needs a privacy
  note and Keycloak OAuth client registration (v2).
