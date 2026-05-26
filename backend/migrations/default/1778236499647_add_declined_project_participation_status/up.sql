INSERT INTO "public"."ProjectParticipationStatus" ("value", "comment")
VALUES (
  E'DECLINED',
  E'User requested to join as implementing author but was declined; the same user cannot apply again for this project (unique projectId + userId).'
);
