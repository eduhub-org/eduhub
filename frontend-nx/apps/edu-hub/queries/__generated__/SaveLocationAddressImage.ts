/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveLocationAddressImage
// ====================================================

export interface SaveLocationAddressImage_saveLocationAddressImage {
  __typename: "saveImageResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  filePath: string;
  accessUrl: string;
}

export interface SaveLocationAddressImage {
  /**
   * Venue image of a location address (admin only, from the location addresses settings)
   */
  saveLocationAddressImage: SaveLocationAddressImage_saveLocationAddressImage | null;
}

export interface SaveLocationAddressImageVariables {
  base64File: string;
  fileName: string;
  locationAddressId: number;
}
