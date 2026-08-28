-- Scope the email uniqueness to real accounts.
--
-- Guest registration can create a User row for an address that later gets a
-- Keycloak account. With a table-wide UNIQUE constraint, the insert that
-- updateFromKeycloak performs on that person's first login would violate it -
-- the error is swallowed there, so they would end up logged in with no Hasura
-- User row and a broken session. Re-pointing the guest row's id instead is not
-- possible: most foreign keys to User(id) are ON UPDATE RESTRICT.
--
-- A partial unique index keeps the real invariant (one account per address)
-- while letting a pre-existing guest record coexist with the account that
-- supersedes it. registerGuestForCourse already refuses to create a guest
-- record for an address that has an account, so this only ever admits the
-- guest-first ordering.
--
-- status is NOT NULL DEFAULT 'ACTIVE', so the predicate is never NULL and every
-- non-guest row is covered. Anonymized rows (status DELETED) carry a generated
-- anon_*@example.com address and so cannot collide either.
--
-- Merging a guest's past registrations into the account that claims the address
-- is deliberately out of scope here; it is tracked as issue #1337.
ALTER TABLE "public"."User" DROP CONSTRAINT "User_email_key";

CREATE UNIQUE INDEX "User_email_non_guest_key"
  ON "public"."User" ("email")
  WHERE "status" <> 'GUEST';

COMMENT ON INDEX "public"."User_email_non_guest_key" IS E'One account per email address. Excludes guest registrations (status GUEST), which may hold an address that also belongs to a real account created later.';
