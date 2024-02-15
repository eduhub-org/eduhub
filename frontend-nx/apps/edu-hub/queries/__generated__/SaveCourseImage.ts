/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveCourseImage
// ====================================================

export interface SaveCourseImage_saveCourseImage {
  __typename: "saveFileOutput";
  file_path: string;
  google_link: string;
}

export interface SaveCourseImage {
  saveCourseImage: SaveCourseImage_saveCourseImage | null;
}

export interface SaveCourseImageVariables {
  base64File: string;
  fileName: string;
  courseId: number;
}
