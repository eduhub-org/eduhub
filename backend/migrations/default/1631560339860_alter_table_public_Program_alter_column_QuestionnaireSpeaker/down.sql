alter table "public"."Program" rename column "speakerQuestionnaire" to "QuestionnaireSpeaker";
comment on column "public"."Program"."QuestionnaireSpeaker" is NULL;
