alter table "public"."Course" alter column "MaxProjectParticipants" drop not null;
alter table "public"."Course" add column "MaxProjectParticipants" int4;
