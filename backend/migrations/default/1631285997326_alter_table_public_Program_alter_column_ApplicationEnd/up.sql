comment on column "public"."Program"."ApplicationEnd" is E'The default application deadline for a course. It can be changed on the course level thoughthough.';
alter table "public"."Program" rename column "ApplicationEnd" to "defaultApplicationEndDateTime";
