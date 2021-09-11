alter table "public"."Course" rename column "weekDay" to "WeekDay";
comment on column "public"."Course"."WeekDay" is NULL;
