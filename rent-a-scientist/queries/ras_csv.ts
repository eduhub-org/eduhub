import { gql } from "@apollo/client";

// mutations used for the csv importing functions

export const UPSERT_SCHOOLS = gql`
  mutation UpsertSchools($objects: [School_insert_input!]!) {
    insert_School(
      objects: $objects
      on_conflict: {
        constraint: School_pkey
        update_columns: [name, schoolType, district, street, postalCode]
      }
    ) {
      returning {
        dstnr
      }
    }
  }
`;

export const ALL_SCIENTISTS = gql`
  query AllScientists {
    Scientist {
        id
        forename
        surname
        title
        image
    }
  }
`;

export const UPSERT_SCIENTISTS = gql`
  mutation UpsertScientists($objects: [Scientist_insert_input!]!) {
    insert_Scientist (
        objects: $objects
        on_conflict: {
            constraint: Scientist_pkey
            update_columns: [forename, surname, title, image]
        }
    ) {
        returning {
            id
        }
    }
  }
`;

export const UPSERT_SCIENTIST_OFFER = gql`
  mutation UpsertScientistOffers($objects: [ScientistOffer_insert_input!]!) {
    insert_ScientistOffer (
        objects: $objects
        on_conflict: {
            constraint: ScientistOffer_pkey
            update_columns: [format,
                minimumGrade,
                maximumGrade,
                possibleDays,
                timeWindow,
                maxDeployments,
                possibleLocations,
                equipmentRequired,
                roomRequirements,
                title,
                description,
                duration,
                extraComment,
                subjectComment,
                programId,
                classPreparation,
                institutionName,
                institutionLogo,
                categories,
                contactEmail,
                contactPhone,
                contactName,
                researchSubject]
        }
    ) {
        returning {
            id
        }
    }
  }
`;

export const DELETE_SCIENTIST_OFFER_RELATIONS = gql`
  mutation DeleteScientistOfferRelations($ids: [Int!]!) {
    delete_ScientistOfferRelation (
        where: {
            offerId: {
                _in: $ids
            }
        }
    ) {
        affected_rows
    }
  }
`;

export const INSERT_SCIENTIST_OFFER_RELATIONS = gql`
  mutation InsertScientistOfferRelations(
    $objects: [ScientistOfferRelation_insert_input!]!
  ) {

    insert_ScientistOfferRelation (
        objects: $objects
    ) {
        returning {
            offerId
            scientistId
        }
    }

  }
`;