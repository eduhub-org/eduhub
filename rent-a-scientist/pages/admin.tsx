import { IconButton } from "@material-ui/core";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC, MutableRefObject, useCallback, useRef } from "react";
import { MdUpload } from "react-icons/md";
import { Page } from "../components/Page";
import { parseCsvFileUploadEvent } from "../helpers/filehandling";
import { useAdminMutation } from "../hooks/authedMutation";

import { useIsAdmin } from "../hooks/authentication";
import { ALL_SCIENTISTS, DELETE_SCIENTIST_OFFER_RELATIONS, INSERT_SCIENTIST_OFFER_RELATIONS, UPSERT_SCHOOLS, UPSERT_SCIENTISTS, UPSERT_SCIENTIST_OFFER } from "../queries/ras_csv";
import { School_insert_input, ScientistOfferRelation_insert_input, ScientistOffer_insert_input, Scientist_insert_input } from "../__generated__/globalTypes";
import {
  UpsertSchools,
  UpsertSchoolsVariables,
} from "../queries/__generated__/UpsertSchools";
import { useAuthedQuery } from "../hooks/authedQuery";
import { QueryActiveProgramId } from "../queries/__generated__/QueryActiveProgramId";
import { QUERY_ACTIVE_PROGRAM_ID } from "../queries/ras_config";
import { useQuery } from "@apollo/client";
import { AllScientists, AllScientists_Scientist } from "../queries/__generated__/AllScientists";
import { UpsertScientists, UpsertScientistsVariables, UpsertScientists_insert_Scientist } from "../queries/__generated__/UpsertScientists";
import { UpsertScientistOffers, UpsertScientistOffersVariables } from "../queries/__generated__/UpsertScientistOffers";
import { DeleteScientistOfferRelations, DeleteScientistOfferRelationsVariables } from "../queries/__generated__/DeleteScientistOfferRelations";
import { InsertScientistOfferRelations, InsertScientistOfferRelationsVariables } from "../queries/__generated__/InsertScientistOfferRelations";

