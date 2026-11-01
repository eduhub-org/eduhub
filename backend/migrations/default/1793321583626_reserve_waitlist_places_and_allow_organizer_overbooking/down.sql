UPDATE "public"."MailTemplate"
SET content = replace(
      replace(content,
        '<p>Bitte bestätige deine Teilnahme bis zum [Enrollment:ExpirationDate] hier:',
        '<p>Bitte bestätige deine Teilnahme hier:'),
      '<p>Please confirm your participation by [Enrollment:ExpirationDate] here:',
      '<p>Please confirm your participation here:'),
    updated_at = NOW()
WHERE "type" = 'WAITLIST_PROMOTED' AND "courseId" IS NULL;

DELETE FROM "public"."MailTemplate" WHERE "type" = 'WAITLIST_CONFIRMED' AND "courseId" IS NULL;
DELETE FROM "public"."MailTemplateType"
WHERE "value" = 'WAITLIST_CONFIRMED'
AND NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" mt WHERE mt."type" = "MailTemplateType"."value");

-- Restore the guard of 1790709784475.
CREATE OR REPLACE FUNCTION "public"."course_enrollment_guard_participant_changes"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  session json;
  caller_role text;
  caller_id text;
  berlin_today date;
  course_row record;
  active_count bigint;
BEGIN
  session := NULLIF(current_setting('hasura.user', true), '')::json;
  caller_role := session ->> 'x-hasura-role';
  caller_id := lower(session ->> 'x-hasura-user-id');

  IF caller_role IS NULL OR caller_role IN ('admin', 'org_admin') THEN
    RETURN NEW;
  END IF;

  IF caller_role = 'instructor' AND EXISTS (
    SELECT 1 FROM "public"."CourseInstructor"
    WHERE "courseId" = NEW."courseId" AND "userId"::text = caller_id
  ) THEN
    IF TG_OP = 'UPDATE'
       AND NEW."motivationLetter" IS DISTINCT FROM OLD."motivationLetter"
       AND NEW."userId"::text IS DISTINCT FROM caller_id THEN
      RAISE EXCEPTION 'A motivation letter can only be changed by its author'
        USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
    END IF;
    RETURN NEW;
  END IF;

  IF caller_id IS NULL OR NEW."userId"::text IS DISTINCT FROM caller_id THEN
    RAISE EXCEPTION 'Participants can only change their own enrollment'
      USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
  END IF;

  berlin_today := (now() AT TIME ZONE 'Europe/Berlin')::date;

  IF TG_OP = 'INSERT' THEN
    IF NEW."motivationRating" IS DISTINCT FROM 'UNRATED' OR NEW."invitationExpirationDate" IS NOT NULL
       OR NEW."cancellationRequestedAt" IS NOT NULL OR NEW."cancellationRequestReason" IS NOT NULL THEN
      RAISE EXCEPTION 'Participants cannot set rating, invitation deadline or a cancellation request when registering'
        USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
    END IF;
  ELSE
    IF NEW."motivationRating" IS DISTINCT FROM OLD."motivationRating"
       OR (NEW."invitationExpirationDate" IS DISTINCT FROM OLD."invitationExpirationDate"
           AND NEW."invitationExpirationDate" IS NOT NULL) THEN
      RAISE EXCEPTION 'Participants cannot change rating or invitation deadline'
        USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
    END IF;

    -- Anything but a re-registration after a cancellation.
    IF NOT (OLD.status = 'CANCELLED' AND NEW.status IS DISTINCT FROM OLD.status) THEN
      IF NEW."motivationLetter" IS DISTINCT FROM OLD."motivationLetter"
         OR (OLD."termsAcceptedAt" IS NOT NULL
             AND NEW."termsAcceptedAt" IS DISTINCT FROM OLD."termsAcceptedAt") THEN
        RAISE EXCEPTION 'Participants cannot change motivation letter or terms acceptance here'
          USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
      END IF;

      IF NEW."cancellationRequestedAt" IS DISTINCT FROM OLD."cancellationRequestedAt"
         OR NEW."cancellationRequestReason" IS DISTINCT FROM OLD."cancellationRequestReason" THEN
        IF OLD."cancellationRequestedAt" IS NOT NULL
           OR NEW."cancellationRequestedAt" IS NULL
           OR NEW.status IS DISTINCT FROM OLD.status
           OR OLD.status NOT IN ('APPLIED', 'WAITLIST', 'INVITED', 'CONFIRMED', 'REGISTERED')
           OR NOT EXISTS (
             SELECT 1 FROM "public"."Invoice"
             WHERE "courseEnrollmentId" = OLD.id AND status = 'PAID'
           ) THEN
          RAISE EXCEPTION 'A cancellation can be requested once, for a paid enrollment'
            USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
        END IF;
        NEW."cancellationRequestedAt" := now();
        NEW."cancellationRequestReason" := NULLIF(left(btrim(NEW."cancellationRequestReason"), 2000), '');
      END IF;

      IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
      END IF;

      IF NEW.status IN ('CANCELLED', 'ABORTED')
         AND OLD.status IN ('APPLIED', 'WAITLIST', 'INVITED', 'CONFIRMED', 'REGISTERED') THEN
        IF EXISTS (
          SELECT 1 FROM "public"."Invoice"
          WHERE "courseEnrollmentId" = OLD.id AND status = 'PAID'
        ) THEN
          RAISE EXCEPTION 'A paid enrollment is cancelled through the organizer'
            USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
        END IF;
        RETURN NEW;
      END IF;

      IF OLD.status = 'INVITED' AND NEW.status = 'CONFIRMED'
         AND OLD."invitationExpirationDate" >= berlin_today THEN
        RETURN NEW;
      END IF;

      RAISE EXCEPTION 'Participants cannot change an enrollment from % to %', OLD.status, NEW.status
        USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
    END IF;
  END IF;

  -- Entering the course: a new registration or one after a cancellation. A
  -- request from the earlier participation does not carry over.
  IF TG_OP = 'UPDATE' THEN
    NEW."cancellationRequestedAt" := NULL;
    NEW."cancellationRequestReason" := NULL;
  END IF;

  SELECT "registrationType", "applicationEnd", "maxParticipants"
    INTO course_row
    FROM "public"."Course"
    WHERE id = NEW."courseId";

  IF course_row."applicationEnd" IS NULL OR course_row."applicationEnd" < berlin_today THEN
    RAISE EXCEPTION 'Registration for this course is closed'
      USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
  END IF;

  IF NEW.status = 'WAITLIST' THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'APPLIED' AND course_row."registrationType" = 'APPROVAL_WITH_INPUT' THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'CONFIRMED'
     AND course_row."registrationType" IN ('DIRECT_CONFIRMATION', 'DIRECT_WITH_INPUT') THEN
    IF course_row."maxParticipants" IS NOT NULL THEN
      -- Serialize registrations for the same course until commit, or two
      -- concurrent ones could both see the last free place. An advisory lock
      -- rather than FOR UPDATE on the Course row, so organizers editing the
      -- course are not blocked by it.
      PERFORM pg_advisory_xact_lock(hashtext('CourseEnrollmentCapacity'), NEW."courseId");
      -- Same count as course_active_participant_count; this row is not in it,
      -- being either new or CANCELLED.
      SELECT COUNT(*) INTO active_count
        FROM "public"."CourseEnrollment"
        WHERE "courseId" = NEW."courseId"
          AND status IN ('CONFIRMED', 'INVITED', 'REGISTERED')
          AND NOT "isTest";
      IF active_count >= course_row."maxParticipants" THEN
        RAISE EXCEPTION 'This course is full'
          USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Participants cannot register for this course with status %', NEW.status
    USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
