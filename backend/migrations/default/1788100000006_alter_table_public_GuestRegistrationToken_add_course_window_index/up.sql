-- Supports the per-course hourly volume cap in registerGuestForCourse. The
-- existing indexes are (userId, created_at) and (expiresAt); neither serves a
-- count of tokens issued for one course within a time window.
CREATE INDEX "GuestRegistrationToken_courseId_created_at_idx"
  ON "public"."GuestRegistrationToken" ("courseId", "created_at");
