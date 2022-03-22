import { gql } from "@apollo/client";

import { ADMIN_COURSE_FRAGMENT, COURSE_FRAGMENT } from "./courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";

export const COURSE = gql`
  ${COURSE_FRAGMENT}
  query Course($id: Int!) {
    Course_by_pk(id: $id) {
      ...CourseFragment
    }
  }
`;

// Query to get all data on a course that is necessary for the manage course page
export const MANAGED_COURSE = gql`
  ${ADMIN_COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}

  query ManagedCourse($id: Int!) {
    Course_by_pk(id: $id) {
      ...AdminCourseFragment
      CourseEnrollments {
        ...EnrollmentFragment
      }
      CourseLocations {
        id
        link
        locationOption
      }
    }
  }
`;

export const LOCATION_OPTIONS = gql`
  query LocationOptionsKnown {
    LocationOption {
      value
    }
  }
`;

export const INSERT_NEW_COURSE_LOCATION = gql`
  mutation InsertCourseLocation($courseId: Int!, $option: String!) {
    insert_CourseLocation(
      objects: {
        courseId: $courseId
        locationOption: $option
        latitude: ""
        longitude: ""
        link: ""
      }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const UPDATE_COURSE_LOCATION_OPTION = gql`
  mutation UpdateCourseLocationOption($locationId: Int!, $option: String!) {
    update_CourseLocation_by_pk(
      pk_columns: { id: $locationId }
      _set: { locationOption: $option }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_LOCATION_LINK = gql`
  mutation UpdateCourseLocationLink($locationId: Int!, $link: String!) {
    update_CourseLocation_by_pk(
      pk_columns: { id: $locationId }
      _set: { link: $link }
    ) {
      id
    }
  }
`;

export const DELETE_COURSE_LOCATION = gql`
  mutation DeleteCourseLocation($locationId: Int!) {
    delete_CourseLocation_by_pk(id: $locationId) {
      id
    }
  }
`;

export const UPDATE_COURSE_START_TIME = gql`
  mutation UpdateCourseStartTime($courseId: Int!, $startTime: timetz!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { startTime: $startTime }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_END_TIME = gql`
  mutation UpdateCourseEndTime($courseId: Int!, $endTime: timetz!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { endTime: $endTime }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_LANGUAGE = gql`
  mutation UpdateCourseLanguage($courseId: Int!, $language: String!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { language: $language }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_WEEKDAY = gql`
  mutation UpdateCourseWeekday($courseId: Int!, $weekday: String!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { weekDay: $weekday }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_HEADING_DESCRIPTION_1 = gql`
  mutation UpdateCourseHeadingDescription1(
    $courseId: Int!
    $description: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { headingDescriptionField1: $description }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_HEADING_DESCRIPTION_2 = gql`
  mutation UpdateCourseHeadingDescription2(
    $courseId: Int!
    $description: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { headingDescriptionField2: $description }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_1 = gql`
  mutation UpdateCourseContentDescriptionField1(
    $courseId: Int!
    $description: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { contentDescriptionField1: $description }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_2 = gql`
  mutation UpdateCourseContentDescriptionField2(
    $courseId: Int!
    $description: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { contentDescriptionField2: $description }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_LEARNING_GOALS = gql`
  mutation UpdateCourseLearningGoals($courseId: Int!, $description: String!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { learningGoals: $description }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_STATUS = gql`
  mutation UpdateCourseStatus($courseId: Int!, $status: CourseStatus_enum!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { status: $status }
    ) {
      id
    }
  }
`;
