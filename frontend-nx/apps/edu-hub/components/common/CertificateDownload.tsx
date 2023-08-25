import useTranslation from 'next-translate/useTranslation';
import { Dispatch, FC, SetStateAction, useEffect } from 'react';

import { useAuthedQuery } from '../../hooks/authedQuery';

import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../queries/__generated__/CourseWithEnrollment';
import { LOAD_ACHIEVEMENT_CERTIFICATE } from '../../queries/loadAchievementCertificate';
import { LOAD_PARTICIPATION_CERTIFICATE } from '../../queries/loadParticipationCertificate';
import { Button } from './Button';

import {
  loadAchievementCertificate,
  loadAchievementCertificateVariables,
} from '../../queries/__generated__/loadAchievementCertificate';
import {
  loadParticipationCertificate,
  loadParticipationCertificateVariables,
} from '../../queries/__generated__/loadParticipationCertificate';

interface IProps {
  courseEnrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments;
  manageView?: boolean;
  refetchAchievementCertificates?: boolean;
  refetchParticipationCertificates?: boolean;
  setRefetchAchievementCertificates?: Dispatch<SetStateAction<boolean>>;
  setRefetchParticipationCertificates?: Dispatch<SetStateAction<boolean>>;
}

export const CertificateDownload: FC<IProps> = ({
  courseEnrollment,
  manageView,
  refetchAchievementCertificates,
  refetchParticipationCertificates,
  setRefetchAchievementCertificates,
  setRefetchParticipationCertificates,
}) => {
  const { t } = useTranslation();

  const {
    data: loadAchievementCertificateData,
    loading: loadAchievementCerfificateLoading,
    refetch: loadAchievementCerfificateRefetch,
  } = useAuthedQuery<
    loadAchievementCertificate,
    loadAchievementCertificateVariables
  >(LOAD_ACHIEVEMENT_CERTIFICATE, {
    variables: {
      path: courseEnrollment?.achievementCertificateURL,
    },
    skip: !courseEnrollment?.achievementCertificateURL,
  });

  const {
    data: loadParticipationCertificateData,
    loading: loadParticipationCerfificateLoading,
    refetch: loadParticipationCerfificateRefetch,
  } = useAuthedQuery<
    loadParticipationCertificate,
    loadParticipationCertificateVariables
  >(LOAD_PARTICIPATION_CERTIFICATE, {
    variables: {
      path: courseEnrollment?.attendanceCertificateURL,
    },
    skip: !courseEnrollment?.attendanceCertificateURL,
  });

  // useEffect(() => {
  //   if (refetchAchievementCertificates) {
  //     loadAchievementCerfificateRefetch();
  //     setRefetchAchievementCertificates(false);
  //   }
  //   if (refetchParticipationCertificates) {
  //     loadParticipationCerfificateRefetch();
  //     setRefetchParticipationCertificates(false);
  //   }
  // }, [
  //   refetchAchievementCertificates,
  //   refetchParticipationCertificates,
  //   loadAchievementCerfificateRefetch,
  //   loadParticipationCerfificateRefetch,
  //   setRefetchAchievementCertificates,
  //   setRefetchParticipationCertificates,
  // ]);

  return (
    <div className={!manageView && 'mt-4'}>
      <div className={`flex gap-4 ${!manageView && 'flex-col mt-6'}`}>
        {loadAchievementCertificateData &&
          !loadAchievementCerfificateLoading && (
            <>
              {!manageView && (
                <h3 className="text-3xl font-medium">
                  {t('course-page:congrats-completion')}
                </h3>
              )}
              <Button
                as="a"
                filled
                href={
                  loadAchievementCertificateData.loadAchievementCertificate.link
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                {manageView
                  ? t('manage-course:achievementCertificateDownload')
                  : t('course-page:achievementCertificateDownload')}
              </Button>
            </>
          )}
        {loadParticipationCertificateData &&
          !loadParticipationCerfificateLoading && (
            <Button
              as="a"
              filled
              href={
                loadParticipationCertificateData.loadParticipationCertificate
                  .link
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              {manageView
                ? t('manage-course:attendanceCertificateDownload')
                : t('course-page:attendanceCertificateDownload')}
            </Button>
          )}
      </div>
    </div>
  );
};
