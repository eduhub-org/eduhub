comment on column "public"."ScientistOffer"."institutionId" is E'An offer from a scientist for Rent-A-Scientist';
alter table "public"."ScientistOffer"
  add constraint "ScientistOffer_institutionId_fkey"
  foreign key (institutionId)
  references "public"."Institution"
  (id) on update cascade on delete cascade;
alter table "public"."ScientistOffer" alter column "institutionId" drop not null;
alter table "public"."ScientistOffer" add column "institutionId" int4;
