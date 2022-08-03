comment on column "public"."Teacher"."surname" is E'a teacher that has enrolled into rent-a-scientist';
alter table "public"."Teacher" alter column "surname" drop not null;
alter table "public"."Teacher" add column "surname" text;
