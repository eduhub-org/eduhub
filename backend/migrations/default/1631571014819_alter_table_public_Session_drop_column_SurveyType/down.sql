comment on column "public"."Session"."SurveyType" is E'Includes all information about the individual sessions in a course.';
alter table "public"."Session" alter column "SurveyType" drop not null;
alter table "public"."Session" add column "SurveyType" int4;
