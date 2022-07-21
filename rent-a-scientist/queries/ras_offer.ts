import { gql } from "@apollo/client";

export const ALL_OFFERS = gql`
  query AllScientistOffers {
    ScientistOffer {
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
  }
`;

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
