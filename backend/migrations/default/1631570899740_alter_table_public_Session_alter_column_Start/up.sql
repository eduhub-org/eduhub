ALTER TABLE "public"."Session" ALTER COLUMN "Start" TYPE timestamp with time zone;
alter table "public"."Session" rename column "Start" to "startDateTime";
