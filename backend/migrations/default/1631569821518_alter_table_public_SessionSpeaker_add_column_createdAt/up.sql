alter table "public"."SessionSpeaker" add column "createdAt" timestamptz
 null default now();
