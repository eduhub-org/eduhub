comment on column "public"."AppSettings"."id" is E'To store characteristics on the app level.';
alter table "public"."AppSettings" alter column "id" set default nextval('"AppSettings_id_seq"'::regclass);
alter table "public"."AppSettings" alter column "id" drop not null;
alter table "public"."AppSettings" add column "id" int4;
