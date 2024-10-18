comment on column "public"."Organization"."aliases" is E'Represents organizations associated with users in the EduHub system. Includes details such as name, type, description, and aliases. Used for organizational affiliation and white-labeling functionality.';
alter table "public"."Organization" alter column "aliases" set default '{}'::text[];
alter table "public"."Organization" alter column "aliases" drop not null;
alter table "public"."Organization" add column "aliases" _text;
