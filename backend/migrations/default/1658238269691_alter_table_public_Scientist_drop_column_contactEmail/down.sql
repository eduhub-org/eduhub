comment on column "public"."Scientist"."contactEmail" is E'Rent-A-Scientist scientist offers courses';
alter table "public"."Scientist" alter column "contactEmail" drop not null;
alter table "public"."Scientist" add column "contactEmail" text;
