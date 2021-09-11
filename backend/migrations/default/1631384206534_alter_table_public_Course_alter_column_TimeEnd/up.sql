comment on column "public"."Course"."TimeEnd" is E'The time the course ends each week.';
alter table "public"."Course" rename column "TimeEnd" to "endTime";
