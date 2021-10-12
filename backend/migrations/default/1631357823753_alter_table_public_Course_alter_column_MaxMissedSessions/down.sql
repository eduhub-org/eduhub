alter table "public"."Course" rename column "maxMissedSessions" to "MaxMissedSessions";
comment on column "public"."Course"."MaxMissedSessions" is NULL;
