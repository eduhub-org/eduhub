-- CourseEnrollment.termsAcceptedAt is the proof that a participant accepted the
-- terms (and was shown the privacy policy) before a paid registration. It was
-- written by the browser, so its value was the client's clock, and the roles
-- the participant guard lets through (instructor on their own course,
-- org_admin) could set it on somebody else's enrollment.
--
-- From now on the time is the server's, and only the participant records
-- their own acceptance:
--   - no session (migrations, direct DB) and the admin secret (serverless
--     functions such as confirmGuestRegistration) keep the value they send;
--   - a signed-in caller - whatever their role - may only set it on their own
--     enrollment, and the value becomes now().
-- Clearing and overwriting stay the participant guard's business
-- (course_enrollment_guard_participant_changes); this trigger only fires when a
-- non-null value is written.
CREATE OR REPLACE FUNCTION "public"."course_enrollment_stamp_terms_acceptance"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  session json;
  caller_role text;
  caller_id text;
BEGIN
  IF NEW."termsAcceptedAt" IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW."termsAcceptedAt" IS NOT DISTINCT FROM OLD."termsAcceptedAt" THEN
    RETURN NEW;
  END IF;

  session := NULLIF(current_setting('hasura.user', true), '')::json;
  caller_role := session ->> 'x-hasura-role';
  caller_id := lower(session ->> 'x-hasura-user-id');

  IF caller_role IS NULL OR (caller_role = 'admin' AND caller_id IS NULL) THEN
    RETURN NEW;
  END IF;

  IF caller_id IS NULL OR NEW."userId"::text IS DISTINCT FROM caller_id THEN
    RAISE EXCEPTION 'Terms can only be accepted by the participant themselves'
      USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
  END IF;

  -- An upsert (REGISTER_OWN_ENROLLMENT) runs this INSERT branch on the proposed
  -- row before Postgres finds the conflict. Leave the value alone then: the
  -- conflict UPDATE fires this trigger again, keeps it when it equals the
  -- stored acceptance and stamps it when it is new.
  IF TG_OP = 'INSERT' AND EXISTS (
    SELECT 1 FROM "public"."CourseEnrollment"
    WHERE "userId" = NEW."userId" AND "courseId" = NEW."courseId"
  ) THEN
    RETURN NEW;
  END IF;

  NEW."termsAcceptedAt" := now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION "public"."course_enrollment_stamp_terms_acceptance"() IS
  E'Sets CourseEnrollment.termsAcceptedAt to the server time and only lets participants record their own acceptance.';

CREATE TRIGGER "course_enrollment_stamp_terms_acceptance"
BEFORE INSERT OR UPDATE OF "termsAcceptedAt" ON "public"."CourseEnrollment"
FOR EACH ROW
EXECUTE PROCEDURE "public"."course_enrollment_stamp_terms_acceptance"();
