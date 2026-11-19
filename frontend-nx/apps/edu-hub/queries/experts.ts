import { gql } from '@apollo/client';

const EXPERT_FIELDS = gql`
  fragment ExpertFields on User {
    id
    firstName
    lastName
    email
    picture
    externalProfile
    organizationName
    Organization {
      id
      name
    }
    matrixUserHandle
    doNotContact
    expertLastActiveAt @include(if: $isAdmin)
    CourseInstructors {
      id
      Course {
        id
        title
        tagline
        contentDescriptionField1
        contentDescriptionField2
        headingDescriptionField1
        headingDescriptionField2
        Program {
          id
          shortTitle
          type
          lectureStart
          organizationId
        }
      }
    }
    SessionSpeakers {
      id
      Session {
        id
        title
        description
        startDateTime
        Course {
          id
          title
          Program {
            id
            shortTitle
            organizationId
          }
        }
      }
    }
    ProjectMentors {
      id
      Project {
        id
        title
        tagline
        description
        created_at
        ProjectCourses {
          id
          Course {
            id
            Program {
              id
              organizationId
            }
          }
        }
      }
    }
    AchievementOptionMentors {
      id
      AchievementOption {
        id
        title
        description
        created_at
        AchievementOptionCourses {
          id
          Course {
            id
            Program {
              id
              organizationId
            }
          }
        }
      }
    }
    ExpertNotes(order_by: [{ created_at: desc }, { id: desc }]) {
      id
      text
      created_at
      updated_at
      authorId
      organizationId
      Author {
        id
        firstName
        lastName
      }
      Organization {
        id
        name
      }
    }
  }
`;

const EXPERT_WHERE = `
  _and: [
    { status: { _eq: ACTIVE } }
    {
      _or: [
        { CourseInstructors: {} }
        { SessionSpeakers: {} }
        { ProjectMentors: {} }
        { AchievementOptionMentors: {} }
      ]
    }
    $scope
    $filter
  ]
`;

// $scope narrows the list for org admins to the experts of their organization's courses (the Hasura
// permission is the security boundary; the scope keeps out people the org admin only sees as
// participants). $isAdmin fetches the admin-only Last Active computed field.
export const EXPERTS_LIST = gql`
  ${EXPERT_FIELDS}
  query ExpertsList(
    $limit: Int = 10
    $offset: Int = 0
    $filter: User_bool_exp = {}
    $scope: User_bool_exp = {}
    $isAdmin: Boolean!
    $order_by: [User_order_by!] = [{ updated_at: desc }]
  ) {
    User(limit: $limit, offset: $offset, order_by: $order_by, where: { ${EXPERT_WHERE} }) {
      ...ExpertFields
    }
    User_aggregate(where: { ${EXPERT_WHERE} }) {
      aggregate {
        count
      }
    }
  }
`;

// Current contact details of selected experts: a selection can hold rows loaded before they were
// marked Do Not Contact on another page.
export const EXPERT_CONTACTS = gql`
  query ExpertContacts($ids: [uuid!]!) {
    User(where: { id: { _in: $ids } }) {
      id
      email
      doNotContact
    }
  }
`;

// The organizations an org admin writes Expert Notes for: their own grants that may manage programs.
export const EXPERT_NOTE_ORGANIZATIONS = gql`
  query ExpertNoteOrganizations($userId: uuid!) {
    OrganizationAdmin(
      where: {
        userId: { _eq: $userId }
        _or: [
          { canManageCourses: { _eq: true } }
          { canManageEvents: { _eq: true } }
          { canManageDegrees: { _eq: true } }
          { canManageSettings: { _eq: true } }
        ]
      }
      order_by: [{ created_at: asc }, { id: asc }]
    ) {
      id
      organizationId
      Organization {
        id
        name
      }
    }
  }
`;

// Admins pass authorId themselves (they have no insert preset); Hasura presets it for org admins.
export const INSERT_EXPERT_NOTE = gql`
  mutation InsertExpertNote($object: ExpertNote_insert_input!) {
    insert_ExpertNote_one(object: $object) {
      id
    }
  }
`;

export const UPDATE_EXPERT_NOTE = gql`
  mutation UpdateExpertNote($id: Int!, $text: String!) {
    update_ExpertNote_by_pk(pk_columns: { id: $id }, _set: { text: $text }) {
      id
    }
  }
`;

export const DELETE_EXPERT_NOTE = gql`
  mutation DeleteExpertNote($id: Int!) {
    delete_ExpertNote_by_pk(id: $id) {
      id
    }
  }
`;

export const SET_DO_NOT_CONTACT = gql`
  mutation SetDoNotContact($userId: uuid!, $doNotContact: Boolean!) {
    update_User_by_pk(pk_columns: { id: $userId }, _set: { doNotContact: $doNotContact }) {
      id
      doNotContact
    }
  }
`;
