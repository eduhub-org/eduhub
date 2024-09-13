import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useState } from 'react';
import { GoDotFill } from 'react-icons/go';
import { IoIosArrowDown, IoIosArrowUp, IoIosCheckmarkCircle, IoIosCloseCircle } from 'react-icons/io';
import { MdCheckBox, MdOutlineCheckBoxOutlineBlank } from 'react-icons/md';
import { useDisplayDate } from '../../../../helpers/dateTimeHelpers';
import { ManagedCourse_Course_by_pk_CourseEnrollments } from '../../../../graphql/__generated__/ManagedCourse';
import { MotivationRating_enum } from '../../../../__generated__/globalTypes';
import Dot from '../../../common/Dot';
import { OnlyAdmin } from '../../../common/OnlyLoggedIn';

interface IProps {
  enrollment: ManagedCourse_Course_by_pk_CourseEnrollments | null;
  isRowSelected: boolean;
  onSelectRow: (enrollmentId: number, selected: boolean) => any;
  onSetRating: (enrollment: ManagedCourse_Course_by_pk_CourseEnrollments, rating: MotivationRating_enum) => any;
}

const isExpired = (enrollment: ManagedCourse_Course_by_pk_CourseEnrollments | null) => {
  if (enrollment == null) {
    return false;
  }
  if (enrollment.invitationExpirationDate == null) {
    return false;
  }
  return new Date(enrollment.invitationExpirationDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
};

export const ApplicationRow: FC<IProps> = ({ enrollment, onSetRating, isRowSelected, onSelectRow }) => {
  const { t } = useTranslation();
  const displayDate = useDisplayDate();

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
          <div className="mr-3 ml-3 col-span-3">{t('firstName')}</div>
          <div className="mr-3 ml-3 col-span-3">{t('lastName')}</div>
          <div className="mr-3 ml-3 col-span-12">{t('course-page:application')}</div>
          <div className="mr-3 ml-3 col-span-2 text-center">{t('course-page:evaluation')}</div>
          <div className="mr-3 ml-3 col-span-2 text-center">{t('status')}</div>
          <div className="col-span-1" />
          <div className="col-span-1" />
        </div>
      )}

      {enrollment && (
        <>
          {' '}
          <div className={`grid grid-cols-24 bg-edu-light-gray ${isRowOpen ? '' : 'mb-1'}`}>
            <div className="mr-3 ml-3 col-span-3">{enrollment.User.firstName}</div>
            <div className="mr-3 ml-3 col-span-3">{enrollment.User.lastName}</div>
            <div className="mr-3 ml-3 col-span-12 truncate">{enrollment.motivationLetter}</div>
            <div className="mr-3 ml-3 col-span-2 text-center">
              {enrollment.motivationRating === 'UNRATED' &&  <Dot color="grey" />}
              {enrollment.motivationRating === 'INVITE' &&  <Dot color="lightgreen" />}
              {enrollment.motivationRating === 'REVIEW' &&  <Dot color="orange" />}
              {enrollment.motivationRating === 'DECLINE' &&  <Dot color="red" />}
            </div>
            <div className="mr-3 ml-3 col-span-2 text-center">
              {!isExpired(enrollment) && enrollment.status === 'APPLIED' && (
                <GoDotFill className="inline" title={t('course-page:applied')} color="grey" size="2.5em" />
              )}
              {!isExpired(enrollment) && enrollment.status === 'INVITED' && (
                <IoIosCheckmarkCircle className="inline" title={t('course-page:invited')} color="grey" size="1.5em" />
              )}
              {(enrollment.status === 'CONFIRMED' || enrollment.status === 'COMPLETED') && (
                <IoIosCheckmarkCircle
                  className="inline"
                  title={t('course-page:invitation-confirmed')}
                  color="lightgreen"
                  size="1.5em"
                />
              )}
              {enrollment.status === 'ABORTED' && (
                <IoIosCheckmarkCircle title={t('course-page:aborted')} color="red" size="1.5em" className="inline" />
              )}
              {enrollment.status === 'REJECTED' && (
                <IoIosCloseCircle title={t('course-page:rejected')} color="red" size="1.5em" className="inline" />
              )}
              {enrollment.status === 'CANCELLED' && (
                <IoIosCloseCircle title={t('course-page:cancelled')} color="red" size="1.5em" className="inline" />
              )}
              {isExpired(enrollment) && (enrollment.status === 'APPLIED' || enrollment.status === 'INVITED') && (
                <IoIosCloseCircle
                  className="inline"
                  title={t('course-page:invitation-expired')}
                  color="grey"
                  size="1.5em"
                />
              )}
            </div>
            <div className="col-span-1 cursor-pointer text-center" onClick={handleToggleRowOpen}>
              {!isRowOpen && <IoIosArrowDown size="1.25em" className="inline" />}
              {isRowOpen && <IoIosArrowUp size="1.25em" className="inline" />}
            </div>

            <div className="col-span-1 text-center">
              <OnlyAdmin>
                <div className="cursor-pointer" onClick={handleToggleRowSelected}>
                  {isRowSelected && <MdCheckBox className="inline" size="1.25em" />}
                  {!isRowSelected && <MdOutlineCheckBoxOutlineBlank className="inline" size="1.25em" />}
                </div>
              </OnlyAdmin>
            </div>
          </div>
          {isRowOpen && (
            <div className="mb-1">
              <div className="grid grid-cols-12 bg-edu-light-gray pt-5 pb-5">
                <div className="mr-3 ml-3 col-span-3 truncate" title={enrollment.User.email}>
                  {enrollment.User.email}
                  <p className="mt-4">{t('manageCourse:application_history')}</p>
                  {enrollment.User.CourseEnrollments.map((pastEnrollment, index) => {
                    if (pastEnrollment.courseId === enrollment.courseId) {
                      return null; // Skip rendering this enrollment
                    }
                    return (
                      <p
                        key={index}
                        className="text-xs whitespace-normal break-words mt-2 pl-4"
                        style={{ textIndent: '-1rem' }}
                      >
                        {pastEnrollment.Course?.title} ({pastEnrollment.Course?.Program.shortTitle}) -{' '}
                        {t(pastEnrollment.status)}
                      </p>
                    );
                  })}
                </div>
                <div className="mr-3 ml-3 col-span-6">{enrollment.motivationLetter}</div>
                <div className="mr-3 ml-3 col-span-3">
                  <div>
                    <Dot
                      onClick={setUnrated}
                      className="cursor-pointer"
                      color="grey"
                      size={enrollment.motivationRating === 'UNRATED' ? 'LARGE' : 'DEFAULT'}
                    />
                    <Dot
                      onClick={setInvite}
                      className="cursor-pointer"
                      color="lightgreen"
                      size={enrollment.motivationRating === 'INVITE' ? 'LARGE' : 'DEFAULT'}
                    />
                    <Dot
                      onClick={setReview}
                      className="cursor-pointer"
                      color="orange"
                      size={enrollment.motivationRating === 'REVIEW' ? 'LARGE' : 'DEFAULT'}
                    />
                    <Dot
                      onClick={setDecline}
                      className="cursor-pointer"
                      color="red"
                      size={enrollment.motivationRating === 'DECLINE' ? 'LARGE' : 'DEFAULT'}
                    />
                  </div>

                  {enrollment.status === 'INVITED' && (
                    <div className="mt-5">
                      {`${t('course-page:invitation-deadline')}:`} <br />
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
