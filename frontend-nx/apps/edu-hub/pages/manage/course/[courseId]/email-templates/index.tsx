import Head from 'next/head';
import { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Page } from '../../../../../components/layout/Page';
import { useIsAdmin, useIsLoggedIn } from '../../../../../hooks/authentication';
import { useAdminQuery } from '../../../../../hooks/authedQuery';
import { useAdminMutation } from '../../../../../hooks/authedMutation';
import { useTranslations } from 'next-intl';
import Loading from '../../../../../components/common/Loading';
import { MANAGED_COURSE } from '../../../../../queries/course';
import { ManagedCourse } from '../../../../../queries/__generated__/ManagedCourse';
import ManageEmailTemplatesContent from '../../../../../components/pages/ManageEmailTemplatesContent';
import { getEmailTemplateTypesForCourseRegistration } from '../../../../../utils/getEmailTemplateTypesForCourseRegistration';
import {
  GET_DEFAULT_TEMPLATES,
  GET_COURSE_TEMPLATES_COUNT,
  INSERT_EMAIL_TEMPLATE,
} from '../../../../../queries/emailTemplates';
import { GetDefaultTemplates } from '../../../../../queries/__generated__/GetDefaultTemplates';
import { GetCourseTemplatesCount } from '../../../../../queries/__generated__/GetCourseTemplatesCount';
import { InsertEmailTemplate, InsertEmailTemplateVariables } from '../../../../../queries/__generated__/InsertEmailTemplate';

const CourseEmailTemplates: FC = () => {
  const router = useRouter();
  const { courseId } = router.query;
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();
  const t = useTranslations('manageEmailTemplates');

  const courseIdNumber = courseId ? parseInt(courseId as string, 10) : null;
  const isValidCourseId = courseIdNumber !== null && Number.isInteger(courseIdNumber) && courseIdNumber > 0;
  const [templatesCreated, setTemplatesCreated] = useState(false);

  // Skip until the session is ready: the Apollo auth link only attaches the
  // Authorization/role headers once the access token is in the auth store, so
  // firing earlier sends the queries unauthenticated and Hasura rejects them.
  const { data, loading, error } = useAdminQuery<ManagedCourse>(MANAGED_COURSE, {
    variables: { id: courseIdNumber || 0 },
    skip: !isLoggedIn || !isAdmin || !isValidCourseId,
  });

  // Check if course has templates
  const { data: templatesCountData, refetch: refetchTemplatesCount } = useAdminQuery<GetCourseTemplatesCount>(
    GET_COURSE_TEMPLATES_COUNT,
    {
      variables: { courseId: courseIdNumber || 0 },
      skip: !isLoggedIn || !isAdmin || !isValidCourseId,
    }
  );

  // Get default templates
  const { data: defaultTemplatesData } = useAdminQuery<GetDefaultTemplates>(GET_DEFAULT_TEMPLATES, {
    skip: !isLoggedIn || !isAdmin,
  });

  const [insertEmailTemplate] = useAdminMutation<InsertEmailTemplate, InsertEmailTemplateVariables>(
    INSERT_EMAIL_TEMPLATE
  );

  // Create templates from defaults if they don't exist
  useEffect(() => {
    const createTemplatesFromDefaults = async () => {
      if (
        !isValidCourseId ||
        !courseIdNumber ||
        !defaultTemplatesData?.MailTemplate ||
        templatesCreated ||
        (templatesCountData?.MailTemplate_aggregate?.aggregate?.count || 0) > 0
      ) {
        return;
      }

      const course = data?.Course_by_pk;
      if (!course) return;

      const availableTemplateTypes = getEmailTemplateTypesForCourseRegistration(course.registrationType);
      if (availableTemplateTypes.length === 0) return;

      try {
        // Create templates for available types from defaults
        for (const defaultTemplate of defaultTemplatesData.MailTemplate) {
          if (availableTemplateTypes.includes(defaultTemplate.type || '')) {
            try {
              await insertEmailTemplate({
                variables: {
                  object: {
                    type: defaultTemplate.type,
                    courseId: courseIdNumber,
                    subject: defaultTemplate.subject,
                    content: defaultTemplate.content,
                    from: defaultTemplate.from,
                    cc: defaultTemplate.cc,
                    bcc: defaultTemplate.bcc,
                  },
                },
                refetchQueries: ['GetCourseTemplatesCount', 'EmailTemplatesList'],
              });
            } catch (insertError: any) {
              // If template already exists (unique constraint violation), that's okay
              // This can happen if templates were created in another tab/session
              if (
                insertError?.message?.includes('Uniqueness violation') ||
                insertError?.message?.includes('duplicate key')
              ) {
                console.log(`Template ${defaultTemplate.type} already exists for course ${courseIdNumber}`);
              } else {
                // Re-throw other errors
                throw insertError;
              }
            }
          }
        }
        setTemplatesCreated(true);
        refetchTemplatesCount();
      } catch (err) {
        console.error('Error creating templates from defaults:', err);
      }
    };

    createTemplatesFromDefaults();
  }, [
    isValidCourseId,
    courseIdNumber,
    defaultTemplatesData,
    templatesCountData,
    templatesCreated,
    data,
    insertEmailTemplate,
    refetchTemplatesCount,
  ]);

  if (!isLoggedIn || !isAdmin) {
    return <div>Waiting for authentication!</div>;
  }

  if (!isValidCourseId) {
    return (
      <Page>
        <div className="min-h-[77vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Invalid Course ID</h2>
            <p className="text-gray-600 mb-4">The course ID in the URL is invalid.</p>
          </div>
        </div>
      </Page>
    );
  }

  if (loading) {
    return <Loading />;
  }

  if (error || !data?.Course_by_pk) {
    return <div>Course not found</div>;
  }

  const course = data.Course_by_pk;
  const availableTemplateTypes = getEmailTemplateTypesForCourseRegistration(course.registrationType);

  return (
    <>
      <Head>
        <title>EduHub | {course.title} - Email Templates</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">
          <ManageEmailTemplatesContent
            courseId={courseIdNumber}
            courseTitle={course.title}
            explanatoryText={(() => {
              try {
                const key = 'course_specific_explanation';
                const translation = t(key);
                return translation !== key ? translation : 'These email templates are specific to this course and will override the default templates when sending emails for this course.';
              } catch {
                return 'These email templates are specific to this course and will override the default templates when sending emails for this course.';
              }
            })()}
            showBackButton={true}
            availableTemplateTypes={availableTemplateTypes}
          />
        </div>
      </Page>
    </>
  );
};

export default CourseEmailTemplates;

