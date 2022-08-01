comment on column "public"."Teacher"."email" is E'a teacher that has enrolled into rent-a-scientist';
alter table "public"."Teacher" alter column "email" drop not null;
alter table "public"."Teacher" add column "email" text;
