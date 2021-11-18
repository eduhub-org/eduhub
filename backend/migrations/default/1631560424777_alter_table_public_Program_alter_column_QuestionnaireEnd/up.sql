comment on column "public"."Program"."QuestionnaireEnd" is E'The questionnaire that the participants of all courses get sent after the last session of their course.';
alter table "public"."Program" rename column "QuestionnaireEnd" to "closingQuestionnaire";
