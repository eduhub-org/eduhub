alter table "public"."Program" rename column "lectureStart" to "Start";
comment on column "public"."Program"."Start" is NULL;
