-- Instructor payment data lives in dedicated tables (not on Course / CourseInstructor) because
-- instructor_access may select every Course and CourseInstructor row; these tables are filtered
-- to the caller's own courses so instructors of other courses never see the amounts.

CREATE TABLE "public"."CourseInstructorPayment" (
  "id"          serial      NOT NULL,
  "courseId"    integer     NOT NULL,
  "totalAmount" integer     NOT NULL,
  "lockedAt"    timestamptz,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "CourseInstructorPayment_courseId_key" UNIQUE ("courseId"),
  CONSTRAINT "CourseInstructorPayment_totalAmount_check" CHECK ("totalAmount" >= 0)
);

COMMENT ON TABLE "public"."CourseInstructorPayment" IS E'Flat fee the organization pays for a course, shared by all its instructors. Only visible to instructors of that course and (org) admins.';
COMMENT ON COLUMN "public"."CourseInstructorPayment"."totalAmount" IS E'Total instructor fee for the course in cents (e.g. 50000 = €500.00).';
COMMENT ON COLUMN "public"."CourseInstructorPayment"."lockedAt" IS E'Set when the first instructor generates an invoice; afterwards the split can no longer be changed by instructors. Admins reset it to NULL to unlock.';

ALTER TABLE "public"."CourseInstructorPayment"
  ADD CONSTRAINT "CourseInstructorPayment_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id")
  ON UPDATE RESTRICT ON DELETE CASCADE;

CREATE TRIGGER "set_public_CourseInstructorPayment_updated_at"
BEFORE UPDATE ON "public"."CourseInstructorPayment"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

CREATE TABLE "public"."CourseInstructorPaymentShare" (
  "id"                 serial      NOT NULL,
  "courseInstructorId" integer     NOT NULL,
  "amount"             integer     NOT NULL,
  "invoiceURL"         text,
  "created_at"         timestamptz NOT NULL DEFAULT now(),
  "updated_at"         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "CourseInstructorPaymentShare_courseInstructorId_key" UNIQUE ("courseInstructorId"),
  CONSTRAINT "CourseInstructorPaymentShare_amount_check" CHECK ("amount" >= 0)
);

COMMENT ON TABLE "public"."CourseInstructorPaymentShare" IS E'An instructor''s share of the course fee. A missing row means the instructors have not entered an amount yet (there is deliberately no default).';
COMMENT ON COLUMN "public"."CourseInstructorPaymentShare"."amount" IS E'Share of the course fee in cents.';
COMMENT ON COLUMN "public"."CourseInstructorPaymentShare"."invoiceURL" IS E'Bucket path of the instructor''s most recently generated invoice PDF.';

ALTER TABLE "public"."CourseInstructorPaymentShare"
  ADD CONSTRAINT "CourseInstructorPaymentShare_courseInstructorId_fkey"
  FOREIGN KEY ("courseInstructorId") REFERENCES "public"."CourseInstructor"("id")
  ON UPDATE RESTRICT ON DELETE CASCADE;

CREATE TRIGGER "set_public_CourseInstructorPaymentShare_updated_at"
BEFORE UPDATE ON "public"."CourseInstructorPaymentShare"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

-- Guards the split independently of the UI: no changes once locked (except by admin), and the
-- shares of a course may never add up to more than its total.
CREATE OR REPLACE FUNCTION "public"."course_instructor_payment_share_guard"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  caller_role text;
  course_id integer;
  payment record;
  other_shares bigint;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW."amount" IS NOT DISTINCT FROM OLD."amount" THEN
    RETURN NEW;
  END IF;

  caller_role := NULLIF(current_setting('hasura.user', true), '')::json ->> 'x-hasura-role';

  SELECT "courseId" INTO course_id
  FROM "public"."CourseInstructor" WHERE "id" = NEW."courseInstructorId";

  -- Serialize concurrent edits of the same course's split.
  PERFORM pg_advisory_xact_lock(hashtext('CourseInstructorPaymentShare'), course_id);

  SELECT "totalAmount", "lockedAt" INTO payment
  FROM "public"."CourseInstructorPayment" WHERE "courseId" = course_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No instructor payment is set for course %', course_id
      USING ERRCODE = 'check_violation', HINT = 'no_payment_total';
  END IF;

  -- Only an explicit admin role may change a locked split (the invoice function writes as admin).
  IF payment."lockedAt" IS NOT NULL AND (caller_role IS NULL OR caller_role <> 'admin') THEN
    RAISE EXCEPTION 'The instructor payment split of course % is locked', course_id
      USING ERRCODE = 'check_violation', HINT = 'payment_split_locked';
  END IF;

  SELECT COALESCE(SUM(s."amount"), 0) INTO other_shares
  FROM "public"."CourseInstructorPaymentShare" s
  JOIN "public"."CourseInstructor" ci ON ci."id" = s."courseInstructorId"
  WHERE ci."courseId" = course_id AND s."id" IS DISTINCT FROM NEW."id";

  -- An admin may lower the total below the current shares; decreasing a share must then still
  -- be possible, so only an insert or an increase is rejected for exceeding the total.
  IF other_shares + NEW."amount" > payment."totalAmount"
     AND (TG_OP = 'INSERT' OR NEW."amount" > OLD."amount") THEN
    RAISE EXCEPTION 'Instructor shares of course % would exceed the total', course_id
      USING ERRCODE = 'check_violation', HINT = 'payment_split_exceeds_total';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "course_instructor_payment_share_guard_trg"
BEFORE INSERT OR UPDATE ON "public"."CourseInstructorPaymentShare"
FOR EACH ROW
EXECUTE PROCEDURE "public"."course_instructor_payment_share_guard"();

-- Unlocking a split invalidates the invoices generated from it: their references are cleared so
-- nobody keeps working with an invoice whose amount may change. Regenerating overwrites the file.
CREATE OR REPLACE FUNCTION "public"."course_instructor_payment_unlock_invoices"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD."lockedAt" IS NOT NULL AND NEW."lockedAt" IS NULL THEN
    UPDATE "public"."CourseInstructorPaymentShare" s
    SET "invoiceURL" = NULL
    FROM "public"."CourseInstructor" ci
    WHERE ci."id" = s."courseInstructorId" AND ci."courseId" = NEW."courseId";
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "course_instructor_payment_unlock_invoices_trg"
AFTER UPDATE OF "lockedAt" ON "public"."CourseInstructorPayment"
FOR EACH ROW
EXECUTE PROCEDURE "public"."course_instructor_payment_unlock_invoices"();
