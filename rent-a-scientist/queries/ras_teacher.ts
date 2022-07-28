import { gql } from "@apollo/client";

export const MY_TEACHER = gql`
    query MyTeacher {
        Teacher {
            id
            userId
        }
    }
`;

export const INSERT_MY_TEACHER = gql`
    mutation InsertMyTeacher(
        $myUserId: uuid!
    ) {
        insert_Teacher(
            objects: {
                userId: $myUserId
            }
        ) {
            affected_rows
            returning {
                id
            }
        }
    }
`;

export const INSERT_SCHOOL_CLASS = gql`
    mutation InsertSchoolClass(
        $input: SchoolClass_insert_input!
    ) {
        insert_SchoolClass_one(
            object: $input
        ) {
            id
        }
    }
`;

export const INSERT_CLASS_REQUESTS = gql`
    mutation InsertClassRequests(
        $inputs: [SchoolClassRequest_insert_input!]!
    ) {
        insert_SchoolClassRequest(
            objects: $inputs
        ) {
            affected_rows
            returning {
                id
            }
        }
    }
`;