END;
$$;

CREATE OR REPLACE FUNCTION "public"."course_enrollment_guard_invitation_capacity"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  max_participants integer;
  active_count bigint;
BEGIN
  IF NEW."isTest" OR (TG_OP = 'UPDATE' AND OLD.status IN ('CONFIRMED', 'INVITED', 'REGISTERED')) THEN
    RETURN NEW;
  END IF;

  SELECT "maxParticipants" INTO max_participants
    FROM "public"."Course"
    WHERE id = NEW."courseId";
  IF max_participants IS NULL THEN
    RETURN NEW;
  END IF;

  -- Same lock as the direct registration guard, so invitations and
  -- registrations for one course cannot both take the last place.
  PERFORM pg_advisory_xact_lock(hashtext('CourseEnrollmentCapacity'), NEW."courseId");
  SELECT COUNT(*) INTO active_count
    FROM "public"."CourseEnrollment"
    WHERE "courseId" = NEW."courseId"
      AND status IN ('CONFIRMED', 'INVITED', 'REGISTERED')
      AND NOT "isTest";
  IF active_count >= max_participants THEN
    RAISE EXCEPTION 'This course is full'
      USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "course_enrollment_guard_invitation_capacity"
BEFORE INSERT OR UPDATE OF status ON "public"."CourseEnrollment"
FOR EACH ROW
WHEN (NEW.status = 'INVITED')
EXECUTE PROCEDURE "public"."course_enrollment_guard_invitation_capacity"();

DROP FUNCTION IF EXISTS "public"."course_waitlist_count"("public"."Course");
