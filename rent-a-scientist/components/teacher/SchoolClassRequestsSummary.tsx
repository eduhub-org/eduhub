import { FC } from "react"
import { SchoolClassEditor } from "./SchoolClassEditor";
import { SchoolClassRequestEditor } from "./SchoolClassRequestEditor";

export interface SchoolClassRequestSummary {
    requestId: number,
    offers: Record<number, number[]>,
    offerGeneralComments: Record<number, string>,
    offerTimeComments: Record<number, string>,
    grade: number,
    studentsCount: number,
    schoolClassName: string,
    startDate: Date,
    schoolDstNr: string,
}

interface IProps {
    requestSummary: SchoolClassRequestSummary,

    onUpdateGeneralComment?: (offerId: number, comment: string) => any,
    onUpdateTimeComment?: (offerId: number, comment: string) => any,
    onUpdateSchoolClassName?: (name: string) => any,
    onUpdateStudentsCount?: (scount: number) => any,
    className?: string
}

export const SchoolClassRequestsSummary: FC<IProps> = ({
    requestSummary,

    onUpdateGeneralComment,
    onUpdateTimeComment,
    onUpdateSchoolClassName,
    onUpdateStudentsCount,
    className
}) => {

    const renderDisabled = 
        onUpdateGeneralComment == null || 
        onUpdateTimeComment == null || 
        onUpdateSchoolClassName == null || 
        onUpdateStudentsCount == null;

    const offerList = Object.keys(requestSummary.offers).map(okey => {
        const oid = Number(okey);
        return {
            id: oid,
            requestId: requestSummary.requestId,
            startDate: requestSummary.startDate,
            days: requestSummary.offers[oid] || [],
            disabled: renderDisabled,
            commentTime: requestSummary.offerTimeComments[oid] || "",
            commentGeneral: requestSummary.offerGeneralComments[oid] || "",
        }
    });

    return <>

        <div className={className}>



            <SchoolClassEditor 
                name={requestSummary.schoolClassName}
                grade={requestSummary.grade}
                studentsCount={requestSummary.studentsCount}
                onChangeName={onUpdateSchoolClassName}
                onChangeStudentsCount={onUpdateStudentsCount}/>

            {
                offerList.map(oentry => <SchoolClassRequestEditor
                    className="mb-3"
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
                />)
            }

        </div>

    </>;

}