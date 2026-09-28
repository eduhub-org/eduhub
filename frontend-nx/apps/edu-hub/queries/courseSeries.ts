import { gql } from '@apollo/client';

export const COURSE_SERIES_OPTIONS = gql`
  query CourseSeriesOptions($organizationId: Int!) {
    CourseSeries(where: { organizationId: { _eq: $organizationId } }, order_by: { title: asc }) {
      id
      title
    }
  }
`;

// Runs of one series, loaded by the expanded course row only.
export const COURSE_SERIES_RUNS = gql`
  query CourseSeriesRuns($courseSeriesId: Int!) {
    Course(where: { courseSeriesId: { _eq: $courseSeriesId } }, order_by: { id: desc }) {
      id
      title
      Program {
        id
        shortTitle
        title
      }
    }
  }
`;

// Variables follow DropDownSelector's contract: `itemId` + `value` (the series id, null clears it).
export const UPDATE_COURSE_SERIES = gql`
  mutation UpdateCourseSeries($itemId: Int!, $value: Int) {
    update_Course_by_pk(pk_columns: { id: $itemId }, _set: { courseSeriesId: $value }) {
      id
      courseSeriesId
    }
  }
`;

// DropDownSelector reads the id of a created option from `createOption.value`.
export const CREATE_COURSE_SERIES = gql`
  mutation CreateCourseSeries($value: String!, $organizationId: Int!) {
    createOption: insert_CourseSeries_one(object: { title: $value, organizationId: $organizationId }) {
      value: id
    }
  }
`;
