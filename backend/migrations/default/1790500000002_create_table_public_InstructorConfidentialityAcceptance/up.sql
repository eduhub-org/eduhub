-- One row per instructor and version of the confidentiality commitment.
--
-- Instructors can read participant data well beyond their own courses (they
-- need the user search to add speakers, co-instructors and participants), so
-- before they work with it on the manage-course page they commit to keeping it
-- confidential (GDPR Art. 29, 32(4)). This table is the record of that.
--
-- Append-only: rows are inserted through the instructor role with userId preset
-- from the session and created_at from the database clock, so neither the
-- person nor the time can be supplied by the client. A new text version asks
-- everyone again, which is why version is part of the unique key.
CREATE TABLE "public"."InstructorConfidentialityAcceptance" (
  "id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
  "userId"     uuid        NOT NULL,
  "version"    text        NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "InstructorConfidentialityAcceptance_userId_version_key" UNIQUE ("userId", "version"),
  CONSTRAINT "InstructorConfidentialityAcceptance_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."User" ("id")
    ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE "public"."InstructorConfidentialityAcceptance" IS
  E'Record of instructors accepting the confidentiality commitment for participant data, one row per text version.';
