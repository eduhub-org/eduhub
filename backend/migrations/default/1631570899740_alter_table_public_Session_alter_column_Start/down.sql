alter table "public"."Session" rename column "startDateTime" to "Start";
ALTER TABLE "public"."Session" ALTER COLUMN "Start" TYPE timestamp with time zone;
