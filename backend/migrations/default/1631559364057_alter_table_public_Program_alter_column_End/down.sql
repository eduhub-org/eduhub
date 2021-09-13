alter table "public"."Program" rename column "lectureEnd" to "End";
comment on column "public"."Program"."End" is NULL;
