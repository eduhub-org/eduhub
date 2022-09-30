alter table "public"."AchievementRecord" add column "created_at" timestamptz
 null default now();
