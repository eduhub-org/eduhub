/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveCourseImage
// ====================================================

export interface SaveCourseImage_saveCourseImage_resizedPaths {
  __typename: "resizedImagePath";
  size: number;
  filePath: string;
  accessUrl: string;
}

export interface SaveCourseImage_saveCourseImage {
  __typename: "saveImageResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  filePath: string;
  accessUrl: string;
  resizedPaths: SaveCourseImage_saveCourseImage_resizedPaths[] | null;
}

export interface SaveCourseImage {
  saveCourseImage: SaveCourseImage_saveCourseImage | null;
}

export interface SaveCourseImageVariables {
  base64File: string;
  fileName: string;
  courseId: number;
}
