import { QueryResult } from "@apollo/client";
import { FC, useCallback, useState } from "react";
import { GoPrimitiveDot } from "react-icons/go";
import {
  IoIosArrowDown,
  IoIosArrowUp,
  IoIosCheckmarkCircle,
  IoIosCloseCircle,
} from "react-icons/io";
import { MdCheckBox, MdOutlineCheckBoxOutlineBlank } from "react-icons/md";
import { displayDate } from "../../helpers/dateHelpers";
import {
  ManagedCourse_Course_by_pk_CourseEnrollments,
} from "../../queries/__generated__/ManagedCourse";
import { MotivationRating_enum } from "../../__generated__/globalTypes";
import { EhDot, greenDot, greyDot, orangeDot, redDot } from "../common/dots";
import { OnlyAdmin } from "../common/OnlyLoggedIn";

interface IProps {
  enrollment: ManagedCourse_Course_by_pk_CourseEnrollments | null;
  qResult: QueryResult<any, any>;
  isRowSelected: boolean;
  onSelectRow: (enrollmentId: number, selected: boolean) => any;
  onSetRating: (
    enrollment: ManagedCourse_Course_by_pk_CourseEnrollments,
    rating: MotivationRating_enum
  ) => any;
}

const isExpired = (
  enrollment: ManagedCourse_Course_by_pk_CourseEnrollments | null
) => {
  if (enrollment == null) {
    return false;
  }
  if (enrollment.invitationExpirationDate == null) {
    return false;
  }
  return enrollment.invitationExpirationDate.getTime() < Date.now();
};

