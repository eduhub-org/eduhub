import { useMutation } from "@apollo/client";
import { Button } from "@material-ui/core";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC, useCallback, useEffect, useState } from "react";
import { ClientOnly } from "../components/common/ClientOnly";
import { OnlyLoggedIn } from "../components/common/OnlyLoggedIn";
import { OnlyLoggedOut } from "../components/common/OnlyLoggedOut";
import { RegisterButton } from "../components/LoginButton";
import { MyRequestsDisplay } from "../components/MyRequestsDisplay";

import { Page } from "../components/Page";
import {
  SchoolClassRequestSummary,
  SchoolClassRequestsSummary,
} from "../components/teacher/SchoolClassRequestsSummary";
import { useRoleMutation } from "../hooks/authedMutation";
import { useUserQuery } from "../hooks/authedQuery";
import { UPDATE_USER } from "../hooks/authentication";
import { useRasConfig } from "../hooks/ras";
import { useKeycloakUserProfile, useUserId } from "../hooks/user";
import { RSAConfig } from "../queries/ras_config";
import {
  INSERT_CLASS_REQUESTS,
  INSERT_MY_TEACHER,
  INSERT_SCHOOL_CLASS,
  MY_TEACHER,
} from "../queries/ras_teacher";
import {
  InsertClassRequests,
  InsertClassRequestsVariables,
} from "../queries/__generated__/InsertClassRequests";
import {
  InsertMyTeacher,
  InsertMyTeacherVariables,
} from "../queries/__generated__/InsertMyTeacher";
import {
  InsertSchoolClass,
  InsertSchoolClassVariables,
} from "../queries/__generated__/InsertSchoolClass";
import { MyTeacher } from "../queries/__generated__/MyTeacher";
import { SchoolClassRequest_insert_input } from "../__generated__/globalTypes";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

const getPendingRequest = () => {
  if (typeof localStorage !== "undefined") { // eslint-disable-line
    return JSON.parse(localStorage.getItem("pendingRequest") || "null"); // eslint-disable-line
  } else {
    return null;
  }
};

const getPendingRequestSummary = (rsaConfig: RSAConfig) => {
  const pendingRequest = getPendingRequest();
  if (pendingRequest == null || rsaConfig.start == null) {
    return null;
  }

  const result: SchoolClassRequestSummary = {
    requestId: new Date(pendingRequest.now).getTime(),
    grade: pendingRequest.grade,
    startDate: rsaConfig.start,
    offerTimeComments: "",
    offerGeneralComments: "",
    contact: "",
    schoolClassName: "",
    studentsCount: 0,
    offers: pendingRequest.offers,
    schoolDstNr: pendingRequest.school.dstnr,
    schoolClassId: -1,
    assignedDays: {},
  };

  return result;
};