const CSV_KEYS = {
  SCHOOL: {
    NAME1: "SNAME1",
    NAME2: "SNAME2",
    TYPE: "SFORM_SV_TEXT",
    DISTRICT: "KRS_TEXT",
    POSTAL_CODE: "PLZ",
    CITY: "ORT",
    STREET: "STRHSNR",
    ID: "DSTNR",
  },
  OFFER: {
    SCIENTIST_TITLE1: "Titel_1",
    SCIENTIST_TITLE2: "Titel_2",
    SCIENTIST_TITLE3: "Titel_3",
    SCIENTIST_SURNAME1: "Name_1",
    SCIENTIST_SURNAME2: "Name_2",
    SCIENTIST_SURNAME3: "Name_3",
    SCIENTIST_FORENAME1: "Vorname_1",
    SCIENTIST_FORENAME2: "Vorname_2",
    SCIENTIST_FORENAME3: "Vorname_3",
    SCIENTIST_IMAGE1: "Foto_1",
    SCIENTIST_IMAGE2: "Foto_2",
    SCIENTIST_IMAGE3: "Foto_3",
    
    INSTITUTION_LOGO: "Logo",
    INSTITUTION: "Institution",

    OFFER_ID: "ID",
    OFFER_CATEGORY1: "Thema_1",
    OFFER_CATEGORY2: "Thema_2",
    OFFER_CATEGORY3: "Thema_3",
    OFFER_CATEGORY4: "Thema_4",
    OFFER_CATEGORY5: "Thema_5",
    OFFER_TITLE: "Titel",
    OFFER_DESCRIPTION: "Kurzbeschreibung",
    OFFER_FORMAT: "Unterrichtsformat",
    OFFER_SUBJECT_COMMENT: "Besonders geeignet für das Schulfach...",
    OFFER_GRADE_MIN: "Klassenstufe_minimum",
    OFFER_GRADE_MAX: "Klassenstufe_maximum",
    OFFER_POSSIBLE_DAYS1: "Gewünschte(r) Einsatztag(e)_1",
    OFFER_POSSIBLE_DAYS2: "Gewünschte(r) Einsatztag(e)_2",
    OFFER_POSSIBLE_DAYS3: "Gewünschte(r) Einsatztag(e)_3",
    OFFER_POSSIBLE_DAYS4: "Gewünschte(r) Einsatztag(e)_4",
    OFFER_POSSIBLE_DAYS5: "Gewünschte(r) Einsatztag(e)_5",
    OFFER_MAX_DEPLOYMENTS: "Wie oft möchten Sie maximal eingesetzt werden?",
    OFFER_DURATION: "Wie lange geht Ihre Unterrichtseinheit?",
    OFFER_TIMEWINDOW_1: "Gewünschtes Zeitfenster_1",
    OFFER_TIMEWINDOW_2: "Gewünschtes Zeitfenster_2",
    OFFER_POSSIBLE_LOCATION1: "Gewünschter Einsatzort_1",
    OFFER_POSSIBLE_LOCATION2: "Gewünschter Einsatzort_2",
    OFFER_POSSIBLE_LOCATION3: "Gewünschter Einsatzort_3",
    OFFER_ROOM_REQUIREMENTS: "Spezieller Raum / Sonstiges",
    OFFER_EQUIPMENT_REQUIREMENTS: "Organisatorische Anforderungen",
    OFFER_CLASS_PREP: "Nötige Vorbereitung der Schulklasse",
    OFFER_EXTRA_COMMENT: "Extra Informationen",
    OFFER_SUBJECT: "Fachbereich",
    OFFER_CONTACT_NAME: "Ansprechpartner*in",
    OFFER_CONTACT_EMAIL: "Ansprechpartner*in E-Mail",
    OFFER_CONTACT_PHONE: "Ansprechpartner*in Telefon",



  }
};


interface Scientist {
    title: string,
    forename: string,
    surname: string,
    image: string,
}

const getScientistPK = (s: Pick<Scientist, "forename" | "surname">) => {
    return [s.forename, s.surname].join("/");
}

const parseScientistsFromRow = (row: any): Scientist[] => {
    const results: Scientist[] = [];

    if (row[CSV_KEYS.OFFER.SCIENTIST_SURNAME1] != null && row[CSV_KEYS.OFFER.SCIENTIST_SURNAME1].length > 0) {
        const s1: Scientist = {
            title: row[CSV_KEYS.OFFER.SCIENTIST_TITLE1],
            forename: row[CSV_KEYS.OFFER.SCIENTIST_FORENAME1],
            surname: row[CSV_KEYS.OFFER.SCIENTIST_SURNAME1],
            image: row[CSV_KEYS.OFFER.SCIENTIST_IMAGE1] || null,
        };
        results.push(s1);
    }

    if (row[CSV_KEYS.OFFER.SCIENTIST_SURNAME2] != null && row[CSV_KEYS.OFFER.SCIENTIST_SURNAME2].length > 0) {
        const s: Scientist = {
            title: row[CSV_KEYS.OFFER.SCIENTIST_TITLE2],
            forename: row[CSV_KEYS.OFFER.SCIENTIST_FORENAME2],
            surname: row[CSV_KEYS.OFFER.SCIENTIST_SURNAME2],
            image: row[CSV_KEYS.OFFER.SCIENTIST_IMAGE2] || null,
        };
        results.push(s);
    }

    if (row[CSV_KEYS.OFFER.SCIENTIST_SURNAME3] != null && row[CSV_KEYS.OFFER.SCIENTIST_SURNAME3].length > 0) {
        const s: Scientist = {
            title: row[CSV_KEYS.OFFER.SCIENTIST_TITLE3],
            forename: row[CSV_KEYS.OFFER.SCIENTIST_FORENAME3],
            surname: row[CSV_KEYS.OFFER.SCIENTIST_SURNAME3],
            image: row[CSV_KEYS.OFFER.SCIENTIST_IMAGE3] || null,
        };
        results.push(s);
    }

    if (results.find(r => r.surname === "Liefke")) 
      console.log(row,  results);

    return results;
};

