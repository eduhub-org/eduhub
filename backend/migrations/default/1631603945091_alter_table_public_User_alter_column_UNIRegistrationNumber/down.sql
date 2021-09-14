alter table "public"."User" rename column "matriculationNumber" to "UNIRegistrationNumber";
comment on column "public"."User"."UNIRegistrationNumber" is NULL;
