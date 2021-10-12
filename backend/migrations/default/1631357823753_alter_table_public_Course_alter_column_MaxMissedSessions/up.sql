comment on column "public"."Course"."MaxMissedSessions" is E'The maximum number of sessions then can be missed to still receive a certificate.';
alter table "public"."Course" rename column "MaxMissedSessions" to "maxMissedSessions";
