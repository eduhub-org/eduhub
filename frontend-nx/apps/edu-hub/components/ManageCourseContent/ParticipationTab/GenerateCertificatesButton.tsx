import { useRoleMutation } from '../../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';

import { Button } from '../../common/Button';
import { CREATE_CERTIFICATE } from '../../../queries/actions';
import {
  ManagedCourse_Course_by_pk,
  ManagedCourse_Course_by_pk_CourseEnrollments,
} from '../../../queries/__generated__/ManagedCourse';

import { useState } from 'react';
import { ApolloQueryResult } from '@apollo/client';

export const GenerateCertificatesButton = ({
  userEnrollments,
  course,
  certificateType,
  refetchCourse,
}: {
  userEnrollments: ManagedCourse_Course_by_pk_CourseEnrollments[];
  course: ManagedCourse_Course_by_pk;
  certificateType: 'attendance' | 'achievement' | 'degree';
  refetchCourse: (variables?: Partial<any>) => Promise<ApolloQueryResult<any>>;
}) => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const userIds = userEnrollments.map((p) => p.userId);

  const [createCertificate, { loading, error, data }] = useRoleMutation(
    CREATE_CERTIFICATE,
    {
      variables: {
        courseId: course.id,
        userIds: userIds,
        certificateType: certificateType,
      },
    }
  );

  const handleClick = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    createCertificate()
      .then((result) => {
        if (result.data.createCertificate.result === 0) {
          setSuccessMessage(t('course-page:no-certificates-generated'));
        } else if (result.data.createCertificate.result === 1) {
          setSuccessMessage(t('course-page:1-certificate-generated'));
        } else {
          setSuccessMessage(
            t('course-page:certificates-generated', {
              number: result.data.createCertificate.result,
            })
          );
        }
      })
      .catch((error) => {
        console.error(`Error creating ${certificateType} certificate:`, error);
        setErrorMessage(error.message);
      })
      .finally(() => {
        refetchCourse();
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
          ? t(`course-page:${certificateType}-certificate-generation`)
          : t(`course-page:${certificateType}-certificate-generation`)}
      </Button>
    </div>
  );
};
