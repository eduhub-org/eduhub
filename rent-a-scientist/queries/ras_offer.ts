import { gql } from "@apollo/client";

export const OFFER_FRAGMENT = gql`
  fragment ScientistOfferComment on ScientistOffer {
    RequestsCount: SchoolClassRequests_aggregate {
      aggregate {
        count
      }
    }

    id
    format
    minimumGrade
    maximumGrade
    possibleDays
    timeWindow
    maxDeployments
    possibleLocations
    equipmentRequired
    roomRequirements
    title
    description
    duration
    extraComment
    subjectComment
    programId
    classPreparation
    institutionName
    institutionLogo
    categories
    contactEmail
    contactPhone
    contactName
    researchSubject

    ScientistOfferRelations {
      Scientist {
        id
        forename
        surname
        title
        image
      }
    }
  }
`;

export const ALL_OFFERS = gql`
  ${OFFER_FRAGMENT}
  query AllScientistOffers {
    ScientistOffer {
      ...ScientistOfferComment
    }
  }
`;

export const OFFER_BY_ID = gql`
  ${OFFER_FRAGMENT}
  query ScientistOfferById($id: Int!) {
    ScientistOffer_by_pk(id: $id) {
      ...ScientistOfferComment
    }
  }
`

export const ALL_SCHOOLS = gql`
  query AllSchols {
    School {
      dstnr
      name
      schoolType
      district
      street
      postalCode
      city
    }
  }
`;
