-- Supports the global hourly cap on new guest registrations. Partial, because
-- the only query that needs it filters on status = 'GUEST' and the guest rows
-- are a small minority of the table.
CREATE INDEX "User_guest_created_at_idx"
  ON "public"."User" ("created_at")
  WHERE "status" = 'GUEST';
