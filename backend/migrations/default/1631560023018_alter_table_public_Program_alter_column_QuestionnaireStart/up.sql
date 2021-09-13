comment on column "public"."Program"."QuestionnaireStart" is E'The questionnaire that the patricipants of all courses get sent after the first course session.';
alter table "public"."Program" rename column "QuestionnaireStart" to "startQuestionnaire";
