comment on column "public"."Program"."End" is E'The last day a course lecture can possibly be in this program.';
alter table "public"."Program" rename column "End" to "lectureEnd";
