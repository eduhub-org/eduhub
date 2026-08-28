-- Restoring table-wide email uniqueness is only possible if no address is held
-- by both a guest record and an account -- the very pairing the partial index
-- was introduced to allow. ALTER TABLE would otherwise fail with a duplicate-key
-- error naming one address at a time, which is a poor way to discover there are
-- fifty. Report them all at once and stop.
DO $$
DECLARE
  collisions bigint;
  sample text;
BEGIN
  SELECT count(*), min("email") INTO collisions, sample
  FROM (
    SELECT "email" FROM "public"."User" GROUP BY "email" HAVING count(*) > 1
  ) AS duplicated;

  IF collisions > 0 THEN
    RAISE EXCEPTION
      'Cannot restore table-wide email uniqueness: % address(es) are held by more '
      'than one User row (for example %). Anonymize the guest record for each '
      'before rolling back.',
      collisions, sample;
  END IF;
END
$$;

DROP INDEX "public"."User_email_non_guest_key";

ALTER TABLE "public"."User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
