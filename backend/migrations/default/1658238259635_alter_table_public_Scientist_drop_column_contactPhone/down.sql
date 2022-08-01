comment on column "public"."Scientist"."contactPhone" is E'Rent-A-Scientist scientist offers courses';
alter table "public"."Scientist" alter column "contactPhone" drop not null;
alter table "public"."Scientist" add column "contactPhone" text;
