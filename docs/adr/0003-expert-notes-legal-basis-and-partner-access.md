# ADR 0003: Expert notes rely on legitimate interest; partner organizations only see their own experts

## Status
Accepted

## Context

The Expert Directory (`docs/EXPERT_DIRECTORY.md`) adds **Expert Notes** and a
**Do Not Contact** mark, and opens the directory to org admins. Org admins act
for partner organizations, which are controllers of their own. We had to decide
whether notes need the expert's consent, how experts are told about them, and
how far partner organizations may see into the directory.

## Decision

1. **Legal basis for notes: legitimate interest** (Art. 6 para. 1 lit. f GDPR),
   our interest being to find and contact suitable people for future courses
   and events. No consent is asked for.
2. **Do Not Contact instead of a consent flag.** An expert who objects
   (Art. 21 GDPR) is marked, greyed out, loses the contact buttons and is left
   out of exports. Admins and the org admins of the expert's courses can set
   the mark; only admins can remove it.
3. **Notes are written as if the expert reads them** (they can ask, Art. 15):
   facts and availability, no judgements, no special categories of data.
4. **Notes stay inside the organization that wrote them.** Notes from central
   admins are seen by admins only; an org admin's notes are seen by that
   organization's admins and by central admins. We never pass our notes to a
   partner organization.
5. **Org admins only see experts of their own organization's courses.** They
   already work with these people, so nothing new is disclosed to them.
6. **Seeing all experts would need an opt-in** ("partner organizations may
   contact me") and naming partner organizations as recipients in the privacy
   policy. Not planned.
7. **Informing experts:** the privacy policy gets a section on the directory,
   but only its "Stand" date changes. The one-time in-app notice is deferred to
   the next material policy update and recorded under "Pending for the next
   notice" in `docs/LEGAL_DOCUMENTS.md`. An email to everyone was judged out of
   proportion for internal notes about a small group.

## Consequences

- The privacy policy section must stay in sync with what the directory stores
  and who sees it.
- Whoever writes the next privacy notice must include the pending expert item.
- Erasure and access requests must cover `ExpertNote` rows; admins can delete
  any note for that reason.
- Opening the directory further for partners is a new decision, not a
  permission tweak.
