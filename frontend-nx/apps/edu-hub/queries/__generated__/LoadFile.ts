/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: LoadFile
// ====================================================

export interface LoadFile_loadFile {
  __typename: "loadFileOutput";
  link: string;
}

export interface LoadFile {
  /**
   * Loads file url from Google Storage Bucket
   */
  loadFile: LoadFile_loadFile | null;
}

export interface LoadFileVariables {
  path: string;
}
