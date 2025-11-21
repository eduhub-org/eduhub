import { gql } from '@apollo/client';

export const LOCATION_ADDRESS_LIST = gql`
  query LocationAddressList(
    $limit: Int = 15
    $offset: Int = 0
    $filter: LocationAddress_bool_exp = {}
    $order_by: [LocationAddress_order_by!] = {created_at: desc}
  ) {
    LocationAddress(
      limit: $limit
      offset: $offset
      where: $filter
      order_by: $order_by
    ) {
      id
      locationOption
      shortLabel
      address
      description
      aliases
      created_at
      updated_at
      LocationOption {
        value
        comment
      }
      SessionAddresses_aggregate {
        aggregate {
          count
        }
      }
      CourseLocations_aggregate {
        aggregate {
          count
        }
      }
    }
    LocationAddress_aggregate(where: $filter) {
      aggregate {
        count
      }
    }
    LocationOption {
      value
      comment
    }
  }
`;

export const INSERT_LOCATION_ADDRESS = gql`
  mutation InsertLocationAddress($insertInput: LocationAddress_insert_input!) {
    insert_LocationAddress_one(object: $insertInput) {
      id
      locationOption
      shortLabel
      address
      description
      aliases
    }
  }
`;

export const UPDATE_LOCATION_ADDRESS_SHORT_LABEL = gql`
  mutation UpdateLocationAddressShortLabel($itemId: Int!, $text: String!) {
    update_LocationAddress_by_pk(pk_columns: { id: $itemId }, _set: { shortLabel: $text }) {
      id
      shortLabel
    }
  }
`;

export const UPDATE_LOCATION_ADDRESS_ADDRESS = gql`
  mutation UpdateLocationAddressAddress($itemId: Int!, $text: String!) {
    update_LocationAddress_by_pk(pk_columns: { id: $itemId }, _set: { address: $text }) {
      id
      address
    }
  }
`;

export const UPDATE_LOCATION_ADDRESS_DESCRIPTION = gql`
  mutation UpdateLocationAddressDescription($itemId: Int!, $text: String!) {
    update_LocationAddress_by_pk(pk_columns: { id: $itemId }, _set: { description: $text }) {
      id
      description
    }
  }
`;

export const UPDATE_LOCATION_ADDRESS_ALIASES = gql`
  mutation UpdateLocationAddressAliases($id: Int!, $tags: jsonb!) {
    update_LocationAddress_by_pk(
      pk_columns: { id: $id },
      _set: { aliases: $tags }
    ) {
      id
      aliases
    }
  }
`;

export const UPDATE_LOCATION_ADDRESS_LOCATION_OPTION = gql`
  mutation UpdateLocationAddressLocationOption($id: Int!, $value: LocationOption_enum!) {
    update_LocationAddress_by_pk(
      pk_columns: { id: $id },
      _set: { locationOption: $value }
    ) {
      id
      locationOption
    }
  }
`;

export const DELETE_LOCATION_ADDRESS = gql`
  mutation DeleteLocationAddress($id: Int!) {
    delete_LocationAddress_by_pk(id: $id) {
      id
    }
  }
`;

export const LOCATION_ADDRESS_BY_LOCATION_OPTION = gql`
  query LocationAddressByLocationOption(
    $locationOption: LocationOption_enum!
    $searchFilter: String = ""
  ) {
    LocationAddress(
      where: {
        locationOption: { _eq: $locationOption }
        _or: [
          { shortLabel: { _ilike: $searchFilter } }
          { address: { _ilike: $searchFilter } }
        ]
      }
      order_by: { shortLabel: asc }
    ) {
      id
      shortLabel
      address
      aliases
    }
  }
`;

export const CREATE_LOCATION_ADDRESS = gql`
  mutation CreateLocationAddress($value: String!, $locationOption: LocationOption_enum!) {
    insert_LocationAddress_one(object: {shortLabel: $value, address: $value, locationOption: $locationOption}) {
      id
      shortLabel
      address
    }
  }
`;

export const LOCATION_ADDRESSES_BY_IDS = gql`
  query LocationAddressesByIds($ids: [Int!]!) {
    LocationAddress(where: { id: { _in: $ids } }) {
      id
      shortLabel
      address
      locationOption
    }
  }
`;

export const SESSION_ADDRESSES_BY_LOCATION_ADDRESS_ID = gql`
  query SessionAddressesByLocationAddressId($locationAddressIds: [Int!]!) {
    SessionAddress(where: { locationAddressId: { _in: $locationAddressIds } }) {
      id
      locationAddressId
    }
  }
`;

export const COURSE_LOCATIONS_BY_DEFAULT_SESSION_ADDRESS_ID = gql`
  query CourseLocationsByDefaultSessionAddressId($locationAddressIds: [Int!]!) {
    CourseLocation(where: { defaultSessionAddressId: { _in: $locationAddressIds } }) {
      id
      defaultSessionAddressId
    }
  }
`;
