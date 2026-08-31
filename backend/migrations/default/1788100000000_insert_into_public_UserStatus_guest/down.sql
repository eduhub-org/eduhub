-- User.status carries "User_status_fkey" with ON DELETE RESTRICT, so removing
-- the lookup row while guest records exist fails with a bare foreign-key error
-- that says nothing about what to do. Refuse explicitly instead: rolling this
-- back is only safe once no User holds the status, and how those records should
-- be disposed of (anonymize, delete, convert) is a decision this migration must
-- not make on someone's behalf.
DO $$
DECLARE
  guest_count bigint;
BEGIN
  SELECT count(*) INTO guest_count FROM "public"."User" WHERE "status" = 'GUEST';
  IF guest_count > 0 THEN
    RAISE EXCEPTION
      'Cannot remove the GUEST user status: % User row(s) still hold it. '
      'Anonymize or delete those guest records first (see docs/GUEST_REGISTRATION.md).',
      guest_count;
  END IF;
END
$$;

DELETE FROM "public"."UserStatus" WHERE "value" = 'GUEST';
