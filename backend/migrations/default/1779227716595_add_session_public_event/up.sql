-- Add a per-session "public event" flag to the Session table.
-- When true, the session is promoted as a standalone public event with its
-- own public detail page (/event/[sessionId]) and may appear in events
-- sliders. Default false so existing sessions remain unaffected.

ALTER TABLE "public"."Session"
    ADD COLUMN "isPublicEvent" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."Session"."isPublicEvent" IS
E'When true, this session is promoted as a standalone public event. Anonymous users can view a dedicated public detail page at /event/[sessionId] and the session can appear in events sliders. Only admins can toggle this flag; instructors can read but not write it.';
