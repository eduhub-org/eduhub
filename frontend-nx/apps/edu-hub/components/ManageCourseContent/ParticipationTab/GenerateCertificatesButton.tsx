import { useIsAdmin } from '../../../hooks/authentication';
import { useRoleMutation } from '../../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';

import { Button } from '../../common/Button';
import { CREATE_ACHIEVEMENT_CERTIFICATE } from '../../../queries/actions';
import { CREATE_PARTICIPATION_CERTIFICATE } from '../../../queries/actions';
import {
  ManagedCourse_Course_by_pk,
  ManagedCourse_Course_by_pk_CourseEnrollments,
} from '../../../queries/__generated__/ManagedCourse';

export const GenerateCertificatesButton = ({
  participationList,
  course,
}: {
  participationList: ManagedCourse_Course_by_pk_CourseEnrollments[];
  course: ManagedCourse_Course_by_pk;
}) => {
  const isAdmin = useIsAdmin();
  const { t } = useTranslation();

  const [createAchievementCertificate, { loading, error, data }] =
    useRoleMutation(CREATE_ACHIEVEMENT_CERTIFICATE, {
      variables: {
        courseId: course.id,
        userIds: participationList.map((p) => p.userId),
      },
    });

  const handleClick = () => {
    createAchievementCertificate().catch((error) => {
      console.error('Error creating achievement certificate:', error);
    });
  };
  return (
    <div className="flex justify-end mt-10">
      <Button filled inverted onClick={handleClick}>
        {loading
          ? 'Loading...'
          : error
          ? `Error! ${error.message}`
          : t('course-page:certificate-generation')}
      </Button>
    </div>
  );
};
