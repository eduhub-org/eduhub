import { FC, useCallback, useMemo, useState } from "react";
import { useRasConfig } from "../../hooks/ras";

import { Solve } from "@bygdle/javascript-lp-solver";
import { useAuthedQuery } from "../../hooks/authedQuery";
import {
  AllRequests,
  AllRequests_SchoolClassRequest_SchoolClass,
  AllRequests_SchoolClassRequest_SchoolClass_School,
} from "../../queries/__generated__/AllRequests";
import {
  ALL_REQUESTS,
  BATCH_INSERT_MAIL_LOG,
  HIDE_PROGRAM,
  SCHOOLS_MAILS_INFO,
  SCIENTIST_MAILS_INFO,
  UPDATE_ASSIGNMENTS,
} from "../../queries/ras_matching";
import { Button, IconButton } from "@material-ui/core";
import { MdPlusOne } from "react-icons/md";
import { IoMdTrash } from "react-icons/io";
import { assertNullableType } from "graphql";
import {
  identityEventMapper,
  useAdminMutation,
} from "../../hooks/authedMutation";
import {
  HideProgramById,
  HideProgramByIdVariables,
} from "../../queries/__generated__/HideProgramById";
import {
  UpdateAssignments,
  UpdateAssignmentsVariables,
} from "../../queries/__generated__/UpdateAssignments";
import {
  MailLog_insert_input,
  SchoolClassRequest_insert_input,
} from "../../__generated__/globalTypes";
import { AllScientistOffers } from "../../queries/__generated__/AllScientistOffers";
import { ALL_OFFERS } from "../../queries/ras_offer";
import {
  MailDescription,
  ScientistSingleAcceptedInfo,
  createAcceptSchool,
  createAcceptScientist,
  createRejectSchool,
  createRejectScientist,
} from "./mail";
import {
  SchoolsMailsInfo,
  SchoolsMailsInfoVariables,
  SchoolsMailsInfo_SchoolClassRequest,
} from "../../queries/__generated__/SchoolsMailsInfo";
import {
  ScientistMailInfos,
  ScientistMailInfosVariables,
} from "../../queries/__generated__/ScientistMailInfos";
import { dayFormat } from "../MultiDateDisplay";
import {
  BatchInsertMail,
  BatchInsertMailVariables,
} from "../../queries/__generated__/BatchInsertMail";

interface CourseOffer {
  days: number[];
  maxDays: number;
  id: number;
}

interface ClassRequest {
  offerId: number;
  days: number[];
  classId: number;
}

interface AssignmentResult {
  classId: number;
  day: number;
  offerId: number;
}

const solveMatching = (
  offers: CourseOffer[],
  requests: ClassRequest[],
  forceAssignments: AssignmentResult[]
) => {
  // you could shuffle to get some other solution
  // offers = _.shuffle(offers);
  // requests = _.shuffle(requests);

  const variables: any = {};
  const ints: any = {};
  for (const request of requests) {
    for (const rday of request.days) {
      const vname = "c" + request.classId + "o" + request.offerId + "d" + rday;
      variables[vname] = {
        matches: 1,
        ["o" + request.offerId + "capacity"]: 1,
        ["o" + request.offerId + "d" + rday]: 1,
        ["class" + request.classId + "capacity"]: 1,
        [vname]: 1,
      };
      ints[vname] = 1;
    }
  }

  // constraints for each offer-maxDays!
  // constraints for each offer-day to prevent assignment of more than 1 class per day
  // constraints for each class: should only get exactly one assignment

  const constraints: any = {};
  for (const offer of offers) {
    constraints["o" + offer.id + "capacity"] = { max: offer.maxDays };
    for (const oday of offer.days) {
      constraints["o" + offer.id + "d" + oday] = { max: 1 };
    }
  }

  // constraints for forced assignments, if any
  for (const fa of forceAssignments) {
    constraints["c" + fa.classId + "o" + fa.offerId + "d" + fa.day] = {
      min: 1,
    };
  }

  const cids: any = {};
  for (const cid of requests.map((r) => r.classId)) {
    cids[cid] = true;
  }

  for (const cid of Object.keys(cids)) {
    constraints["class" + cid + "capacity"] = { max: 1 };
  }

  const model: any = {
    optimize: "matches",
    opType: "max",
    constraints,
    variables,
    ints,
  };

  console.log("model", model);

  const solution = Solve(model);

  console.log("solution", solution);

  if (solution.feasible) {
    const allPossibleAssignments = Object.keys(variables);
    const resultAssignments: AssignmentResult[] = [];

    for (const possibleAssignment of allPossibleAssignments) {
      if (solution[possibleAssignment] === 1) {
        const [_empty, classStr, offerStr, dayStr] = possibleAssignment.split(
          /[cod]/
        );
        resultAssignments.push({
          classId: Number(classStr),
          day: Number(dayStr),
          offerId: Number(offerStr),
        });
      }
    }

    return resultAssignments;
  } else {
    return null;
  }
};

