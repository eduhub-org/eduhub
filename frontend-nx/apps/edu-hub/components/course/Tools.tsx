import useTranslation from 'next-translate/useTranslation';
import { FC } from 'react';

import { useAuthedQuery } from '../../hooks/authedQuery';

import { Button } from '../common/Button';

import { LOAD_ACHIEVEMENT_CERTIFICATE } from '../../queries/loadAchievementCertificate';
import { LOAD_PARTICIPATION_CERTIFICATE } from '../../queries/loadParticipationCertificate';

import { CourseWithEnrollment_Course_by_pk } from '../../queries/__generated__/CourseWithEnrollment';
import {
  loadAchievementCertificate,
  loadAchievementCertificateVariables,
} from '../../queries/__generated__/loadAchievementCertificate';
import {
  loadParticipationCertificate,
  loadParticipationCertificateVariables,
} from '../../queries/__generated__/loadParticipationCertificate';

interface IProps {
  course: CourseWithEnrollment_Course_by_pk;
}

export const Tools: FC<IProps> = ({ course }) => {
  const { t } = useTranslation('course-page');

  // const videoLink = course.CourseLocations.find(
  //   (courseLocation) => !!courseLocation.defaultSessionAddress
  // )?.defaultSessionAddress;

  const courseEnrollment = course.CourseEnrollments[0];

  const {
    data: loadAchievementCertificateData,
    loading: loadAchievementCerfificateLoading,
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
  } = useAuthedQuery<
    loadParticipationCertificate,
    loadParticipationCertificateVariables
  >(LOAD_PARTICIPATION_CERTIFICATE, {
    variables: {
      path: courseEnrollment?.attendanceCertificateURL,
    },
    skip: !courseEnrollment?.attendanceCertificateURL,
  });

  return (
    <div className="flex flex-1 gap-x-4">
      {course.chatLink && (
        <Button
          as="a"
          filled
          href={course.chatLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('openChat')}
        </Button>
      )}

      {loadAchievementCertificateData && !loadAchievementCerfificateLoading && (
        <Button
          as="a"
          filled
          href={loadAchievementCertificateData.loadAchievementCertificate.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('achievementCertificateDownload')}
        </Button>
      )}

      {loadParticipationCertificateData &&
        !loadParticipationCerfificateLoading && (
          <Button
            as="a"
            filled
            href={
              loadParticipationCertificateData.loadParticipationCertificate.link
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('attendanceCertificateDownload')}
          </Button>
        )}
      {/* {videoLink && (
        <Button
          as="a"
          filled
          href={videoLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('openVideoCall')}
        </Button>
      )} */}
    </div>
  );
};
