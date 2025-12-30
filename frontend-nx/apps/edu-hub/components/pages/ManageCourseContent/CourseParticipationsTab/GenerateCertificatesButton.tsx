import { useRoleMutation } from '../../../../hooks/authedMutation';
import { useTranslations } from 'next-intl';
import { Button } from '../../../common/Button';
import { CREATE_CERTIFICATES } from '../../../../queries/actions';
import {
  ManagedCourse_Course_by_pk,
  ManagedCourse_Course_by_pk_CourseEnrollments,
} from '../../../../queries/__generated__/ManagedCourse';
import { ApolloQueryResult } from '@apollo/client';
import { Dispatch, SetStateAction, useState, useEffect } from 'react';

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
  useEffect(() => {
    console.log('=== Component Mount State ===');
    console.log('Props received:', {
      userEnrollmentsLength: userEnrollments.length,
      userEnrollments,
      courseId: course.id,
      certificateType,
    });
  }, [userEnrollments, course, certificateType]);

  const t = useTranslations();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Log input parameters
  const logInputs = () => {
    console.log('=== Certificate Generation Input ===');
    console.log('Certificate Type:', certificateType);
    console.log('Course:', {
      id: course.id,
      title: course.title,
      // Add other relevant course fields
    });
    console.log(
      'User Enrollments:',
      userEnrollments.map((enrollment) => ({
        userId: enrollment.userId,
        enrollmentId: enrollment.id,
        // Add other relevant enrollment fields
      }))
    );
  };

  const userIds = userEnrollments.map((enrollment) => enrollment.userId);

  const [createCertificates, { loading, error }] = useRoleMutation(CREATE_CERTIFICATES, {
    variables: {
      courseId: course.id,
      userIds,
      certificateType,
    },
  });

  const handleClick = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    logInputs();

    try {
      console.log('=== Starting Certificate Generation ===');
      const response = await createCertificates();
      console.log('=== Certificate Generation Response ===', response);

      const result = response.data.createCertificates;

      if (!result.success) {
        throw new Error(result.error || t(`errors:${result.messageKey}`));
      }

      const certCount = result.count;
      console.log('Certificates Generated:', certCount);

      const successTranslationKey =
        certCount <= 1
          ? `coursePage.${certCount === 0 ? 'no-' : '1-'}certificate-generated`
          : 'coursePage.certificates-generated';

      const translatedMessage = t(successTranslationKey, { number: certCount });
      console.log('Success Message:', translatedMessage);

      setSuccessMessage(translatedMessage);
      refetch(true);
      refetchCourse();
    } catch (err) {
      console.error('=== Certificate Generation Error ===', {
        message: err.message,
        stack: err.stack,
        graphQLErrors: err.graphQLErrors,
        networkError: err.networkError,
      });

      setErrorMessage(err.message);
      refetchCourse();
    }
  };

  const buttonLabel = loading || error ? 'Loading...' : t(`coursePage.${certificateType}-certificate-generation`);

  return (
    <div className="flex justify-end mt-10">
      {errorMessage && <div className="text-red-500 mr-2">{errorMessage}</div>}
      {successMessage && <div className="text-green-500 mr-2">{successMessage}</div>}
      <Button filled inverted onClick={handleClick}>
        {buttonLabel}
      </Button>
    </div>
  );
};
