comment on column "public"."Scientist"."contactName" is E'Rent-A-Scientist scientist offers courses';
alter table "public"."Scientist" alter column "contactName" drop not null;
alter table "public"."Scientist" add column "contactName" text;
