import { FC, useCallback, useMemo, useState } from "react";
import { useRasConfig } from "../../hooks/ras";

import { Solve } from "@bygdle/javascript-lp-solver";
import {
  AllRequests,
} from "../../queries/__generated__/AllRequests";
import {
  ALL_REQUESTS,
  BATCH_INSERT_MAIL_LOG,
  HIDE_PROGRAM,
  SCHOOLS_MAILS_INFO,
  SCIENTIST_MAILS_INFO,
  UPDATE_ASSIGNMENTS,
} from "../../queries/ras_matching";
import { Button } from "@material-ui/core";
import {
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
import { useAdminQuery } from "../../hooks/authedQuery";

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

function shuffle<T>(array: T[]) { //eslint-disable-line
  let currentIndex = array.length;
  let randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

const solveMatching = (
  offers: CourseOffer[],
  requests: ClassRequest[],
  forceAssignments: AssignmentResult[],
  maxAssignmentsPerClass: number
) => {
  requests = shuffle(requests);

  const variables: any = {};
  const ints: any = {};

  const seenClasses = new Set<number>();

  for (const request of requests) {
    for (const rday of request.days) {
      const vname = "c" + request.classId + "o" + request.offerId + "d" + rday;
      variables[vname] = {
        points: 1,
        ["o" + request.offerId + "capacity"]: 1,
        ["o" + request.offerId + "d" + rday]: 1,
        ["c" + request.classId + "bonus"]: 1,
        ["c" + request.classId + "o" + request.offerId]: 1,
        ["c" + request.classId + "d" + rday]: 1,
        ["c" + request.classId + "capacity"]: 1,
        [vname]: 1,
      };

      ints[vname] = 1;
    }

    if (!seenClasses.has(request.classId)) {
      seenClasses.add(request.classId);

      const vname = "c-bonus-" + request.classId;
      variables[vname] = {
        points: 10000, // this way the 10ks are the bonses taken, the smaller part of the result score will be the number of matches
        ["c" + request.classId + "bonus"]: -1,
        [vname]: 1,
      };

      ints[vname] = 1;
    }
  }

  const cids: any = {};
  for (const cid of requests.map((r) => r.classId)) {
    cids[cid] = true;
  }

  const constraints: any = {};
  for (const offer of offers) {
    // constraint for each offer-maxDays!
    constraints["o" + offer.id + "capacity"] = { max: offer.maxDays };

    for (const oday of offer.days) {
      // constraints for each offer-day to prevent assignment of more than 1 class per day
      constraints["o" + offer.id + "d" + oday] = { max: 1 };
    }

    for (const cid of Object.keys(cids)) {
      // constraint for each class: should not get the same assignment twice
      constraints["c" + cid + "o" + offer.id] = { max: 1 };

      // constraint for each class: only one offer assigned per day
      for (let i = 1; i <= 5; i++) {
        constraints["c" + cid + "d" + i] = { max: 1 };
      }
    }
  }

  // constraints for forced assignments, if any
  for (const fa of forceAssignments) {
    constraints["c" + fa.classId + "o" + fa.offerId + "d" + fa.day] = {
      min: 1,
    };
  }

  for (const cid of Object.keys(cids)) {
    // constraint: prevent taking the bonus points for a class that has not at least one request assigned to it
    constraints["c" + cid + "bonus"] = { min: 0 };

    // constaint: limit number of maximum assignments the classes can get at most
    constraints["c" + cid + "capacity"] = { max: maxAssignmentsPerClass };

    // constraint: every class bonus can only be given once
    constraints["c-bonus-" + cid] = { max: 1 };
  }

  const model: any = {
    optimize: "points",
    opType: "max",
    constraints,
    variables,
    ints,
  };

  console.log("model", model);

  const solution = Solve(model);

  console.log("solution", solution);

  if (solution.feasible) {
    const allPossibleAssignments = Object.keys(variables).filter(
      (x) => !x.includes("-bonus-")
    );

    const resultAssignments: AssignmentResult[] = [];

    for (const possibleAssignment of allPossibleAssignments) {
      if (solution[possibleAssignment] === 1) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const allRequests = useAdminQuery<AllRequests>(ALL_REQUESTS);

  const scientistMailsInfo = useAdminQuery<
    ScientistMailInfos,
    ScientistMailInfosVariables
  >(SCIENTIST_MAILS_INFO, {
    variables: {
      pid: rsaConfig.programId,
    },
  });

  const schoolsMailsInfo = useAdminQuery<
    SchoolsMailsInfo,
    SchoolsMailsInfoVariables
  >(SCHOOLS_MAILS_INFO, {
    variables: {
      pid: rsaConfig.programId,
    },
  });

  const [forcedAssignmentsTxt, setForcedAssignmentsTxt] = useState("");

  const [maxPerClass, setMaxPerClass] = useState<number>(1);

  const [matchings, setMatchings] = useState<AssignmentResult[] | null>(null);

  const runMatching = useCallback(async () => {
    const allRequestsResponse = await allRequests.refetch()

    console.log("allRequestsResponse", allRequestsResponse);

    const newData = allRequestsResponse.data.SchoolClassRequest.filter(
      (r) => r.ScientistOffer.Program.id === rsaConfig.programId
    );

    console.log("newData", newData);

    const hasOfferIds = new Set<number>();
    const offers: CourseOffer[] = [];

    for (const nd of newData) {
      if (!hasOfferIds.has(nd.ScientistOffer.id)) {
        hasOfferIds.add(nd.ScientistOffer.id);
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

    console.log("Version 2022-09-08 12:50");
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

    const solution = solveMatching(
      offers,
      requests,
      forcedAssignments,
      maxPerClass
    );

    solution?.sort((a, b) => a.day - b.day);

    console.log(solution);

    if (solution === null) {
      alert("Matching ist nicht möglich!"); // eslint-disable-line
    }

    setMatchings(solution);
  }, [maxPerClass, allRequests, forcedAssignmentsTxt, setMatchings, rsaConfig]);

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
      if (scr.SchoolClass == null) {
        break;
      }

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

  const matchingCounts = useMemo(() => {
    const classes = new Set();
    const offers = new Set();

    for (const match of matchings || []) {
      classes.add(match.classId);
      offers.add(match.offerId);
    }

    return {
      classCount: classes.size,
      offerCount: offers.size,
      matchingsCount: (matchings || []).length,
    };
  }, [matchings]);

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

        const counts = {
          acceptedScientists: 0,
          acceptedSchools: 0,
          rejectedScientists: 0,
          rejectedSchools: 0,
        };

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
                  as.SchoolClass.contact || "",
                ].join(" "),
                day: dayFormat(as.assigned_day, rsaConfig.start),
                grade: as.SchoolClass.grade,
                schoolName: as.SchoolClass.School.name,
                street: as.SchoolClass.School.street,
                studentsCount: as.SchoolClass.studensCount,
              };
              return ssai;
            });
            counts.acceptedScientists++;
            mails.push(
              createAcceptScientist(so.contactName, so.contactEmail, infos)
            );
          } else {
            counts.rejectedScientists++;
            mails.push(createRejectScientist(so.contactName, so.contactEmail));
          }
        }

        const requestsByClass: Record<
          number,
          SchoolsMailsInfo_SchoolClassRequest[]
        > = {};

        for (const smail of schoolsMails.data.SchoolClassRequest) {
          const prev = requestsByClass[smail.SchoolClass.id] || [];
          prev.push(smail);
          requestsByClass[smail.SchoolClass.id] = prev;
        }

        for (const requests of Object.values(requestsByClass)) {
          const acceptedRequests = requests.filter(
            (smail) =>
              smail !== null &&
              smail !== undefined &&
              smail.assigned_day !== null &&
              smail.assigned_day !== undefined &&
              smail.assigned_day > 0
          );

          if (acceptedRequests.length > 0) {
            for (const aRequest of acceptedRequests) {
              if (aRequest.assigned_day === null) {
                continue;
              }
              const cname =
                aRequest.SchoolClass.Teacher.User.firstName +
                " " +
                aRequest.SchoolClass.Teacher.User.lastName;

              counts.acceptedSchools++;
              mails.push(
                createAcceptSchool(
                  cname,
                  aRequest.SchoolClass.Teacher.User.email,
                  {
                    classGrade: aRequest.SchoolClass.grade + "",
                    className: aRequest.SchoolClass.name,
                    contactEmail: aRequest.ScientistOffer.contactEmail || "",
                    contactPhone: aRequest.ScientistOffer.contactPhone || "",
                    day: dayFormat(aRequest.assigned_day, rsaConfig.start),
                    scientist: aRequest.ScientistOffer.contactName || "",
                    time: aRequest.ScientistOffer.timeWindow.join(", "),
                    topic: aRequest.ScientistOffer.title,
                  }
                )
              );
            }
          } else if (requests.length > 0) {
            const anyRequest = requests[0];
            const cname =
              anyRequest.SchoolClass.Teacher.User.firstName +
              " " +
              anyRequest.SchoolClass.Teacher.User.lastName;
            counts.rejectedSchools++;
            mails.push(
              createRejectSchool(
                cname,
                anyRequest.SchoolClass.Teacher.User.email,
                anyRequest.SchoolClass.name,
                anyRequest.SchoolClass.grade
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
        console.log("email counts", counts);

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

  const handleChangeMaxPerClass = useCallback(
    (event) => {
      const newCount = Number(event.target.value);
      setMaxPerClass(newCount);
    },
    [setMaxPerClass]
  );

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
          </Button>{" "}
          Maximale Anzahl Vorträge pro Klasse:{" "}
          <input
            className="border border-black"
            type="number"
            min={1}
            max={5}
            value={maxPerClass}
            onChange={handleChangeMaxPerClass}
          />
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
          <div className="text-xl font-bold mt-6">
            Vorschau {matchingCounts.matchingsCount} Vorträge zwischen{" "}
            {matchingCounts.classCount} Klassen und {matchingCounts.offerCount}{" "}
            Angeboten
          </div>
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
                <MatchingTableRow
                  key={td.offerId + "/" + td.classId + "/" + td.day}
                  {...td}
                />
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
};
