import { gql } from '@apollo/client';

export const COUNTRY_LIST = gql`
  query CountryList {
    Country {
      code
      name_en
      name_de
    }
  }
`; 