import { FC } from "react";
import { SchoolClassEditor } from "./SchoolClassEditor";
import { SchoolClassRequestEditor } from "./SchoolClassRequestEditor";

export interface SchoolClassRequestSummary {
  requestId: number;
  offers: Record<number, number[]>;
  offerGeneralComments: Record<number, string>;
  offerTimeComments: Record<number, string>;
  contact: string;
  grade: number;
  studentsCount: number;
  schoolClassName: string;
  startDate: Date;
  schoolDstNr: string;
  schoolClassId: number;
  assignedDays: Record<number, number>;
  contactInfos: Record<number, string>
}

interface IProps {
  requestSummary: SchoolClassRequestSummary;

  onUpdateGeneralComment?: (offerId: number, comment: string) => any;
  onUpdateTimeComment?: (offerId: number, comment: string) => any;
  onUpdateSchoolClassName?: (name: string) => any;
  onUpdateStudentsCount?: (scount: number) => any;
  onUpdateContact?: (contact: string) => any;
  className?: string;
}

export const SchoolClassRequestsSummary: FC<IProps> = ({
  requestSummary,

  onUpdateGeneralComment,
  onUpdateTimeComment,
  onUpdateSchoolClassName,
  onUpdateStudentsCount,
  onUpdateContact,
  className,
}) => {
  const renderDisabled =
    onUpdateGeneralComment == null ||
    onUpdateTimeComment == null ||
    onUpdateSchoolClassName == null ||
    onUpdateStudentsCount == null ||
    onUpdateContact == null;

  const offerList = Object.keys(requestSummary.offers).map((okey) => {
    const oid = Number(okey);
    const assignedDay = requestSummary.assignedDays[oid] || null;
    return {
      id: oid,
      requestId: requestSummary.requestId,
      startDate: requestSummary.startDate,
      days: requestSummary.offers[oid] || [],
      disabled: renderDisabled,
      commentTime: requestSummary.offerTimeComments[oid] || "",
      commentGeneral: requestSummary.offerGeneralComments[oid] || "",
      assignedDay,
      contactInfo: assignedDay !== null && assignedDay !== -1 && assignedDay > 0 && assignedDay < 6 ? requestSummary.contactInfos[oid] : "",
    };
  });

  return (
    <>
      <div className={className}>
        <SchoolClassEditor
          className="mb-10"
          name={requestSummary.schoolClassName}
          grade={requestSummary.grade}
          contact={requestSummary.contact}
          onChangeContact={onUpdateContact}
          studentsCount={requestSummary.studentsCount}
          onChangeName={onUpdateSchoolClassName}
          onChangeStudentsCount={onUpdateStudentsCount}
        />

        {offerList.map((oentry) => (
          <SchoolClassRequestEditor
            className="mb-5"
            key={oentry.id}
            days={oentry.days}
            offerId={oentry.id}
            requestId={oentry.requestId}
            startDate={oentry.startDate}
            commentTime={oentry.commentTime}
            commentGeneral={oentry.commentGeneral}
            disabled={renderDisabled}
            onChangeCommentGeneral={onUpdateGeneralComment}
            onChangeCommentTime={onUpdateTimeComment}
            assignedDay={oentry.assignedDay}
            contactInfo={oentry.contactInfo}
          />
        ))}
      </div>
    </>
  );
};
