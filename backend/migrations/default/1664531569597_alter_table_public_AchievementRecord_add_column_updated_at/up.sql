alter table "public"."AchievementRecord" add column "updated_at" timestamptz
 null default now();
