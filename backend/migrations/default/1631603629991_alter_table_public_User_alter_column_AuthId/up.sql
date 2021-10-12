comment on column "public"."User"."AuthId" is E'Authentication ID in keycloak';
alter table "public"."User" rename column "AuthId" to "authId";
