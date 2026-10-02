alter table "public"."User" add column "organizationName" text null;
comment on column "public"."User"."organizationName" is E'Free-text organization the user belongs to, e.g. entered during guest registration. Used when no organizationId is set.';
