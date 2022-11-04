export const QUERY_LIMIT = 100;

export interface IPayload {
  key: string;
  value: any;
}

export const DefaultAchievementOptions: string[] = [
  "ONLINE",
  "DOCUMENTATION",
  "DOCUMENTATION_AND_CSV",
];

/**
 *   Eslint give error if we use enum
 * https://stackoverflow.com/questions/50752987/eslint-no-case-declaration-unexpected-lexical-declaration-in-case-block
 */
export const UploadFileTypes = {
  SAVE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE:
    "saveAchievementOptionDocumentationTemplate",
  SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT:
    "saveAchievementOptionEvaluationScript",
};

export const AchievementKeys = {
  CSV_TEMPLATE_URL: "csvTemplateUrl",
  DESCRIPTION: "description",
  RECORD_TYPE: "recordType",
  TITLE: "title",
  ADD_A_MENTOR: "addAMentor",
  DELETE_A_MENTOR: "deleteAMentor",
  ADD_A_COURSE: "addACourse",
  DELETE_A_COURSE: "deleteACourse",
  DOCUMENT_TEMPLATE_FILE: "documentTemplateFile",
  EVALUTION_SCRIPT_FILE: "evalutionScriptFile",
};
