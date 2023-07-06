import { useIsAdmin } from '../../../hooks/authentication';
import { useRoleMutation } from '../../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';

import { Button } from '../../common/Button';
import { CREATE_ACHIEVEMENT_CERTIFICATE } from '../../../queries/actions';
import { CREATE_PARTICIPATION_CERTIFICATE } from '../../../queries/actions';

export const CertificateButton = () => {
  const isAdmin = useIsAdmin();
  const { t } = useTranslation();

  const [createAchievementCertificate, { loading, error, data }] =
    useRoleMutation(CREATE_ACHIEVEMENT_CERTIFICATE, {
      variables: {
        template:
          'https://edu-old.opencampus.sh/templates/opencampus_certificate_template_WS2022.png',
        firstname: 'John',
        lastname: 'Doe',
        semester: 'Fall 2023',
        course_name: 'Advanced GraphQL',
        ects: '5',
        practical_project: 'yes',
        online_courses: 'no',
        certificate_text: 'Congratulations!',
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
