import { gql } from '@apollo/client';

// Organizations whose programs fill the automatic homepage sliders and the public event feeds,
// in addition to the default organization (id 0), which is always included and never stored.
export const HOME_SLIDER_ORGANIZATIONS = gql`
  query HomeSliderOrganizations {
    HomeSliderOrganization {
      id
      organizationId
    }
  }
`;

export const ADMIN_HOME_SLIDER_ORGANIZATIONS = gql`
  query AdminHomeSliderOrganizations {
    HomeSliderOrganization(order_by: { Organization: { name: asc } }) {
      id
      organizationId
      Organization {
        id
        name
      }
    }
  }
`;

export const INSERT_HOME_SLIDER_ORGANIZATION = gql`
  mutation InsertHomeSliderOrganization($organizationId: Int!) {
    insert_HomeSliderOrganization_one(object: { organizationId: $organizationId }) {
      id
    }
  }
`;

export const DELETE_HOME_SLIDER_ORGANIZATION = gql`
  mutation DeleteHomeSliderOrganization($id: Int!) {
    delete_HomeSliderOrganization_by_pk(id: $id) {
      id
    }
  }
`;
