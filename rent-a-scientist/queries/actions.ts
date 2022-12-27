import { gql } from "@apollo/client";

// I am pretty sure the current loadFile/saveFile implementation is still broken,
// I can't get it to work at all

// I think the following concept would be reasonable and will implement the UI to use it:

// - the saveFile mutation is given the base64 encoded data and the full path of the file
// - if the path starts with public it can afterwards be accessed directly using the bucket_url + the path
// - if the path does not start with public the UI needs to call loadFile with the full path of the file
// - loadFile then returns the full URL with a token parameter to access the data, but only if the current user
// is allowed to access the data

// export const SAVE_FILE = gql`
//   mutation SaveAFile($base64file: String!, $fileName: String!) {
//     saveFile(base64file: $base64file, filename: $fileName)
//   }
// `;

// export const LOAD_FILE = gql`
//   query LoadAFile($path: String!) {
//     loadFile(path: $path) {
//       link
//     }
//   }
// `;
