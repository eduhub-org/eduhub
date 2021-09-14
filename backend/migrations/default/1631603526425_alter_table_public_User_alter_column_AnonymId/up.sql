comment on column "public"."User"."AnonymId" is E'A random anonymous ID for the user, which can be used for external communication';
alter table "public"."User" rename column "AnonymId" to "anonymousId";