const RegisterPage: FC = () => {
  const rsaConfig = useRasConfig();

  const [updateUser, { data, error }] = useMutation(UPDATE_USER);

  console.log("updateUser", new Date().toISOString(), data, error);

  const pendingRequest = getPendingRequest();

  const keyCloakProfile = useKeycloakUserProfile();
  const myUserId = useUserId();

  const myTeacher = useUserQuery<MyTeacher>(MY_TEACHER);

  console.log("myTeacher", myTeacher.data);
  console.log("myUserId", myUserId);
  console.log("keyCloakProfile", keyCloakProfile);
  console.log("peningRequest", pendingRequest);

  const [insertMyTeacher, insertResponses] = useRoleMutation<
    InsertMyTeacher,
    InsertMyTeacherVariables
  >(INSERT_MY_TEACHER, {
    context: {
      role: "user",
    },
  });

  const [insertSchoolClass] = useRoleMutation<
    InsertSchoolClass,
    InsertSchoolClassVariables
  >(INSERT_SCHOOL_CLASS, {
    context: {
      role: "user",
    },
  });

  const [insertClassRequests] = useRoleMutation<
    InsertClassRequests,
    InsertClassRequestsVariables
  >(INSERT_CLASS_REQUESTS, {
    context: {
      role: "user",
    },
  });

  console.log("insertResponses", insertResponses);

  useEffect(() => {
    if (!myTeacher.loading && myUserId != null) {
      const me = myTeacher.data?.Teacher;
      if (me != null && me.length == 0) { // eslint-disable-line
        console.log(
          "try to insert my teacher object, had no teacher object",
          myTeacher,
          new Date().toISOString()
        );

        // there is a race condition against the other updateUser call ...
        updateUser({ variables: { id: myUserId } }).finally(() => {
          console.log(
            "update user seems to be completed now?!",
            new Date().toISOString()
          );
          console.log("insertMyTeacher!", new Date().toISOString());
          insertMyTeacher({
            variables: {
              myUserId,
            },
          })
            .then((resp) => {
              console.log("inserted teacher!", resp);
              myTeacher.refetch();
            })
            .catch((cerror) => {
              console.log(
                "teacher insertion error",
                new Date().toISOString(),
                cerror
              );

              if (
                cerror.message != null &&
                cerror.message.indexOf != null &&
                cerror.message.indexOf("Teacher_userId_fkey") !== -1
              ) {
                setTimeout(() => {
                  console.log(
                    "do a full page reload out of desparation due to the race condition problem...",
                    new Date().toISOString()
                  );
                  location.reload(); //eslint-disable-line
                }, 3000);
              }
            });
        });
      } else {
        console.log("There already is a teacher object for me!", me);
      }
    }
  }, [myTeacher.data, myUserId, insertMyTeacher, myTeacher, updateUser]);

  console.log("keycloak profile is", keyCloakProfile);

  const [pendingRequestSummary, setPendingRequestSummary] = useState(
    getPendingRequestSummary(rsaConfig)
  );

  if (pendingRequestSummary == null) {
    const nextSummary = getPendingRequestSummary(rsaConfig);
    if (nextSummary != null) {
      setPendingRequestSummary(nextSummary);
    }
  }

  const handleUpdateGeneralComment = useCallback(
    (offerId: number, comment: string) => {
      if (pendingRequestSummary != null) {
        setPendingRequestSummary({
          ...pendingRequestSummary,
          offerGeneralComments: {
            ...pendingRequestSummary.offerGeneralComments,
            [offerId]: comment,
          },
        });
      }
    },
    [pendingRequestSummary, setPendingRequestSummary]
  );

  const handleUpdateTimeComment = useCallback(
    (offerId: number, comment: string) => {
      if (pendingRequestSummary != null) {
        setPendingRequestSummary({
          ...pendingRequestSummary,
          offerTimeComments: {
            ...pendingRequestSummary.offerTimeComments,
            [offerId]: comment,
          },
        });
      }
    },
    [pendingRequestSummary, setPendingRequestSummary]
  );

  const handleUpdateSchoolClassName = useCallback(
    (name: string) => {
      if (pendingRequestSummary != null) {
        setPendingRequestSummary({
          ...pendingRequestSummary,
          schoolClassName: name,
        });
      }
    },
    [pendingRequestSummary, setPendingRequestSummary]
  );

  const handleUpdateStudentsCount = useCallback(
    (count: number) => {
      if (pendingRequestSummary != null) {
        setPendingRequestSummary({
          ...pendingRequestSummary,
          studentsCount: count,
        });
      }
    },
    [pendingRequestSummary, setPendingRequestSummary]
  );

    const handleUpdateContact = useCallback(
      (contact: string) => {
        if (pendingRequestSummary != null) {
          setPendingRequestSummary({
            ...pendingRequestSummary,
            contact
          })
        }
      },
      [pendingRequestSummary, setPendingRequestSummary]
    );

  const handleStorePendingRequest = useCallback(async () => {
    const myTeacherId = myTeacher.data?.Teacher[0].id;

    if (pendingRequestSummary != null && myTeacherId != null) {
      if (pendingRequestSummary.contact === null || pendingRequestSummary.contact === undefined || pendingRequestSummary.contact.length === 0) {
        alert("Bitte tragen Sie eine Kontakttelefonnummer ein!"); // eslint-disable-line
        return;
      }

      if (pendingRequestSummary.studentsCount === null || pendingRequestSummary.studentsCount === undefined || pendingRequestSummary.studentsCount === 0) {
        alert("Bitte tragen Sie die Klassengröße ein!");
        return;
      }

      console.log("Store these requests", pendingRequestSummary);

      const insertClassResult = await insertSchoolClass({
        variables: {
          input: {
            name: pendingRequestSummary.schoolClassName,
            schoolId: pendingRequestSummary.schoolDstNr,
            teacherId: myTeacherId,
            grade: pendingRequestSummary.grade,
            contact: pendingRequestSummary.contact,
            studensCount: pendingRequestSummary.studentsCount,
          },
        },
      });

      // Hack the arrays to be inserted as strings in array literal format
      // because that is the best hasura can do...
      // https://stackoverflow.com/a/71442250
      const hackStringArrayValues = (xs: any[]) =>
        "{" + xs.map((x: any) => "" + x + "").join(",") + "}";

      const insertedClassId =
        insertClassResult.data?.insert_SchoolClass_one?.id;
      if (insertedClassId != null) {
        const requestInputs: SchoolClassRequest_insert_input[] = Object.keys(
          pendingRequestSummary.offers
        ).map((okey) => {
          const mapResult: SchoolClassRequest_insert_input = {
            classId: insertedClassId,
            offerId: Number(okey),
            possibleDays: hackStringArrayValues(
              pendingRequestSummary.offers[Number(okey)] || []
            ),
            commentTime: pendingRequestSummary.offerTimeComments[Number(okey)],
            commentGeneral:
              pendingRequestSummary.offerGeneralComments[Number(okey)],
          };
          return mapResult;
        });

        await insertClassRequests({
          variables: {
            inputs: requestInputs,
          },
        });

        localStorage.removeItem("pendingRequest"); // eslint-disable-line
        // reload the page so the MyRequestsDisplay shows the newest entries, cant access its refetch from here...
        window.location.reload();
      }
    }
  }, [
    pendingRequestSummary,
    insertSchoolClass,
    myTeacher,
    insertClassRequests,
  ]);

  return (
    <>
      <Head>
        <title>Rent-A-Scientist</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        <ClientOnly>
          <OnlyLoggedOut>
            <div className="m-4">
              <div className="m-4">
                Bitte erstellen Sie einen Account. Nach der Registrierung können Sie dann mit Ihrer Auswahl weiterarbeiten.
                <br />
                Falls Sie schon einen Account haben melden Sie sich an.
              </div>
              <RegisterButton />
            </div>
          </OnlyLoggedOut>

          <OnlyLoggedIn>
            {pendingRequestSummary != null && (
              <>
                <div className="text-xl font-bold">
                  Sie melden eine Klasse für Rent-A-Scientist an
                </div>
                <div className="mb-10">
                  Bitte geben Sie Klassengröße und Klassenbezeichner (a, b, ...)
                  an. <br />
                  Sie können außerdem ein kurzes Kommentar bezüglich des besten
                  Zeitraums und eine kurze Nachricht für den Wissenschaftler
                  angeben.
                </div>

                <SchoolClassRequestsSummary
                  requestSummary={pendingRequestSummary}
                  onUpdateGeneralComment={handleUpdateGeneralComment}
                  onUpdateTimeComment={handleUpdateTimeComment}
                  onUpdateSchoolClassName={handleUpdateSchoolClassName}
                  onUpdateStudentsCount={handleUpdateStudentsCount}
                  onUpdateContact={handleUpdateContact}
                  className="m-2"
                />

                <Button onClick={handleStorePendingRequest} variant="contained">
                  Klasse anmelden
                </Button>

                <div className="mb-4" />
              </>
            )}

            {pendingRequestSummary == null && (
              <>
                <MyRequestsDisplay startDate={rsaConfig.start} />
              </>
            )}
          </OnlyLoggedIn>
        </ClientOnly>
      </Page>
    </>
  );
};

export default RegisterPage;
