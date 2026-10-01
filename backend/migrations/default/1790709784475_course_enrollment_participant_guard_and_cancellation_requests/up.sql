-- A participant of a paid course cannot cancel on their own (refunds are the
-- organizer's call), so they ask instead: the request is recorded here, the
-- send_cancellation_request_email event trigger mails the organizers and a
-- confirmation to the participant, and the organizer then cancels in the
-- applications tab and refunds in Stripe. The status stays untouched until then.
ALTER TABLE "public"."CourseEnrollment"
  ADD COLUMN "cancellationRequestedAt" timestamptz NULL,
  ADD COLUMN "cancellationRequestReason" text NULL;
COMMENT ON COLUMN "public"."CourseEnrollment"."cancellationRequestedAt" IS
  E'When the participant asked the organizer to cancel this paid enrollment. Set once, server time; cleared when they register again.';
COMMENT ON COLUMN "public"."CourseEnrollment"."cancellationRequestReason" IS
  E'Optional reason the participant gave with their cancellation request.';

-- Participants may only move their own enrollment along the paths the UI
-- offers them. The user_access insert/update permissions cannot say this on
-- their own: they list `status` as a free column (the instructor "add
-- participants" flow inserts for other users through user_access, see the note
-- in public_CourseEnrollment.yaml), and a Hasura `check` sees only the new row,
-- never the transition. Without this guard any logged-in user could, via the
-- API, confirm themselves on an approval course, undo a rejection, skip a
-- payment, extend an invitation or enroll somebody else.
--
-- Who is guarded is decided by the Hasura session (`hasura.user`, the same
-- mechanism as organization_admin_keep_last_settings_admin):
--   - no session (migrations, direct DB) and `admin` (admin secret: Stripe
--     webhook, serverless functions, super-admins) are exempt;
--   - `org_admin` is exempt - its own permissions already scope it to the
--     courses of the organizations it manages;
--   - `instructor` is exempt on a course they instruct (management UI), except
--     that a motivation letter stays its author's;
--   - everyone else - `user`, and an instructor acting as a participant on
--     somebody else's course - gets the participant rules below.
--
-- Participant rules (mirrors the course page and participationExit.ts):
--   entering  (insert, or re-registering after a CANCELLED):
--     registration must still be open (applicationEnd, Europe/Berlin day, as
--     isRegistrationClosed); WAITLIST always; CONFIRMED on a direct course with
--     a free place; APPLIED on an approval course. Paid courses enter through
--     the createEnrollmentWithAddons action and are confirmed by Stripe.
--   leaving   APPLIED/WAITLIST/INVITED/CONFIRMED/REGISTERED -> CANCELLED or
--             ABORTED, unless an invoice for the enrollment is PAID.
--   accepting INVITED -> CONFIRMED while the invitation has not expired.
--   requesting a cancellation: on a PAID enrollment still held, once - the
--             time is stamped here (never the client's), the reason trimmed
--             to 2000 characters, the status left for the organizer.
-- Rating and invitation deadline are the organizer's; a participant may only
-- clear the deadline (accepting/declining sends it as NULL). The motivation
-- letter and terms acceptance change only on entry, or terms from NULL once.
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

CREATE TRIGGER "course_enrollment_guard_participant_changes"
BEFORE INSERT OR UPDATE ON "public"."CourseEnrollment"
FOR EACH ROW
EXECUTE PROCEDURE "public"."course_enrollment_guard_participant_changes"();

-- Mail templates for the cancellation request: one to every organizer of the
-- course and every admin of its organization who manages that program type,
-- one confirmation to the participant. Sent by sendCancellationRequestEmail.
INSERT INTO "public"."MailTemplateType" ("value", "comment") VALUES
  ('CANCELLATION_REQUEST_ORGANIZER', 'Sent to the organizers when a participant of a paid course asks to cancel'),
  ('CANCELLATION_REQUEST_CONFIRMATION', 'Sent to a participant of a paid course confirming their cancellation request')
ON CONFLICT ("value") DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "public"."MailTemplate"
    WHERE "type" = 'CANCELLATION_REQUEST_ORGANIZER' AND "courseId" IS NULL
  ) THEN
    INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "cc", "bcc", "created_at", "updated_at")
    VALUES (
      'CANCELLATION_REQUEST_ORGANIZER',
      NULL,
      'Stornierungsanfrage / Cancellation request - [Enrollment:CourseId--Course:Name]',
      '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName],</p>
  <p><strong>[Cancellation:ParticipantName]</strong> ([Cancellation:ParticipantEmail]) möchte die bezahlte Anmeldung für <strong>[Enrollment:CourseId--Course:Name]</strong> stornieren (angefragt am [Cancellation:RequestedAt]).</p>
  [Cancellation:Reason]
  <p>Die Anmeldung bleibt bestehen, bis Du entscheidest. Wenn Du der Stornierung zustimmst, setze die Anmeldung in der Bewerbungsübersicht auf „storniert“ und veranlasse eine eventuelle Erstattung in Stripe. Andernfalls antworte bitte direkt an die Teilnehmerin bzw. den Teilnehmer.</p>
  <p>Zur Bewerbungsübersicht: <a href="[Cancellation:ManageLink]">[Cancellation:ManageLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>

  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />

  <!-- English -->
  <p>Hello [User:FirstName],</p>
  <p><strong>[Cancellation:ParticipantName]</strong> ([Cancellation:ParticipantEmail]) would like to cancel their paid registration for <strong>[Enrollment:CourseId--Course:Name]</strong> (requested on [Cancellation:RequestedAt]).</p>
  <p>The registration stays in place until you decide. If you agree, set it to "cancelled" in the applications overview and issue any refund in Stripe. Otherwise, please reply to the participant directly.</p>
  <p>Applications overview: <a href="[Cancellation:ManageLink]">[Cancellation:ManageLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
      'noreply@opencampus.sh',
      NULL,
      NULL,
      NOW(),
      NOW()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "public"."MailTemplate"
    WHERE "type" = 'CANCELLATION_REQUEST_CONFIRMATION' AND "courseId" IS NULL
  ) THEN
    INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "cc", "bcc", "created_at", "updated_at")
    VALUES (
      'CANCELLATION_REQUEST_CONFIRMATION',
      NULL,
      'Deine Stornierungsanfrage / Your cancellation request - [Enrollment:CourseId--Course:Name]',
      '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName],</p>
  <p>wir haben Deine Anfrage erhalten, Deine Anmeldung für <strong>[Enrollment:CourseId--Course:Name]</strong> zu stornieren, und sie an die Veranstalter weitergeleitet.</p>
  [Cancellation:Reason]
  <p>Da Du bereits bezahlt hast, entscheiden die Veranstalter über die Stornierung und eine mögliche Erstattung. Bis dahin bleibt Deine Anmeldung bestehen. Du bekommst eine E-Mail, sobald Deine Anmeldung storniert wurde.</p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>

  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />

  <!-- English -->
  <p>Hello [User:FirstName],</p>
  <p>we have received your request to cancel your registration for <strong>[Enrollment:CourseId--Course:Name]</strong> and forwarded it to the organizers.</p>
  <p>As you have already paid, the organizers decide on the cancellation and any refund. Until then, your registration stays in place. You will receive an email once your registration has been cancelled.</p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
      'noreply@opencampus.sh',
      NULL,
      NULL,
      NOW(),
      NOW()
    );
  END IF;
END $$;
