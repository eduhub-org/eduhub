/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: LoadAFile
// ====================================================

export interface LoadAFile_loadFile {
  __typename: "loadFileOutput";
  link: string;
}

export interface LoadAFile {
  loadFile: LoadAFile_loadFile | null;
}

export interface LoadAFileVariables {
  path: string;
}
