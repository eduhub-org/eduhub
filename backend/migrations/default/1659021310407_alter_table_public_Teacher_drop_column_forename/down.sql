comment on column "public"."Teacher"."forename" is E'a teacher that has enrolled into rent-a-scientist';
alter table "public"."Teacher" alter column "forename" drop not null;
alter table "public"."Teacher" add column "forename" text;
