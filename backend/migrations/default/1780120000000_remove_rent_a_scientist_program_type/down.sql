INSERT INTO "public"."ProgramType"("comment", "value")
VALUES (
  E'A program that connects scientists with school classes',
  E'RENT_A_SCIENTIST'
)
ON CONFLICT ("value") DO NOTHING;