const parseOfferFromRow = (row: any): ScientistOffer_insert_input | null => {

    if (!(CSV_KEYS.OFFER.OFFER_ID in row) && row[CSV_KEYS.OFFER.OFFER_ID].length > 0) {
        return null;
    }

    const cats = [
        CSV_KEYS.OFFER.OFFER_CATEGORY1,
        CSV_KEYS.OFFER.OFFER_CATEGORY2,
        CSV_KEYS.OFFER.OFFER_CATEGORY3,
        CSV_KEYS.OFFER.OFFER_CATEGORY4,
        CSV_KEYS.OFFER.OFFER_CATEGORY5
    ];

    const days = [
        CSV_KEYS.OFFER.OFFER_POSSIBLE_DAYS1,
        CSV_KEYS.OFFER.OFFER_POSSIBLE_DAYS2,
        CSV_KEYS.OFFER.OFFER_POSSIBLE_DAYS3,
        CSV_KEYS.OFFER.OFFER_POSSIBLE_DAYS4,
        CSV_KEYS.OFFER.OFFER_POSSIBLE_DAYS5,
    ];

    const mapDayValue = (dayString: string) => {
        if (dayString == null) return null;
        
        if (dayString.includes("Montag")) {
            return 1;
        } else if (dayString.includes("Dienstag")) {
            return 2;
        } else if (dayString.includes("Mittwoch")) {
            return 3;
        } else if (dayString.includes("Donnerstag")) {
            return 4;
        } else if (dayString.includes("Freitag")) {
            return 5;
        }
        return null;
    }

    const twindows = [
        CSV_KEYS.OFFER.OFFER_TIMEWINDOW_1,
        CSV_KEYS.OFFER.OFFER_TIMEWINDOW_2,
    ];

    const locs = [
        CSV_KEYS.OFFER.OFFER_POSSIBLE_LOCATION1,
        CSV_KEYS.OFFER.OFFER_POSSIBLE_LOCATION2,
        CSV_KEYS.OFFER.OFFER_POSSIBLE_LOCATION3,
    ]

    const result: ScientistOffer_insert_input = {
        id: Number(row[CSV_KEYS.OFFER.OFFER_ID]),
        format: row[CSV_KEYS.OFFER.OFFER_FORMAT] || "",
        minimumGrade: Number(row[CSV_KEYS.OFFER.OFFER_GRADE_MIN]) || 1,
        maximumGrade: Number(row[CSV_KEYS.OFFER.OFFER_GRADE_MAX]) || 13,
        possibleDays: days.map(d => mapDayValue(row[d])).filter(d => d != null) as number[],
        timeWindow: twindows.map(t => row[t]).filter(x => x != null && x.length > 0),
        maxDeployments: Number(row[CSV_KEYS.OFFER.OFFER_MAX_DEPLOYMENTS]) || 1,
        possibleLocations: locs.map(l => row[l]).filter(x => x != null && x.length > 0),
        equipmentRequired: row[CSV_KEYS.OFFER.OFFER_EQUIPMENT_REQUIREMENTS] || "",
        roomRequirements: row[CSV_KEYS.OFFER.OFFER_ROOM_REQUIREMENTS] || "",
        title: row[CSV_KEYS.OFFER.OFFER_TITLE] || "Title missing",
        description: row[CSV_KEYS.OFFER.OFFER_DESCRIPTION] || "Description missing",
        duration: row[CSV_KEYS.OFFER.OFFER_DURATION] || "keine Angabe",
        extraComment: row[CSV_KEYS.OFFER.OFFER_EXTRA_COMMENT] || "",
        subjectComment: row[CSV_KEYS.OFFER.OFFER_SUBJECT_COMMENT] || "alle",
        classPreparation: row[CSV_KEYS.OFFER.OFFER_CLASS_PREP] || "keine",
        institutionName: row[CSV_KEYS.OFFER.INSTITUTION] || "",
        institutionLogo: row[CSV_KEYS.OFFER.INSTITUTION_LOGO] || "",
        categories: cats.map(c => row[c]).filter(c => c != null && c.length > 0),
        contactEmail: row[CSV_KEYS.OFFER.OFFER_CONTACT_EMAIL] || "keine Angabe",
        contactPhone: row[CSV_KEYS.OFFER.OFFER_CONTACT_PHONE] || "keine Angabe",
        contactName: row[CSV_KEYS.OFFER.OFFER_CONTACT_NAME] || "keine Angabe",
        researchSubject: row[CSV_KEYS.OFFER.OFFER_SUBJECT],
    };

    return result;
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

const ProgramsPage: FC = () => {
  const isAdmin = useIsAdmin();

  const schoolCsvUploadRef: MutableRefObject<any> = useRef(null);
  const handleSchoolUploadClick = useCallback(() => {
    schoolCsvUploadRef.current?.click();
  }, [schoolCsvUploadRef]);

  const [upsertSchools] = useAdminMutation<
    UpsertSchools,
    UpsertSchoolsVariables
  >(UPSERT_SCHOOLS);

  const [upsertScientists] = useAdminMutation<
    UpsertScientists,
    UpsertScientistsVariables
  >(UPSERT_SCIENTISTS);

  const [upsertOffers] = useAdminMutation<
    UpsertScientistOffers,
    UpsertScientistOffersVariables
  >(UPSERT_SCIENTIST_OFFER);

  const [deleteScientistOfferRelations] = useAdminMutation<
    DeleteScientistOfferRelations,
    DeleteScientistOfferRelationsVariables
  >(DELETE_SCIENTIST_OFFER_RELATIONS);

  const [insertScientistOfferRelations] = useAdminMutation<
    InsertScientistOfferRelations,
    InsertScientistOfferRelationsVariables
  >(INSERT_SCIENTIST_OFFER_RELATIONS);


  const offerCsvUploadRef: MutableRefObject<any> = useRef(null);
  const handleOfferCsvUploadClick = useCallback(() => {
        offerCsvUploadRef.current?.click();
  }, [offerCsvUploadRef]);

  const configQuery = useAuthedQuery<QueryActiveProgramId>(
    QUERY_ACTIVE_PROGRAM_ID
  );

  const allScientistsQuery = useQuery<AllScientists>(
    ALL_SCIENTISTS
  );

  const handleUploadSchoolCsv = useCallback(
    async (event: any) => {
      const rows = await parseCsvFileUploadEvent(event);
      if (rows != null && rows.length > 0) {
        console.log(
          "default program id is",
          configQuery.data?.RentAScientistConfig_by_pk?.program_id
        );

        const candidates: Record<string, School_insert_input> = {};

        for (const row of rows) {
          const name = row[CSV_KEYS.SCHOOL.NAME1] + " " + row[CSV_KEYS.SCHOOL.NAME2];
          const schoolType = row[CSV_KEYS.SCHOOL.TYPE];
          const district = row[CSV_KEYS.SCHOOL.DISTRICT];
          const street = row[CSV_KEYS.SCHOOL.STREET];
          const postalCode = row[CSV_KEYS.SCHOOL.POSTAL_CODE];
          const city = row[CSV_KEYS.SCHOOL.CITY];
          const dstnr = row[CSV_KEYS.SCHOOL.ID];

          const candidate = {
            name,
            schoolType,
            district,
            street,
            postalCode,
            city,
            dstnr,
          };

          // careful: some school exist twice under the same dstnr, they differ in columns unimportant to us
          // but they might be important down the road?
          candidates[dstnr] = {
            ...candidate,
          };
        }

        const objects = Object.values(candidates).filter(
          (x) => x.dstnr != null
        );

        const response = await upsertSchools({
          variables: {
            objects,
          },
        });
        if (response.errors) {
          console.log(response.errors);
          // eslint-disable-next-line
          alert("Es gab einen Fehler: " + response.errors);
        } else {
          // eslint-disable-next-line
          alert(objects.length + " Schulen wurden geupdatet");
        }
      }
    },
    [upsertSchools, configQuery]
  );

  const handleUploadOfferCsv = useCallback(
    async (event: any) => {
        const rows = await parseCsvFileUploadEvent(event);
        const currentProgramId = configQuery.data?.RentAScientistConfig_by_pk?.program_id;

        const allScientists = allScientistsQuery.data?.Scientist || [];
        const knownScientists: Record<string, AllScientists_Scientist> = {};
        for (const as of allScientists) {
          knownScientists[getScientistPK(as)] = as;
        }

        if (rows != null && rows.length > 0) {
            // do it like this
            // figure out the list of scientists
            // figure out the list of offers
            // delete all old relations of the offers
            // insert the new relations between scientists/offer


            const newScientists: Record<string, Scientist_insert_input> = {};
            const updateScientists: Record<string, Scientist_insert_input> = {};

            for (const row of rows) {
                const scs = parseScientistsFromRow(row);
                for (const sc of scs) {
                    const skey = getScientistPK(sc);
                    const prevScientist = knownScientists[skey];
                    if (prevScientist != null) {
                        updateScientists[skey] = {
                          ...{
                            id: prevScientist.id,
                            forename: prevScientist.forename,
                            surname: prevScientist.surname,
                            image: prevScientist.image,
                            title: prevScientist.title
                          },
                          ...sc,
                        };
                    } else {
                      newScientists[skey] = sc;
                    }
                }
            }

            const upsertScientistsInput = [...Object.values(newScientists), ...Object.values(updateScientists)];
            console.log("upsert scientists", upsertScientistsInput);

            const scientistIdMapping: Record<string, number> = {};

            const responseScientists = await upsertScientists({
              variables: {
                objects: upsertScientistsInput
              }
            });
            if (responseScientists.errors != null) {
              console.log(responseScientists.errors);
              // eslint-disable-next-line
              alert("Fehler beim Scientist Upsert: " + responseScientists.errors);
            } else {
              console.log("response upsert scientists", responseScientists.data);
              if (responseScientists.data != null) {
                for (let i = 0; i < upsertScientistsInput.length; i++) {
                  const respId = responseScientists.data.insert_Scientist?.returning[i].id;
                  const fname = upsertScientistsInput[i].forename;
                  const sname = upsertScientistsInput[i].surname;
                  if (respId != null && fname != null && sname != null) {
                    scientistIdMapping[getScientistPK({forename: fname, surname: sname})] = respId;
                  }
                }
              }
            }

            const offers: Record<number, ScientistOffer_insert_input> = {};
            // offer id -> list of scientist ids
            const offerScientists: Record<number, number[]> = {};

            for(const row of rows) {

              const scs = parseScientistsFromRow(row);
              const scientistIds = scs.map(s => scientistIdMapping[getScientistPK(s)]).filter(x => x != null);

              const offer = parseOfferFromRow(row);
              if (offer != null && offer.id != null && offer.id != 0) {
                  offers[offer.id] = offer;
                  offer.programId = currentProgramId;
                  offerScientists[offer.id] = scientistIds;
              }
            }

            // Hack the arrays to be inserted as strings in array literal format
            // because that is the best hasura can do...
            // https://stackoverflow.com/a/71442250
            const hackStringArrayValues = (xs: any[]) => "{"+xs.map((x: any) => ""+x+"").join(",")+"}";
            const hackNumberArrayValues = (xs: any[]) => "{"+xs.join(",")+"}";
            const upsertOffersInput: any = [...Object.values(offers)].map(o => {
              return {
                ...o,
                categories: hackStringArrayValues(o.categories),
                possibleDays: hackNumberArrayValues(o.possibleDays),
                timeWindow: hackStringArrayValues(o.timeWindow),
                possibleLocations: hackStringArrayValues(o.possibleLocations)
              }
            });
            console.log("upsert offers", upsertOffersInput);

            const responseOffers = await upsertOffers({
              variables: {
                objects: upsertOffersInput
              }
            });
            if (responseOffers.errors != null) {
              console.log(responseOffers.errors);
              // eslint-disable-next-line
              alert("Fehler beim Scientist Upsert: " + responseOffers.errors);
            } else {
              console.log("response upsert offers", responseOffers.data);
            }

            console.log("offer -> scientist rels", offerScientists);

            const seenOfferIds = Object.keys(offerScientists).map(Number);
            console.log("delete previous offer links");

            const deleteResponse = await deleteScientistOfferRelations({
              variables: {
                ids: seenOfferIds
              }
            });
            if (deleteResponse.errors != null) {
              console.log(deleteResponse.errors);
              // eslint-disable-next-line
              alert("Fehler beim Scientist Offer Relation delete: " + deleteResponse.errors);
            }  else {
              console.log("deleted old relations", deleteResponse.data);
            }

            const newRelations: ScientistOfferRelation_insert_input[] = [];
            for (const offerId of seenOfferIds) {
              const relatedScientists = offerScientists[offerId];
              for (const scientistId of relatedScientists) {
                newRelations.push({
                  offerId,
                  scientistId
                });
              }
            }

            const insertRelationsResponse = await insertScientistOfferRelations({
              variables: {
                objects: newRelations
              }
            });
            if (insertRelationsResponse.errors != null) {
              console.log(insertRelationsResponse.errors);
              // eslint-disable-next-line
              alert("Fehler beim Scientist Offer Relation insert: " + insertRelationsResponse.errors);
            } else {
              console.log("inserted relations", insertRelationsResponse.data);

              alert("Import completed!");
            }
            
        }

    },
    [configQuery, allScientistsQuery, upsertScientists, upsertOffers, deleteScientistOfferRelations, insertScientistOfferRelations]
  );


  return (
    <>
      <Head>
        <title>Rent-A-Scientist</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        {isAdmin && (
          <>
            <h1 className="text-xl font-bold">Liste der Schulen</h1>
            <div>
              Bitte die Schulen in einer csv Datei formattiert hochladen. Es
              müssen folgende Header vorhanden sein:
              <div className="text-xs">
              {Object.values(CSV_KEYS.SCHOOL).join(", ")}
              </div>
              
            </div>
            <div>
              Hochladen
              <IconButton onClick={handleSchoolUploadClick}>
                <MdUpload />
              </IconButton>
              <input
                ref={schoolCsvUploadRef}
                onChange={handleUploadSchoolCsv}
                className="hidden"
                type="file"
              />
            </div>
            <div>TODO: Schulen suche component hier?!</div>


            <h1 className="text-xl font-bold">Liste der Angebote</h1>
            <div>
                Bitte die Liste der Angebote der Wissenschaftler als csv hochladen.
                Es müssen folgende Header vorhanden sein:
                <div className="text-xs">
                {Object.values(CSV_KEYS.OFFER).map(x => "'"+x+"'").join(", ")}
                </div>
            </div>
            <div>
                Hochladen
                <IconButton onClick={handleOfferCsvUploadClick}>
                    <MdUpload />
                </IconButton>
                <input 
                    ref={offerCsvUploadRef}
                    onChange={handleUploadOfferCsv}
                    className="hidden"
                    type="file"
                />
            </div>
          </>
        )}

        {!isAdmin && <>Sie sind kein Admin!</>}
      </Page>
    </>
  );
};

export default ProgramsPage;
