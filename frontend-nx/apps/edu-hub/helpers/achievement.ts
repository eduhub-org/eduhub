import { AchievementRecordType_Enum } from '../types/generated/graphql';
import { UploadFile } from './filehandling';

export const QUERY_LIMIT = 100;

export interface TempAchievementOptionMentor {
  userId: string; //
  firstName: string;
  lastName: string;
}
export interface TempAchievementOptionCourse {
  courseId?: number; // Table ID of Course
  title: string;
  programShortName: string;
}
export interface IDataToManipulate {
  achievementOptionId: number | null;
  achievementDocumentationTemplateId: number | null;
  description: string | null;
  evaluationScriptUrl: string | null;
  recordType: AchievementRecordType_Enum | null;
  title: string | null;
  mentors: TempAchievementOptionMentor[];
  courses: TempAchievementOptionCourse[];
  documentTemplateFile?: UploadFile;
  evaluationScriptFile?: UploadFile;
  showScoreAuthors: boolean;
  csvTemplateUrl: string;
  csvTemplateFile?: UploadFile;
}

export interface IPayload {
  key: string;
  value:
    | number
    | string
    | boolean
    | UploadFile
    | TempAchievementOptionMentor[]
    | TempAchievementOptionCourse[];
}

export const DefaultAchievementOptions: string[] = [
  'ONLINE',
  'DOCUMENTATION',
  'DOCUMENTATION_AND_CSV',
];

/**
 *   Eslint give error if we use enum
 * https://stackoverflow.com/questions/50752987/eslint-no-case-declaration-unexpected-lexical-declaration-in-case-block
 */
export const UploadFileTypes = {
  SAVE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE:
    'saveAchievementOptionDocumentationTemplate',
  SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT:
    'saveAchievementOptionEvaluationScript',
};

export const AchievementKeys = {
  CSV_TEMPLATE_URL: 'csvTemplateUrl',
  DESCRIPTION: 'description',
  RECORD_TYPE: 'recordType',
  TITLE: 'title',
  ADD_A_MENTOR: 'addAMentor',
  DELETE_A_MENTOR: 'deleteAMentor',
  ADD_A_COURSE: 'addACourse',
  DELETE_A_COURSE: 'deleteACourse',
  DOCUMENT_TEMPLATE_FILE: 'documentTemplateFile',
  EVALUATION_SCRIPT_FILE: 'evaluationScriptFile',
  CSV_TEMPLATE_FILE: 'csvTemplateFile',
  SHOW_SCORE_AUTHORS: 'showScoreAuthors',
};

export interface ResponseToARequest {
  success: boolean;
  message?: string;
}

export interface NameId {
  id: string;
  name: string;
}

type AtLeast<T> = { [K in keyof T]: T[K] };
interface TempUserData {
  id: any;
  firstName: string;
  lastName: string;
  email: string;
}
export type AtLeastNameEmail = AtLeast<TempUserData>;

export type MinAchievementOption = {
  id: number;
  title: string;
  description?: string; // Make optional
  recordType: AchievementRecordType_Enum;
  evaluationScriptUrl?: string; // Make optional
  csvTemplateUrl?: string; // Make optional
  achievementDocumentationTemplateId?: number; // Make optional
};
