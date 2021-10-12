alter table "public"."Program" rename column "closingQuestionnaire" to "QuestionnaireEnd";
comment on column "public"."Program"."QuestionnaireEnd" is NULL;
