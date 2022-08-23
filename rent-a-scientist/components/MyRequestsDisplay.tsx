import { IconButton } from "@material-ui/core";
import Link from "next/link";
import { FC, useCallback, useMemo } from "react";
import { IoMdTrash } from "react-icons/io";
import { useRoleMutation } from "../hooks/authedMutation";
import { useUserQuery } from "../hooks/authedQuery";
import { useRasConfig } from "../hooks/ras";
import { DELETE_SCHOOL_CLASS, MY_REQUESTS } from "../queries/ras_teacher";
import {
  DeleteSchoolClassById,
  DeleteSchoolClassByIdVariables,
} from "../queries/__generated__/DeleteSchoolClassById";
import {
  MyRequests,
  MyRequests_SchoolClassRequest,
} from "../queries/__generated__/MyRequests";
import {
  SchoolClassRequestSummary,
  SchoolClassRequestsSummary,
} from "./teacher/SchoolClassRequestsSummary";

interface SingleElementProps {
  requestSummary: SchoolClassRequestSummary;
  onTrash: (summary: SchoolClassRequestSummary) => any;
  allowTrash: boolean;
}

export const MyRequestsDisplaySingleElement: FC<SingleElementProps> = ({
  requestSummary,
  onTrash,
  allowTrash,
}) => {
  const handleTrash = useCallback(() => {
    onTrash(requestSummary);
  }, [onTrash, requestSummary]);

  return (
    <div className="mt-10">
      <div className="flex items-center mb-2">
        <div className="text-xl font-bold">
          Anmeldung Nr. 2022{requestSummary.schoolClassId}
        </div>

        {allowTrash && (
          <div>
            <IconButton className="" onClick={handleTrash}>
              <IoMdTrash />
            </IconButton>
          </div>
        )}
      </div>

      <SchoolClassRequestsSummary requestSummary={requestSummary} />
    </div>
  );
};

interface IProps {
  startDate: Date;
}

export const MyRequestsDisplay: FC<IProps> = ({ startDate }) => {
  const [deleteSchoolClass] = useRoleMutation<
    DeleteSchoolClassById,
    DeleteSchoolClassByIdVariables
  >(DELETE_SCHOOL_CLASS, {
    context: {
      role: "user",
    },
  });

  const rsaConfig = useRasConfig();

  const myRequestsQuery = useUserQuery<MyRequests>(MY_REQUESTS);

  console.log("myRequests", myRequestsQuery);

  const myRequests = useMemo(() => {
    if (startDate == null) return null;

    const data = myRequestsQuery.data;
    if (data == null) return null;

    const byClassId: Record<string, MyRequests_SchoolClassRequest[]> = {};
    for (const qr of data.SchoolClassRequest.filter(
      (scr) => scr.SchoolClass !== null && scr.SchoolClass !== undefined
    )) {
      const pre = byClassId[qr.SchoolClass.id] || [];
      pre.push(qr);
      byClassId[qr.SchoolClass.id] = pre;
    }

    const result = Object.values(byClassId).map((reqsByClass) => {
      // since this is grouped by schoolClass.id all the schoolclasses will be the same
      const schoolClass = reqsByClass[0].SchoolClass;

      const offers: Record<number, number[]> = {};
      const offerGeneralComments: Record<number, string> = {};
      const offerTimeComments: Record<number, string> = {};
      const assignedDays: Record<number, number> = {};

      for (const r of reqsByClass) {
        offers[r.offerId] = r.possibleDays;
        offerGeneralComments[r.offerId] = r.commentGeneral || "";
        offerTimeComments[r.offerId] = r.commentTime || "";
        if (r.assigned_day != null) {
          assignedDays[r.offerId] = r.assigned_day;
        }
      }

      const summary: SchoolClassRequestSummary = {
        requestId: reqsByClass[0].id,
        grade: schoolClass.grade,
        studentsCount: schoolClass.studensCount,
        schoolClassName: schoolClass.name,
        startDate,
        schoolDstNr: schoolClass.School.dstnr,
        contact: schoolClass.contact || "",
        offers,
        offerGeneralComments,
        offerTimeComments,
        schoolClassId: schoolClass.id,
        assignedDays,
      };

      return summary;
    });

    result.sort((a, b) => a.requestId - b.requestId);

    return result;
  }, [myRequestsQuery.data, startDate]);

  const handleTrash = useCallback(
    async (summary: SchoolClassRequestSummary) => {
      if (rsaConfig.visibility && confirm("Wirklich die Klasse wieder abmelden?")) { // eslint-disable-line
        await deleteSchoolClass({
          variables: {
            id: summary.schoolClassId,
          },
        });
        myRequestsQuery.refetch();
      }
    },
    [deleteSchoolClass, myRequestsQuery, rsaConfig]
  );

  return (
    <>
      <div className="m-4">
        Hier werden Ihre bereits angemeldeten Klassen aufgelistet. Falls
        gewünscht, können Sie die Anmeldungen auch zurücknehmen. <br />
        Haben Sie Fragen zu einer Anmeldung, können Sie uns unter Angabe der
        Anmeldungsnummer kontaktieren. <br />
        Um weitere Schulklassen anzumelden, klicken Sie bitte{" "}
        <Link href="/">
          <a className="underline">hier</a>
        </Link>
        .
      </div>

      {myRequests != null && (
        <>
          <div className="m-4">
            {myRequests.map((r) => (
              <MyRequestsDisplaySingleElement
                key={r.requestId}
                requestSummary={r}
                onTrash={handleTrash}
                allowTrash={rsaConfig.visibility}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
};
