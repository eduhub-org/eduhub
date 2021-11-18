comment on column "public"."Session"."SurveyId" is E'Includes all information about the individual sessions in a course.';
alter table "public"."Session" alter column "SurveyId" drop not null;
alter table "public"."Session" add column "SurveyId" text;