interface MatchingTableRowProps {
  classId: number;
  teacher: string;
  school: string;
  offerId: number;
  offerTitle: string;
  offerScientist: string;
  day: number;
}

export const MatchingTableRow: FC<MatchingTableRowProps> = (row) => {
  return (
    <tr>
      <td>{row.classId}</td>
      <td>{row.offerId}</td>
      <td>{row.day}</td>
      <td>{row.teacher}</td>
      <td>{row.school}</td>

      <td>{row.offerTitle}</td>
      <td>{row.offerScientist}</td>
    </tr>
  );
};

export const MatchingCreation: FC = () => {
  const rsaConfig = useRasConfig();

  const allRequests = useAuthedQuery<AllRequests>(ALL_REQUESTS);

  const scientistMailsInfo = useAuthedQuery<
    ScientistMailInfos,
    ScientistMailInfosVariables
  >(SCIENTIST_MAILS_INFO, {
    variables: {
      pid: rsaConfig.programId,
    },
  });

  const schoolsMailsInfo = useAuthedQuery<
    SchoolsMailsInfo,
    SchoolsMailsInfoVariables
  >(SCHOOLS_MAILS_INFO, {
    variables: {
      pid: rsaConfig.programId,
    },
  });

  const [forcedAssignmentsTxt, setForcedAssignmentsTxt] = useState("");

  const [matchings, setMatchings] = useState<AssignmentResult[] | null>(null);

  const runMatching = useCallback(async () => {
    const newData = (
      await allRequests.refetch()
    ).data.SchoolClassRequest.filter(
      (r) => r.ScientistOffer.Program.id === rsaConfig.programId
    );

    const hasOfferIds = new Set<number>();
    const offers: CourseOffer[] = [];

    for (const nd of newData) {
      if (!hasOfferIds.has(nd.ScientistOffer.id)) {
        offers.push({
          id: nd.ScientistOffer.id,
          days: nd.ScientistOffer.possibleDays,
          maxDays: nd.ScientistOffer.maxDeployments,
        });
      }
    }

    const requests: ClassRequest[] = newData.map((nd) => ({
      classId: nd.SchoolClass.id,
      offerId: nd.ScientistOffer.id,
      days: nd.possibleDays,
    }));

    console.log("build solver input data", offers, requests);

    const forcedAssignments: AssignmentResult[] = forcedAssignmentsTxt
      .trim()
      .split("\n")
      .map((farow) => {
        const [c, o, d] = farow.trim().split("=");
        const result: AssignmentResult = {
          classId: Number(c),
          day: Number(d),
          offerId: Number(o),
        };
        return result;
      })
      .filter(
        (x) =>
          !Number.isNaN(x.classId) &&
          !Number.isNaN(x.day) &&
          !Number.isNaN(x.offerId)
      );

    console.log("Forced assignments are", forcedAssignments);

    const solution = solveMatching(offers, requests, forcedAssignments);

    console.log(solution);

    if (solution === null) {
      alert("Matching ist nicht möglich!"); // eslint-disable-line
    }

    setMatchings(solution);
  }, [allRequests, forcedAssignmentsTxt, setMatchings, rsaConfig]);

  const handleSetFATxt = useCallback(
    (event) => {
      setForcedAssignmentsTxt(event.target.value);
    },
    [setForcedAssignmentsTxt]
  );

  const requestsRecords = useMemo(() => {
    const offerTitles: Record<number, string> = {};
    const offerScientists: Record<number, string> = {};
    const schools: Record<number, string> = {};

    const teachers: Record<number, string> = {};
    const requestsReverse: Record<string, number> = {};

    const list = (allRequests.data?.SchoolClassRequest || []).filter(
      (r) => r.ScientistOffer.Program.id === rsaConfig.programId
    );

    for (const scr of list) {
      offerTitles[scr.ScientistOffer.id] = scr.ScientistOffer.title;
      offerScientists[scr.ScientistOffer.id] =
        scr.ScientistOffer.contactName || "";
      schools[scr.SchoolClass.id] =
        scr.SchoolClass.School.name + "; " + scr.SchoolClass.School.city;
      teachers[scr.SchoolClass.id] =
        scr.SchoolClass.Teacher.User.firstName +
        " " +
        scr.SchoolClass.Teacher.User.lastName;
      requestsReverse[scr.SchoolClass.id + "/" + scr.ScientistOffer.id] =
        scr.id;
    }

    return {
      offerTitles,
      offerScientists,
      schools,
      teachers,
      requestsReverse,
      list,
    };
  }, [allRequests, rsaConfig]);

  const matchingTableData = useMemo(() => {
    if (matchings === null || matchings.length === 0) {
      return [];
    }

    const result = matchings.map((match) => {
      const r: MatchingTableRowProps = {
        classId: match.classId,
        day: match.day,
        offerId: match.offerId,
        offerScientist: requestsRecords.offerScientists[match.offerId],
        offerTitle: requestsRecords.offerTitles[match.offerId],
        school: requestsRecords.schools[match.classId],
        teacher: requestsRecords.teachers[match.classId],
      };
      return r;
    });

    result.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;

      return a.offerId - b.offerId;
    });

    return result;
  }, [matchings, requestsRecords]);

  const [hideProgramById] = useAdminMutation<
    HideProgramById,
    HideProgramByIdVariables
  >(HIDE_PROGRAM);
  const [updateAssignments] = useAdminMutation<
    UpdateAssignments,
    UpdateAssignmentsVariables
  >(UPDATE_ASSIGNMENTS);

  const [batchInsertMails] = useAdminMutation<
    BatchInsertMail,
    BatchInsertMailVariables
  >(BATCH_INSERT_MAIL_LOG);

  const handleFinalize = useCallback(async () => {
    let missedData = false;
    let allRequestIds = Object.values(requestsRecords.requestsReverse);
    const updates: SchoolClassRequest_insert_input[] = matchingTableData.map(
      (x) => {
        const requestId =
          requestsRecords.requestsReverse[x.classId + "/" + x.offerId];
        if (requestId !== null && requestId !== undefined) {
          allRequestIds = allRequestIds.filter((ari) => ari !== requestId);
          return {
            id: requestId,
            assigned_day: x.day,

            offerId: x.offerId,
            classId: x.classId,
            possibleDays: "{}",
          };
        } else {
          console.log("No request found for", x);
          missedData = true;
          return {};
        }
      }
    );

    for (const rem of allRequestIds) {
      updates.push({
        id: rem,
        assigned_day: -1,
        // These are only set to pass constraints checks.
        // This query will be an upsert and ignore these fields
        // if is is not an upsert it will fail because there is no class with id -1
        offerId: -1,
        classId: -1,
        possibleDays: "{}",
      });
    }

    updates.sort((a, b) => (a.id || 0) - (b.id || 0));

    console.log("updates", updates);

    if (!missedData) {
      const bccemail = prompt( // eslint-disable-line
        "Welche E-Mail soll für bcc verwendet werden? Nach dieser Eingabe wird das Matching finalisiert und die Anmeldung für weitere Schulen abgeschaltet!"
      );

      if (bccemail !== undefined && bccemail !== null && bccemail.length > 0) {
        await hideProgramById({
          variables: {
            id: rsaConfig.programId,
          },
        });

        await updateAssignments({
          variables: {
            objects: updates,
          },
        });

        const schoolsMails = await schoolsMailsInfo.refetch();
        const scientistMails = await scientistMailsInfo.refetch();

        console.log("schoolMailInfos", schoolsMails.data);
        console.log("scientistMailInfos", scientistMails.data);

        const mails: MailDescription[] = [];

        for (const so of scientistMails.data.ScientistOffer) {
          if (!so.contactName || !so.contactEmail) {
            continue;
          }

          const acceptedSchools = so.SchoolClassRequests.filter(
            (r) =>
              r.assigned_day !== -1 &&
              r.assigned_day !== null &&
              r.assigned_day !== undefined
          );
          if (acceptedSchools.length > 0) {
            const infos = acceptedSchools.map((as) => {
              if (as.assigned_day === null) {
                throw new Error("the filter should have prevented this!");
              }
              const ssai: ScientistSingleAcceptedInfo = {
                postalCode: as.SchoolClass.School.postalCode,
                city: as.SchoolClass.School.city,
                commentGeneral: as.commentGeneral || "",
                commentTime: as.commentTime || "",
                contact: [
                  as.SchoolClass.Teacher.User.firstName,
                  as.SchoolClass.Teacher.User.lastName,
                  as.SchoolClass.Teacher.User.email,
                  as.SchoolClass.contact || ""
                ].join(" "),
                day: dayFormat(as.assigned_day, rsaConfig.start),
                grade: as.SchoolClass.grade,
                schoolName: as.SchoolClass.School.name,
                street: as.SchoolClass.School.street,
                studentsCount: as.SchoolClass.studensCount,
              };
              return ssai;
            });
            mails.push(
              createAcceptScientist(so.contactName, so.contactEmail, infos)
            );
          } else {
            mails.push(createRejectScientist(so.contactName, so.contactEmail));
          }
        }

        const acceptedRequestByClass: Record<
          number,
          SchoolsMailsInfo_SchoolClassRequest
        > = {};

        for (const smail of schoolsMails.data.SchoolClassRequest) {
          const prev = acceptedRequestByClass[smail.SchoolClass.id];
          if (
            prev === null ||
            prev === undefined ||
            prev.assigned_day === null ||
            prev.assigned_day === undefined ||
            prev.assigned_day === -1
          ) {
            acceptedRequestByClass[smail.SchoolClass.id] = smail;
          }
        }

        for (const srequest of Object.values(acceptedRequestByClass)) {
          const cname =
            srequest.SchoolClass.Teacher.User.firstName +
            " " +
            srequest.SchoolClass.Teacher.User.lastName;
          if (srequest.assigned_day !== null && srequest.assigned_day > 0) {
            mails.push(
              createAcceptSchool(
                cname,
                srequest.SchoolClass.Teacher.User.email,
                {
                  classGrade: srequest.SchoolClass.grade+"",
                  className: srequest.SchoolClass.name,
                  contactEmail: srequest.ScientistOffer.contactEmail || "",
                  contactPhone: srequest.ScientistOffer.contactPhone || "",
                  day: dayFormat(srequest.assigned_day, rsaConfig.start),
                  scientist: srequest.ScientistOffer.contactName || "",
                  time: srequest.ScientistOffer.timeWindow.join(", "),
                  topic: srequest.ScientistOffer.title,
                }
              )
            );
          } else {
            mails.push(
              createRejectSchool(
                cname,
                srequest.SchoolClass.Teacher.User.email,
                srequest.SchoolClass.name,
                srequest.SchoolClass.grade
              )
            );
          }
        }

        const mailInserts: MailLog_insert_input[] = mails.map((mail) => ({
          to: rsaConfig.test_operation ? "ras@nanodesu.info" : mail.to,
          subject: mail.subject,
          bcc: bccemail,
          content: mail.content,
          from: rsaConfig.fromMail || "info@opencampus.sh",
        }));

        console.log("emails", mailInserts);

        await batchInsertMails({
          variables: {
            objects: mailInserts,
          },
        });

        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } else {
            alert("Es gibt ein technisches Problem"); // eslint-disable-line
    }
  }, [
    hideProgramById,
    updateAssignments,
    matchingTableData,
    rsaConfig,
    requestsRecords,
    schoolsMailsInfo,
    scientistMailsInfo,
    batchInsertMails,
  ]);

  return (
    <>
      <div>
        Erzwinge Zuweisungen. Texteingabe im Format: KlassenId=OfferId=Tag.{" "}
        <br />
        Zum Beispiel 22=2022003=4 um der Klasse mit ID 22 das Angebot mit ID
        2022003 am Tag 4 (Donnerstag) zuzuweisen.
        <br />
        Pro Zeile eine Zuweisung.
        <br />
        Die IDs können in der CSV mit den Anfragen per Excel eingesehen werden.
        <br />
        Es können keine Zuweisungen erzwungen werden für die es nicht auch eine
        Anfrage gab!
        <div>
          <textarea
            className="border"
            value={forcedAssignmentsTxt}
            onChange={handleSetFATxt}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <div>
          <Button variant="contained" onClick={runMatching}>
            Erzeuge Matchingvorschau
          </Button>
        </div>

        <div>
          {matchings !== null && (
            <Button onClick={handleFinalize} variant="contained">
              Matching finalisieren!
            </Button>
          )}
        </div>
      </div>

      {matchings !== null && (
        <>
          <div className="text-xl font-bold mt-6">Matchingvorschau</div>
          <table className="w-full mt-4">
            <tbody>
              <tr>
                <th>Klasse ID</th>
                <th>Angebot ID</th>
                <th>Tag</th>
                <th>Lehrer</th>
                <th>Schule</th>
                <th>Titel</th>
                <th>Wissenschaftler</th>
              </tr>

              {matchingTableData.map((td) => (
                <MatchingTableRow key={td.offerId + "/" + td.classId} {...td} />
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
};
