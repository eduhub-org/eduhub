import { useQuery } from "@apollo/client";
import { FC, useCallback, useMemo } from "react";
import { OFFER_BY_ID } from "../../queries/ras_offer";
import { ScientistOfferById } from "../../queries/__generated__/ScientistOfferById";
import { MultiDatePureDisplay, MultiDateSelector } from "../MultiDateDisplay";

interface IProps {

    requestId: number,
    offerId: number,
    startDate: Date,
    days: number[],

    disabled?: boolean,

    commentTime?: string,
    onChangeCommentTime?: (offerId: number, commentTime: string) => any,
    
    commentGeneral?: string,
    onChangeCommentGeneral?: (offerId: number, commentGeneral: string) => any,

    className?: string
}

export const SchoolClassRequestEditor: FC<IProps> = ({

    requestId,
    offerId,
    days,
    disabled,
    startDate,
    commentTime,
    onChangeCommentTime,
    commentGeneral,
    onChangeCommentGeneral,

    className

}) => {

    const displayedOffer = useQuery<ScientistOfferById>(OFFER_BY_ID, {
        variables: {
            id: offerId
        }
    });

    const displayedName = useMemo(() => {
        if (!displayedOffer.loading && displayedOffer.data != null && displayedOffer.data.ScientistOffer_by_pk != null) {
            return displayedOffer.data.ScientistOffer_by_pk.title;
        } else {
            return "";
        }
    }, [displayedOffer]);

    const handleSelectCommentTime = useCallback(event => {
        const newComment = event.target.value;
        if (onChangeCommentTime != null) {
            onChangeCommentTime(offerId, newComment);
        }
    }, [onChangeCommentTime, offerId]);

    const handleSelectCommentGeneral = useCallback(event => {
        const newComment = event.target.value;
        if (onChangeCommentGeneral != null) {
            onChangeCommentGeneral(offerId, newComment);
        }
    }, [onChangeCommentGeneral, offerId]);

    return <div className={className || ""}>
        
        <div className="flex gap-3">

            <div className="w-1/2 truncate font-bold" title={displayedName}>
                {displayedName}
            </div>

            <div className="w-1/2">
                <MultiDatePureDisplay
                    days={days}
                    startDate={startDate}
                />
            </div>

        </div>

        <div className="flex gap-3 mt-2">
            <div>Kommentar Zeitraum</div>
            <input disabled={disabled} className="w-96 border border-black" type="text" value={commentTime || ""} onChange={handleSelectCommentTime} />

            <div>Nachricht</div>
            <input disabled={disabled} className="border flex-grow border-black" type="text" value={commentGeneral || ""} onChange={handleSelectCommentGeneral} />
        </div>


    </div>


}