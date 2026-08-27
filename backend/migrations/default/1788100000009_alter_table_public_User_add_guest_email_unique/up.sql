-- One guest record per address, alongside the one account per address that
-- User_email_non_guest_key already enforces.
--
-- That index deliberately excludes status = 'GUEST' so a guest record and the
-- account which later claims the same address can coexist (see
-- 1788100000005_..._scope_email_unique_to_non_guests). The side effect was that
-- nothing constrained guest rows against each other: two genuinely concurrent
-- submissions for an address we have never seen both find no row and both
-- insert. The person then holds two guest identities for one address, and their
-- manage link shows only the registrations that happened to land on one of them.
--
-- registerGuestForCourse reuses an existing guest record whenever it finds one,
-- so this only closes the race window between that lookup and the insert. The
-- handler catches the violation and re-reads the row that won.
--
-- Together the two partial indexes give: at most one account and at most one
-- guest record per address.
CREATE UNIQUE INDEX "User_email_guest_key"
  ON "public"."User" ("email")
  WHERE "status" = 'GUEST';

COMMENT ON INDEX "public"."User_email_guest_key" IS E'One guest record per email address. Complements User_email_non_guest_key, which enforces one account per address; the two partitions are disjoint, so an address may hold one of each.';
