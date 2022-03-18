import { gql } from "@apollo/client";

export const SAVE_FILE = gql`
    mutation SaveAFile($base64file: String!, $fileName: String!) {
        saveFile(
            base64file: $base64file
            filename: $fileName
        )
    }
`;