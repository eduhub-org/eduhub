alter table "public"."Course" rename column "endTime" to "TimeEnd";
comment on column "public"."Course"."TimeEnd" is NULL;
