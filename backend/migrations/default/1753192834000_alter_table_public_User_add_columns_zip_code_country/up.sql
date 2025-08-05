-- Add zip_code and country columns to User table
alter table "public"."User" add column "zipCode" text null;
alter table "public"."User" add column "country" text null;

-- Add comments to document the new columns
comment on column "public"."User"."zipCode" is E'The user\'s postal/zip code';
comment on column "public"."User"."country" is E'The user\'s country of residence'; 