-- Remove the added columns from User table
alter table "public"."User" drop column "zipCode" cascade;
alter table "public"."User" drop column "country" cascade; 