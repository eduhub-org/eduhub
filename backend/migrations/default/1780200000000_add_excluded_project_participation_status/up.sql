INSERT INTO "public"."ProjectParticipationStatus" ("value", "comment")
VALUES (
  E'EXCLUDED',
  E'User was a confirmed (ACCEPTED) implementing author but the submitting author marked them as not having contributed to the final submission. Excluded authors are hidden from the public/peer author list (still visible to instructors and admins) and no longer count as an active ACCEPTED author of the project.'
);
