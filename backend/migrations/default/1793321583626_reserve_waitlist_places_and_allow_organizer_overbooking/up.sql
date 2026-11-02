-- Waitlist first, and organizers may overbook.
--
-- 1. A place that frees up on a full course goes to the waitlist, not to
--    whoever registers next: the organizer moves someone up from the
--    applications tab. A course therefore stays closed to new registrations
--    until it has more free places than people waiting. course_waitlist_count
--    exposes the waiting side to the course page and the guest functions; the
--    participant guard below counts it as taken.
--
-- 2. Capacity binds participants registering themselves, not organizers.
--    course_enrollment_guard_invitation_capacity refused every invitation on a
--    full course, admins included, but only organizers can invite (the
--    participant guard refuses INVITED to everyone else), so it only ever kept
--    an organizer from deliberately taking one more person. The UI warns before
--    an action overbooks the course instead; "send by rating" still stops at
--    the free places.
--
-- 3. Mail: WAITLIST_CONFIRMED tells someone moved up on a direct course that
--    they have the place. WAITLIST_PROMOTED (moved up as an invitation) now
--    names the deadline for accepting.

CREATE OR REPLACE FUNCTION "public"."course_waitlist_count"(course_row "public"."Course")
RETURNS bigint
LANGUAGE sql
STABLE
AS $function$
  SELECT COUNT(*)
  FROM "public"."CourseEnrollment"
  WHERE "courseId" = course_row.id
    AND status = 'WAITLIST'
    AND NOT "isTest";
$function$;

COMMENT ON FUNCTION "public"."course_waitlist_count"("public"."Course") IS
  E'People on the waitlist of a course (preview enrollments excluded). Free places are reserved for them: new registrations need maxParticipants > active participants + this count.';

DROP TRIGGER IF EXISTS "course_enrollment_guard_invitation_capacity" ON "public"."CourseEnrollment";
DROP FUNCTION IF EXISTS "public"."course_enrollment_guard_invitation_capacity"();

-- Unchanged from 1790709784475 except for the capacity count of a direct
-- registration, which now includes the waitlist.
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
      -- Places held (as course_active_participant_count) plus the places
      -- reserved for the waitlist (as course_waitlist_count): a free place goes
      -- to the waitlist first, through the organizer. This row is in neither
      -- count, being new or CANCELLED.
      SELECT COUNT(*) INTO active_count
        FROM "public"."CourseEnrollment"
        WHERE "courseId" = NEW."courseId"
          AND status IN ('CONFIRMED', 'INVITED', 'REGISTERED', 'WAITLIST')
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

INSERT INTO "public"."MailTemplateType" ("value", "comment") VALUES
  ('WAITLIST_CONFIRMED', 'Sent when a waitlisted user of a direct-registration course is given a place by the organizer')
ON CONFLICT ("value") DO NOTHING;

INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'WAITLIST_CONFIRMED', NULL,
  'Du bist dabei / You''re in - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>gute Nachrichten! Für <strong>[Enrollment:CourseId--Course:Name]</strong> ist ein Platz frei geworden und du bist von der Warteliste nachgerückt. Deine Teilnahme ist bestätigt – du musst nichts weiter tun.</p>
  <p>Alle Infos zur Veranstaltung findest du hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Falls du doch nicht teilnehmen kannst, melde dich bitte dort wieder ab, damit der Platz an die nächste Person gehen kann.</p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Good news! A spot has opened up for <strong>[Enrollment:CourseId--Course:Name]</strong> and you have been moved up from the waitlist. Your participation is confirmed – there is nothing else you need to do.</p>
  <p>You can find all details about the event here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>If you can no longer attend, please cancel your registration there so the spot can go to the next person.</p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'WAITLIST_CONFIRMED' AND "courseId" IS NULL);

-- Only the default template, and only where its wording is still the seeded
-- one: replace() leaves an edited text alone.
UPDATE "public"."MailTemplate"
SET content = replace(
      replace(content,
        '<p>Bitte bestätige deine Teilnahme hier:',
        '<p>Bitte bestätige deine Teilnahme bis zum [Enrollment:ExpirationDate] hier:'),
      '<p>Please confirm your participation here:',
      '<p>Please confirm your participation by [Enrollment:ExpirationDate] here:'),
    updated_at = NOW()
WHERE "type" = 'WAITLIST_PROMOTED' AND "courseId" IS NULL
  AND content LIKE '%<p>Bitte bestätige deine Teilnahme hier:%';
