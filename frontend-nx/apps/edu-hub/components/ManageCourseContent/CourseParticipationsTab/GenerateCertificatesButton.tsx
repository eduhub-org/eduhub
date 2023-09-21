import { useRoleMutation } from '../../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';

import { Button } from '../../common/Button';
import { CREATE_CERTIFICATE } from '../../../queries/actions';
import {
  ManagedCourse_Course_by_pk,
  ManagedCourse_Course_by_pk_CourseEnrollments,
} from '../../../queries/__generated__/ManagedCourse';

import { ApolloQueryResult } from '@apollo/client';
import { Dispatch, SetStateAction, useState } from 'react';

interface Props {
  userEnrollments: ManagedCourse_Course_by_pk_CourseEnrollments[];
  course: ManagedCourse_Course_by_pk;
  certificateType: 'attendance' | 'achievement' | 'degree';
  refetchCourse: (variables?: Partial<any>) => Promise<ApolloQueryResult<any>>;
  refetch: Dispatch<SetStateAction<boolean>>;
}

export const GenerateCertificatesButton: React.FC<Props> = ({
  userEnrollments,
  course,
  certificateType,
  refetchCourse,
  refetch,
}) => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const userIds = userEnrollments.map((enrollment) => enrollment.userId);

  const [createCertificate, { loading, error }] = useRoleMutation(
    CREATE_CERTIFICATE,
    {
      variables: {
        courseId: course.id,
        userIds,
        certificateType,
      },
    }
  );

  const handleClick = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await createCertificate();
      const { result: certResult } = result.data.createCertificate;

      const successTranslationKey = 
        certResult <= 1 
          ? `course-page:${certResult === 0 ? 'no-' : '1-'}certificate-generated`
          : 'course-page:certificates-generated';

      setSuccessMessage(t(successTranslationKey, { number: certResult }));
      refetch(true);
      refetchCourse();
    } catch (err) {
      console.error(`Error creating ${certificateType} certificate:`, err);
      setErrorMessage(err.message);
      refetchCourse();
    }
  };

  const buttonLabel = loading || error
    ? 'Loading...'
    : t(`course-page:${certificateType}-certificate-generation`);

  return (
    <div className="flex justify-end mt-10">
      {errorMessage && <div className="text-red-500 mr-2">{errorMessage}</div>}
      {successMessage && (
        <div className="text-green-500 mr-2">{successMessage}</div>
      )}
      <Button filled inverted onClick={handleClick}>
        {buttonLabel}
      </Button>
    </div>
  );
};
