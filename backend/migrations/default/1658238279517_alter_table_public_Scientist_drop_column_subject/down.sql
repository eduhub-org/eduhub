comment on column "public"."Scientist"."subject" is E'Rent-A-Scientist scientist offers courses';
alter table "public"."Scientist" alter column "subject" drop not null;
alter table "public"."Scientist" add column "subject" text;
