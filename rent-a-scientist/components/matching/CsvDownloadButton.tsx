import { Button } from "@material-ui/core";
import jsonexport from "jsonexport/dist";
import { FC, useCallback, useMemo } from "react";
import { useAuthedQuery } from "../../hooks/authedQuery";
import { ALL_REQUESTS } from "../../queries/ras_matching";
import { AllRequests } from "../../queries/__generated__/AllRequests";

export const saveTextData = (data: string, fileName: string) => {
  const a = document.createElement("a");
  document.body.appendChild(a);
  (a.style as any) = "display: none";
  const blob = new Blob([data], { type: "octet/stream" });
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
  a.parentNode?.removeChild(a);
};

export const CsvDownloadButton: FC = () => {
  const allRequests = useAuthedQuery<AllRequests>(ALL_REQUESTS);

  const clickCsvButton = useCallback(async () => {
    const newData = (await allRequests.refetch()).data.SchoolClassRequest;
    const csvData = newData.map((row) => ({
      request_id: row.id,
      possible_days: row.possibleDays.join(","),
      assigned_day: row.assigned_day,
      comment_time: row.commentTime,
      comment_general: row.commentGeneral,
      class_id: row.SchoolClass.id,
      class_name: row.SchoolClass.name,
      class_students_count: row.SchoolClass.studensCount,
      school_dstnr: row.SchoolClass.School.dstnr,
      school_name: row.SchoolClass.School.name,
      school_postal_code: row.SchoolClass.School.postalCode,
      school_city: row.SchoolClass.School.city,
      school_street: row.SchoolClass.School.street,
      teacher_id: row.SchoolClass.Teacher.User.id,
      teacher_firstname: row.SchoolClass.Teacher.User.firstName,
      teacher_lastname: row.SchoolClass.Teacher.User.lastName,
      teacher_email: row.SchoolClass.Teacher.User.email,
      teacher_phone: row.SchoolClass.contact,
      offer_id: row.ScientistOffer.id,
      offer_title: row.ScientistOffer.title,
      offer_description: row.ScientistOffer.description,
      offer_contact_name: row.ScientistOffer.contactName,
      offer_contact_phone: row.ScientistOffer.contactPhone,
      offer_contact_email: row.ScientistOffer.contactEmail,
    }));

    const csvString = await jsonexport(csvData, {
      headers: [
        // provide the headers to control the order
        "request_id",
        "class_id",
        "offer_id",
        "possible_days",
        "assigned_day",
        "teacher_firstname",
        "teacher_lastname",
        "teacher_email",
        "teacher_phone",
        "offer_contact_name",
        "offer_contact_phone",
        "offer_contact_email",
        "class_name",
        "class_students_count",
        "school_dstnr",
        "school_name",
        "school_postal_code",
        "school_city",
        "school_street",

        "comment_time",
        "comment_general",

        "teacher_id",

        "offer_title",
        "offer_description",
      ],
    });

    saveTextData(csvString, "anmeldungen.csv");
  }, [allRequests]);

  return (
    <>
      <Button onClick={clickCsvButton} variant="contained">
        <span>Download CSV der Anfragen</span>
      </Button>
    </>
  );
};
