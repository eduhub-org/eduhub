alter table "public"."AchievementOption" add column "updated_at" timestamptz
 null default now();
