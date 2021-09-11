alter table "public"."Course" alter column "MaxParticipants" drop not null;
alter table "public"."Course" add column "MaxParticipants" int4;
