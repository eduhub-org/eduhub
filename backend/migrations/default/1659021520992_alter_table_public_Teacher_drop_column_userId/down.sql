comment on column "public"."Teacher"."userId" is E'a teacher that has enrolled into rent-a-scientist';
alter table "public"."Teacher" alter column "userId" drop not null;
alter table "public"."Teacher" add column "userId" text;
