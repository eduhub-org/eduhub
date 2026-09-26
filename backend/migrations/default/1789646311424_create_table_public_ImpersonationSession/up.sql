-- One row per super-admin impersonation of another user.
--
-- Impersonation lets a super-admin read the platform exactly as someone else
-- sees it, which is the only way to answer "the participant says they cannot see
-- X". That is also a look at another person's data, so it is never silent: this
-- table records who looked at whom and for how long, and the row is what the
-- proxy checks on every request -- ending a session here ends it for every open
-- tab, not just the one that pressed the button.
--
-- Written only by the /api/impersonation routes, which use the Hasura admin
-- secret. No role permissions are defined, so only `admin` can read it.
CREATE TABLE "public"."ImpersonationSession" (
  "id"           serial      NOT NULL,
  "adminUserId"  uuid        NOT NULL,
  "targetUserId" uuid        NOT NULL,
  "started_at"   timestamptz NOT NULL DEFAULT now(),
  "ended_at"     timestamptz,
  PRIMARY KEY ("id")
);

COMMENT ON TABLE "public"."ImpersonationSession" IS
  E'Audit trail of super-admin impersonation: who impersonated whom, when it started and when it ended. An open row (ended_at IS NULL) is what authorises the impersonation proxy.';

ALTER TABLE "public"."ImpersonationSession"
  ADD CONSTRAINT "ImpersonationSession_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES "public"."User"("id")
  ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE "public"."ImpersonationSession"
  ADD CONSTRAINT "ImpersonationSession_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "public"."User"("id")
  ON UPDATE RESTRICT ON DELETE CASCADE;

CREATE INDEX "ImpersonationSession_targetUserId_idx"
  ON "public"."ImpersonationSession" ("targetUserId");

-- The proxy looks up "is this session still open" on every forwarded request.
CREATE INDEX "ImpersonationSession_open_idx"
  ON "public"."ImpersonationSession" ("adminUserId") WHERE "ended_at" IS NULL;
