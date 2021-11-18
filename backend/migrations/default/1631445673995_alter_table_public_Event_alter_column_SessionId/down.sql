alter table "public"."Event" rename column "sessionId" to "SessionId";
comment on column "public"."Event"."SessionId" is NULL;
