comment on column "public"."Event"."SessionId" is E'The ID of the session that this even is based on';
alter table "public"."Event" rename column "SessionId" to "sessionId";