export const ApplicationRow: FC<IProps> = ({
  enrollment,
  qResult,
  onSetRating,
  isRowSelected,
  onSelectRow,
}) => {
  const handleToggleRowSelected = useCallback(() => {
    if (enrollment != null) {
      onSelectRow(enrollment.id, !isRowSelected);
    }
  }, [enrollment, onSelectRow, isRowSelected]);

  const setUnrated = useCallback(() => {
    if (enrollment != null) {
      onSetRating(enrollment, MotivationRating_enum.UNRATED);
    }
  }, [onSetRating, enrollment]);

  const setInvite = useCallback(() => {
    if (enrollment != null) {
      onSetRating(enrollment, MotivationRating_enum.INVITE);
    }
  }, [onSetRating, enrollment]);

  const setReview = useCallback(() => {
    if (enrollment != null) {
      onSetRating(enrollment, MotivationRating_enum.REVIEW);
    }
  }, [onSetRating, enrollment]);

  const setDecline = useCallback(() => {
    if (enrollment != null) {
      onSetRating(enrollment, MotivationRating_enum.DECLINE);
    }
  }, [onSetRating, enrollment]);

  const [isRowOpen, setRowOpen] = useState(false);

  const handleToggleRowOpen = useCallback(() => {
    setRowOpen(!isRowOpen);
  }, [isRowOpen, setRowOpen]);

  return (
    <>
      {!enrollment && (
        <div className="grid grid-cols-24 mb-1">
          <div className="mr-3 ml-3 col-span-3">Vorname</div>
          <div className="mr-3 ml-3 col-span-3">Nachname</div>
          <div className="mr-3 ml-3 col-span-12">Bewerbung</div>
          <div className="mr-3 ml-3 col-span-2 text-center">Beurteilung</div>
          <div className="mr-3 ml-3 col-span-2 text-center">Status</div>
          <div className="col-span-1" />
          <div className="col-span-1" />
        </div>
      )}

      {enrollment && (
        <>
          {" "}
          <div
            className={`grid grid-cols-24 bg-edu-light-gray ${isRowOpen ? "" : "mb-1"
              }`}
          >
            <div className="mr-3 ml-3 col-span-3">
              {enrollment.User.firstName}
            </div>
            <div className="mr-3 ml-3 col-span-3">
              {enrollment.User.lastName}
            </div>
            <div className="mr-3 ml-3 col-span-12 truncate">
              {enrollment.motivationLetter}
            </div>
            <div className="mr-3 ml-3 col-span-2 text-center">
              {enrollment.motivationRating === "UNRATED" ? greyDot : <></>}
              {enrollment.motivationRating === "INVITE" ? greenDot : <></>}
              {enrollment.motivationRating === "REVIEW" ? orangeDot : <></>}
              {enrollment.motivationRating === "DECLINE" ? redDot : <></>}
            </div>
            <div className="mr-3 ml-3 col-span-2 text-center">
              {!isExpired(enrollment) && enrollment.status === "APPLIED" && (
                <GoPrimitiveDot
                  className="inline"
                  title="Beworben"
                  color="grey"
                  size="2.5em"
                />
              )}
              {!isExpired(enrollment) && enrollment.status === "INVITED" && (
                <IoIosCheckmarkCircle
                  className="inline"
                  title="Eingeladen"
                  color="grey"
                  size="1.5em"
                />
              )}
              {(enrollment.status === "CONFIRMED" ||
                enrollment.status === "COMPLETED") && (
                  <IoIosCheckmarkCircle
                    className="inline"
                    title="Einladung bestätigt"
                    color="lightgreen"
                    size="1.5em"
                  />
                )}
              {enrollment.status === "ABORTED" && (
                <IoIosCheckmarkCircle
                  title="Abgebrochen"
                  color="red"
                  size="1.5em"
                  className="inline"
                />
              )}
              {enrollment.status === "REJECTED" && (
                <IoIosCloseCircle
                  title="Abgelehnt"
                  color="red"
                  size="1.5em"
                  className="inline"
                />
              )}
              {isExpired(enrollment) &&
                (enrollment.status === "APPLIED" ||
                  enrollment.status === "INVITED") && (
                  <IoIosCloseCircle
                    className="inline"
                    title="Einladung abgelaufen"
                    color="grey"
                    size="1.5em"
                  />
                )}
            </div>
            <div
              className="col-span-1 cursor-pointer text-center"
              onClick={handleToggleRowOpen}
            >
              {!isRowOpen && (
                <IoIosArrowDown size="1.25em" className="inline" />
              )}
              {isRowOpen && <IoIosArrowUp size="1.25em" className="inline" />}
            </div>

            <div className="col-span-1 text-center">
              <OnlyAdmin>
                <div
                  className="cursor-pointer"
                  onClick={handleToggleRowSelected}
                >
                  {isRowSelected && (
                    <MdCheckBox className="inline" size="1.25em" />
                  )}
                  {!isRowSelected && (
                    <MdOutlineCheckBoxOutlineBlank
                      className="inline"
                      size="1.25em"
                    />
                  )}
                </div>
              </OnlyAdmin>
            </div>
          </div>
          {isRowOpen && (
            <div className="mb-1">
              <div className="grid grid-cols-12 bg-edu-light-gray pt-5 pb-5">
                <div
                  className="mr-3 ml-3 col-span-3 truncate"
                  title={enrollment.User.email}
                >
                  {enrollment.User.email}
                </div>
                <div className="mr-3 ml-3 col-span-6">
                  {enrollment.motivationLetter}
                </div>
                <div className="mr-3 ml-3 col-span-3">
                  <div>
                    <EhDot
                      onClick={setUnrated}
                      className="cursor-pointer"
                      color="GREY"
                      size={
                        enrollment.motivationRating === "UNRATED"
                          ? "LARGE"
                          : "DEFAULT"
                      }
                    />
                    <EhDot
                      onClick={setInvite}
                      className="cursor-pointer"
                      color="GREEN"
                      size={
                        enrollment.motivationRating === "INVITE"
                          ? "LARGE"
                          : "DEFAULT"
                      }
                    />
                    <EhDot
                      onClick={setReview}
                      className="cursor-pointer"
                      color="ORANGE"
                      size={
                        enrollment.motivationRating === "REVIEW"
                          ? "LARGE"
                          : "DEFAULT"
                      }
                    />
                    <EhDot
                      onClick={setDecline}
                      className="cursor-pointer"
                      color="RED"
                      size={
                        enrollment.motivationRating === "DECLINE"
                          ? "LARGE"
                          : "DEFAULT"
                      }
                    />
                  </div>

                  {enrollment.status === "INVITED" && (
                    <div className="mt-5">
                      Ablaufdatum Einladung: <br />
                      {displayDate(enrollment.invitationExpirationDate)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};
