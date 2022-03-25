import { FC, useCallback } from "react";
import { ManagedCourse_Course_by_pk_Sessions } from "../../queries/__generated__/ManagedCourse";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"
import EhTimeSelect, { formatTime } from "../common/EhTimeSelect";
import { DebounceInput } from "react-debounce-input";
import EhTagEdit from "../common/EhTagEdit";
import { IconButton } from "@material-ui/core";
import { MdDelete } from "react-icons/md";

const copyDateTime = (target: Date, source: Date) => {
    target = new Date(target);
    target.setHours(source.getHours());
    target.setMinutes(source.getMinutes());
    target.setSeconds(source.getSeconds());
    target.setMilliseconds(source.getMilliseconds());
    return target;
}

interface IProps {
    session: ManagedCourse_Course_by_pk_Sessions | null
    onDelete: (pk: number) => any
    onSetStartDate: (session: ManagedCourse_Course_by_pk_Sessions, date: Date) => any
    onSetEndDate: (session: ManagedCourse_Course_by_pk_Sessions, date: Date) => any
}

export const SessionRow: FC<IProps> = ({
    session,
    onDelete,
    onSetStartDate,
    onSetEndDate
}) => {

    const handleDelete = useCallback(() => {
        if (session != null) {
            onDelete(session.id);
        }
    }, [session, onDelete]);

    const handleSetDate = useCallback((event: Date | null) => {
        if (session != null) {
            onSetStartDate(session, copyDateTime(event || new Date(), session.startDateTime));
            onSetEndDate(session, copyDateTime(event || new Date(), session.endDateTime));
        }
    }, [session, onSetStartDate, onSetEndDate]);

    const handleSetStartTime = useCallback((event: string) => {
        if (session != null) {
            const copyDate = new Date(session.startDateTime);
            const [hoursStr, minutesStr] = event.split(":");
            const hours = Number(hoursStr);
            const minutes = Number(minutesStr);
            copyDate.setHours(hours);
            copyDate.setMinutes(minutes);
            copyDate.setSeconds(0);
            copyDate.setMilliseconds(0);
            onSetStartDate(session, copyDate);
        }
    }, [session, onSetStartDate]);

    const handleSetEndTime = useCallback((event: string) => {
        if (session != null) {
            const copyDate = new Date(session.endDateTime);
            const [hoursStr, minutesStr] = event.split(":");
            const hours = Number(hoursStr);
            const minutes = Number(minutesStr);
            copyDate.setHours(hours);
            copyDate.setMinutes(minutes);
            copyDate.setSeconds(0);
            copyDate.setMilliseconds(0);
            onSetEndDate(session, copyDate);
        }
    }, [session, onSetEndDate]);

    const adressTags = (session?.SessionAddresses || []).map(x => ({
        id: x.id,
        display: x.link || ""
    }));

    const speakerTags = (session?.SessionSpeakers || []).map(x => ({
        id: x.id,
        display: [x.Expert.User.firstName, x.Expert.User.lastName].join(" ")
    }));

    return <div><div className={`grid grid-cols-32 mb-1 ${session != null ? "bg-edu-light-gray" : ""}`}>
        {!session && <div className="mr-3 ml-3 col-span-4">
            Datum<br />
        </div>}

        {session && <div className="col-span-4 m-2"><DatePicker
                dateFormat={"dd/MM/yyy"}
                className="w-full bg-edu-light-gray"
                selected={session.startDateTime}
                onChange={handleSetDate} />  </div>}

        <div className="mr-3 ml-3 col-span-3">
            {!session && <>Start<br />
            Uhrzeit</>
            }
            {session && <EhTimeSelect className="bg-edu-light-gray m-2" onChange={handleSetStartTime} value={formatTime(session.startDateTime)} />}
        </div>
        <div className="mr-3 ml-3 col-span-3">
            {!session && <>Ende<br />Uhrzeit</>}
            {session && <EhTimeSelect className="bg-edu-light-gray m-2" onChange={handleSetEndTime} value={formatTime(session.endDateTime)} /> }
        </div>
        <div className="mr-3 ml-3 col-span-10">
            {!session && <>Beschreibung</>}
            {session && <DebounceInput 
                className="w-full bg-edu-light-gray m-2" 
                value={session.title} 
                onChange={() => {}} 
                debounceTimeout={1000} />}
        </div>
        <div className="mr-3 ml-3 col-span-5">
            {!session && <>Adresse / <br />Link</>}
            {session && <div className="m-2"><EhTagEdit requestAddTag={() => {}} requestDeleteTag={() => {}} tags={adressTags} /></div>}
        </div>
        <div className="mr-3 ml-3 col-span-5">
            {!session && <>Speaker <br /></>}
            {session && <div className="m-2"><EhTagEdit requestAddTag={() => {}} requestDeleteTag={() => {}} tags={speakerTags} /></div>}
        </div>
        <div className="ml-3 col-span-2 bg-white">
            {session && <div onClick={handleDelete} className="mt-2 ml-2"><IconButton size="small">
                    <MdDelete size="1.25em" />
                </IconButton></div>}
        </div>
    </div></div>
}