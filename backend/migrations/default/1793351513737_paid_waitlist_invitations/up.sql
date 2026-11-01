-- Waitlist promotion on paid courses.
--
-- An organizer moves someone up from the waitlist of a paid course by inviting
-- them: the place is held (INVITED counts towards capacity) until the
-- invitation deadline, and the invitation is accepted by paying, through the
-- normal checkout. Unpaid invitations expire like any other
-- (expire_invitations).
--
-- 1. The participant guard no longer lets a participant accept an invitation
--    to a paid course themselves (INVITED -> CONFIRMED): that is the Stripe
--    webhook's, with the admin secret, once the payment went through.
-- 2. Mail templates:
--    - WAITLIST_PROMOTED_PAYMENT: the invitation, asking to pay by the deadline;
--    - INVITATION_EXPIRING_SOON_PAYMENT: its reminder on the last day;
--    - INVITATION_DECLINED_ORGANIZER: to the organizers when a participant
--      declines an invitation, so they can invite the next person.

-- Unchanged from 1793321583626 except for accepting an invitation.
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

      -- On a paid course an invitation is accepted by paying: the Stripe
      -- webhook confirms it, never the participant.
      IF OLD.status = 'INVITED' AND NEW.status = 'CONFIRMED'
         AND OLD."invitationExpirationDate" >= berlin_today
         AND NOT EXISTS (
           SELECT 1 FROM "public"."Course"
           WHERE id = NEW."courseId"
             AND "registrationType" IN ('DIRECT_CONFIRMATION_AND_PAYMENT', 'DIRECT_WITH_INPUT_AND_PAYMENT')
         ) THEN
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
  ('WAITLIST_PROMOTED_PAYMENT', 'Sent when a waitlisted user of a paid course is invited to take a place by paying before the deadline'),
  ('INVITATION_EXPIRING_SOON_PAYMENT', 'Reminder on the last day of an invitation to a paid course that has not been paid yet'),
  ('INVITATION_DECLINED_ORGANIZER', 'Sent to the organizers when a participant declines their invitation')
ON CONFLICT ("value") DO NOTHING;

INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'WAITLIST_PROMOTED_PAYMENT', NULL,
  'Ein Platz ist frei geworden / A spot has opened up - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>gute Nachrichten! Für <strong>[Enrollment:CourseId--Course:Name]</strong> ist ein Platz frei geworden, und du bist eingeladen. Wir halten ihn bis zum <strong>[Enrollment:ExpirationDate]</strong> für dich frei.</p>
  <p>Um den Platz zu sichern, schließe bitte bis dahin die Anmeldung mit der Bezahlung ab: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Falls du nicht teilnehmen kannst, lehne den Platz bitte dort ab, damit er an die nächste Person auf der Warteliste gehen kann.</p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Good news! A spot has opened up for <strong>[Enrollment:CourseId--Course:Name]</strong>, and you are invited. We are holding it for you until <strong>[Enrollment:ExpirationDate]</strong>.</p>
  <p>To secure your spot, please complete your registration with payment by then: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>If you cannot attend, please decline the spot there so it can go to the next person on the waitlist.</p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'WAITLIST_PROMOTED_PAYMENT' AND "courseId" IS NULL);

INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'INVITATION_EXPIRING_SOON_PAYMENT', NULL,
  'Dein Platz ist nur noch heute reserviert / Your spot is held until today only - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>dein Platz bei <strong>[Enrollment:CourseId--Course:Name]</strong> ist nur noch heute ([Enrollment:ExpirationDate]) für dich reserviert. Bitte schließe die Bezahlung jetzt ab, um ihn zu sichern: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Danach geht der Platz an die nächste Person auf der Warteliste.</p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>your spot for <strong>[Enrollment:CourseId--Course:Name]</strong> is held for you until today ([Enrollment:ExpirationDate]) only. Please complete the payment now to secure it: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>After that, the spot goes to the next person on the waitlist.</p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'INVITATION_EXPIRING_SOON_PAYMENT' AND "courseId" IS NULL);

INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'INVITATION_DECLINED_ORGANIZER', NULL,
  'Einladung abgelehnt / Invitation declined - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName],</p>
  <p><strong>[Cancellation:ParticipantName]</strong> ([Cancellation:ParticipantEmail]) hat die Einladung zu <strong>[Enrollment:CourseId--Course:Name]</strong> abgelehnt. Der Platz ist wieder frei – Du kannst jetzt die nächste Person von der Warteliste einladen.</p>
  <p>Zur Übersicht der Anmeldungen: <a href="[Cancellation:ManageLink]">[Cancellation:ManageLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName],</p>
  <p><strong>[Cancellation:ParticipantName]</strong> ([Cancellation:ParticipantEmail]) has declined the invitation to <strong>[Enrollment:CourseId--Course:Name]</strong>. The spot is free again – you can now invite the next person from the waitlist.</p>
  <p>Registrations overview: <a href="[Cancellation:ManageLink]">[Cancellation:ManageLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'INVITATION_DECLINED_ORGANIZER' AND "courseId" IS NULL);
