alter table "public"."AchievementOption" add column "created_at" timestamptz
 null default now();
