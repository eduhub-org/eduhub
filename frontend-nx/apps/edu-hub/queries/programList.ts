import { gql } from "@apollo/client";

import {
  ADMIN_PROGRAM_FRAGMENT,
  PROGRAM_FRAGMENT_MINIMUM_PROPERTIES,
} from "./programFragment";

export const PROGRAM_LIST = gql`
  ${ADMIN_PROGRAM_FRAGMENT}
  query ProgramList($limit: Int, $offset: Int, $order_by: [Program_order_by!], $where: Program_bool_exp) {
    Program(limit: $limit, offset: $offset, order_by: $order_by, where: $where) {
      ...AdminProgramFragment
      Courses {
        id
      }
    }
    Program_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const PROGRAM_STATISTICS = gql`
  ${ADMIN_PROGRAM_FRAGMENT}
  query ProgramStatistics {
    Program {
      ...AdminProgramFragment
      Courses {
        id
        title
        published
        Sessions {
          id
          startDateTime
          Attendances {
            id
            status
            userId
          }
        }
        CourseEnrollments {
          id
          status
          attendanceCertificateURL
          achievementCertificateURL
          created_at
          updated_at
        }
      }
    }
  }
`;


// organizationId/Organization are selected outside the shared fragment: only the management
// dashboards need them, to group the programs of a super-admin (who sees every organization) by
// owning organization.
export const PROGRAMS_WITH_MINIMUM_PROPERTIES = gql`
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  query Programs($where: Program_bool_exp = {}) {
    Program(order_by: { id: desc }, where: $where) {
      ...ProgramFragmentMinimumProperties
      organizationId
      Organization {
        id
        name
      }
    }
  }
`;

export const PROGRAM_TYPES = gql`
  query ProgramTypesList {
    ProgramType {
      value
    }
  }
`;
