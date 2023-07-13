import { useRoleMutation } from '../../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';

import { Button } from '../../common/Button';
import { CREATE_ACHIEVEMENT_CERTIFICATE } from '../../../queries/actions';
import { CREATE_PARTICIPATION_CERTIFICATE } from '../../../queries/actions';
import {
  ManagedCourse_Course_by_pk,
  ManagedCourse_Course_by_pk_CourseEnrollments,
} from '../../../queries/__generated__/ManagedCourse';

import { useState } from 'react';

export const GenerateCertificatesButton = ({
  userEnrollments,
  course,
}: {
  userEnrollments: ManagedCourse_Course_by_pk_CourseEnrollments[];
  course: ManagedCourse_Course_by_pk;
}) => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  //  TODO: restrict user ids to only those with sufficient attendances and passed achievements record

  const userIds = userEnrollments.map((p) => p.userId);

  const [createAchievementCertificate, { loading, error, data }] =
    useRoleMutation(CREATE_ACHIEVEMENT_CERTIFICATE, {
      variables: {
        courseId: course.id,
        userIds: userIds,
      },
    });

  const handleClick = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    createAchievementCertificate()
      .then((result) => {
        if (result.data.createAchievementCertificate.result === 0) {
          setSuccessMessage(t('course-page:no-certificates-generated'));
        } else if (result.data.createAchievementCertificate.result === 1) {
          setSuccessMessage(t('course-page:1-certificate-generated'));
        } else {
          setSuccessMessage(
            t('course-page:certificates-generated', {
              number: result.data.createAchievementCertificate.result,
            })
          );
        }
      })
      .catch((error) => {
        console.error('Error creating achievement certificate:', error);
        setErrorMessage(error.message);
      });
  };
  return (
    <div className="flex justify-end mt-10">
      {errorMessage && <div className="text-red-500 mr-2">{errorMessage}</div>}
      {successMessage && (
        <div className="text-green-500 mr-2">{successMessage}</div>
      )}
      <Button filled inverted onClick={handleClick}>
        {loading
          ? 'Loading...'
          : error
          ? t('course-page:certificate-generation')
          : t('course-page:certificate-generation')}
      </Button>
    </div>
  );
};
