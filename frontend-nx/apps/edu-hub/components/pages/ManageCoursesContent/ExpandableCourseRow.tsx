import { FC, Fragment, useCallback, useMemo, useRef, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import { MdCheckBox, MdOutlineCheckBoxOutlineBlank, MdUpload, MdAddCircle, MdEmail } from 'react-icons/md';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { SAVE_COURSE_IMAGE } from '../../../queries/actions';
import { INSERT_COURSE_GROUP_TAG, DELETE_COURSE_GROUP_TAG } from '../../../queries/courseGroup';
import { INSERT_COURSE_DEGREE_TAG, DELETE_COURSE_DEGREE_TAG } from '../../../queries/courseDegree';
import { DELETE_COURSE_INSRTRUCTOR, INSERT_A_COURSEINSTRUCTOR } from '../../../queries/mutateCourseInstructor';
import { USER_SELECTION_WITH_FILTER } from '../../../queries/user';
import { AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';
import {
  DeleteCourseInstructor,
  DeleteCourseInstructorVariables,
} from '../../../queries/__generated__/DeleteCourseInstructor';
import {
  InsertCourseInstructor,
  InsertCourseInstructorVariables,
} from '../../../queries/__generated__/InsertCourseInstructor';
import {
  UserSelectionWithFilter,
  UserSelectionWithFilterVariables,
  UserSelectionWithFilter_User,
} from '../../../queries/__generated__/UserSelectionWithFilter';
import { SaveCourseImage, SaveCourseImageVariables } from '../../../queries/__generated__/SaveCourseImage';
import { UpdateCourseByPk, UpdateCourseByPkVariables } from '../../../queries/__generated__/UpdateCourseByPk';
import { CourseRegistrationType_enum, order_by } from '../../../__generated__/globalTypes';
import { SelectUserDialog } from '../../common/dialogs/SelectUserDialog';
import { SelectOrganizationDialog } from '../../common/dialogs/SelectOrganizationDialog';
import { CreateUserDialog } from '../../common/dialogs/CreateUserDialog';
import {
  INSERT_COURSE_FUNDING_ORGANIZATION,
  DELETE_COURSE_FUNDING_ORGANIZATION,
} from '../../../queries/mutateCourseFundingOrganization';
import {
  InsertCourseFundingOrganization,
  InsertCourseFundingOrganizationVariables,
} from '../../../queries/__generated__/InsertCourseFundingOrganization';
import { OrganizationList_Organization } from '../../../queries/__generated__/OrganizationList';
import EntityListManager from '../../inputs/EntityListManager';
import { getPublicImageUrl, parseFileUploadEvent } from '../../../helpers/filehandling';
import { useTranslations, useLocale } from 'next-intl';
import TagSelector from '../../inputs/TagSelector';
import InputField from '../../inputs/InputField';
import DropDownSelector from '../../inputs/DropDownSelector';
import {
  UPDATE_COURSE_CHAT_LINK,
  UPDATE_COURSE_ECTS,
  UPDATE_COURSE_EXTERNAL_REGISTRATION_LINK,
  UPDATE_COURSE_MAX_MISSED_SESSION,
  UPDATE_COURSE_REGISTRATION_TYPE,
  UPDATE_COURSE_LEARNING_GOALS,
  UPDATE_COURSE_FORMBRICKS_ENROLLMENT_SURVEY,
} from '../../../queries/course';
import { UPDATE_COURSE_PROPERTY } from '../../../queries/mutateCourse';
import useErrorHandler from '../../../hooks/useErrorHandler';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { normalizeErrorKey } from '../../../helpers/errorHandling';
import { useAdminQuery, useLazyRoleQuery } from '../../../hooks/authedQuery';
import {
  GET_COURSE_TEMPLATES_COUNT,
  GET_DEFAULT_TEMPLATES,
  INSERT_EMAIL_TEMPLATE,
} from '../../../queries/emailTemplates';
import { GetCourseTemplatesCount } from '../../../queries/__generated__/GetCourseTemplatesCount';
import { GetDefaultTemplates } from '../../../queries/__generated__/GetDefaultTemplates';
import { InsertEmailTemplate, InsertEmailTemplateVariables } from '../../../queries/__generated__/InsertEmailTemplate';

interface ExpandableCourseRowProps {
  course: AdminCourseList_Course;
  courseGroupOptions: { id: number; name: string }[];
  degreeCourses: { id: number; name: string }[];
  onSetAttendanceCertificatePossible: (c: AdminCourseList_Course, isPossible: boolean) => any;
  onSetAchievementCertificatePossible: (c: AdminCourseList_Course, isPossible: boolean) => any;
}

const ExpandableCourseRow: FC<ExpandableCourseRowProps> = ({
  course,
  courseGroupOptions,
  degreeCourses,
  onSetAttendanceCertificatePossible,
  onSetAchievementCertificatePossible,
}) => {
  const t = useTranslations();
  const router = useRouter();
  const { error, handleError, resetError } = useErrorHandler();

  // Check if course has custom email templates
  const { data: templatesCountData, refetch: refetchTemplatesCount } = useAdminQuery<GetCourseTemplatesCount>(
    GET_COURSE_TEMPLATES_COUNT,
    {
      variables: { courseId: course.id },
    }
  );
  const hasCustomTemplates = (templatesCountData?.MailTemplate_aggregate?.aggregate?.count || 0) > 0;

  // Get default templates
  const { data: defaultTemplatesData } = useAdminQuery<GetDefaultTemplates>(GET_DEFAULT_TEMPLATES);

  const [insertEmailTemplate] = useAdminMutation<InsertEmailTemplate, InsertEmailTemplateVariables>(
    INSERT_EMAIL_TEMPLATE
  );

  const isExternalRegistration = course.registrationType === CourseRegistrationType_enum.EXTERNAL_REGISTRATION;

  // Determine available template types based on registration type
  const getAvailableTemplates = useCallback((): string[] => {
    const allTemplates = [
      'APPLICATION_RECEIVED',
      'APPLICATION_CONFIRMED',
      'SESSION_REMINDER',
      'INVITE',
      'DECLINE',
      'REGISTRATION_CONFIRMED',
    ];

    if (!course.registrationType || course.registrationType === CourseRegistrationType_enum.EXTERNAL_REGISTRATION) {
      return []; // No templates for external registration
    }

    if (
      course.registrationType === CourseRegistrationType_enum.DIRECT_WITH_INPUT ||
      course.registrationType === CourseRegistrationType_enum.DIRECT_CONFIRMATION
    ) {
      return ['REGISTRATION_CONFIRMED', 'SESSION_REMINDER'];
    }

    if (course.registrationType === CourseRegistrationType_enum.APPROVAL_WITH_INPUT) {
      return allTemplates.filter((t) => t !== 'REGISTRATION_CONFIRMED');
    }

    return [];
  }, [course.registrationType]);

  // Handle button click - create templates if needed, then navigate
  const handleManageEmailTemplates = useCallback(async () => {
    if (isExternalRegistration) {
      return;
    }

    // If templates don't exist, create them from defaults
    if (!hasCustomTemplates && defaultTemplatesData?.MailTemplate) {
      const availableTemplateTypes = getAvailableTemplates();
      if (availableTemplateTypes.length > 0) {
        try {
          // Create templates for available types from defaults
          for (const defaultTemplate of defaultTemplatesData.MailTemplate) {
            if (availableTemplateTypes.includes(defaultTemplate.type || '')) {
              try {
                await insertEmailTemplate({
                  variables: {
                    object: {
                      type: defaultTemplate.type,
                      courseId: course.id,
                      subject: defaultTemplate.subject,
                      content: defaultTemplate.content,
                      from: defaultTemplate.from,
                      cc: defaultTemplate.cc,
                      bcc: defaultTemplate.bcc,
                    },
                  },
                  refetchQueries: ['GetCourseTemplatesCount', 'AdminCourseList'],
                });
              } catch (insertError: any) {
                // If template already exists (unique constraint violation), that's okay
                // This can happen if templates were created in another tab/session
                if (
                  insertError?.message?.includes('Uniqueness violation') ||
                  insertError?.message?.includes('duplicate key')
                ) {
                  console.log(`Template ${defaultTemplate.type} already exists for course ${course.id}`);
                } else {
                  // Re-throw other errors to be caught by outer catch
                  throw insertError;
                }
              }
            }
          }
          refetchTemplatesCount();
        } catch (err) {
          console.error('Error creating templates from defaults:', err);
          handleError(err);
          return;
        }
      }
    }

    // Navigate to course-specific templates page
    router.push(`/manage/course/${course.id}/email-templates`);
  }, [
    isExternalRegistration,
    hasCustomTemplates,
    defaultTemplatesData,
    getAvailableTemplates,
    insertEmailTemplate,
    course.id,
    refetchTemplatesCount,
    router,
    handleError,
  ]);

  // Helper function
  const makeFullName = (firstName: string, lastName: string): string => {
    return `${firstName} ${lastName}`;
  };

  // Entity render functions for EntityListManager
  const renderInstructor = useCallback(
    (instructor: any, onDelete: (id: string) => void) => (
      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
        <div className="flex-1">
          <div className="font-medium">
            {makeFullName(instructor.User.firstName, instructor.User.lastName ?? '')}
            {instructor.User.email && (
              <span className="text-sm text-gray-600 ml-1">({instructor.User.email})</span>
            )}
          </div>
        </div>
        <button onClick={() => onDelete(instructor.User.id)} className="text-red-500 hover:text-red-700 p-1">
          ×
        </button>
      </div>
    ),
    []
  );

  const renderFundingOrganization = useCallback(
    (fundingOrg: any, onDelete: (id: number) => void) => (
      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
        <div className="flex-1">
          <div className="font-medium">
            {fundingOrg.Organization.name}
            {fundingOrg.Organization.description && (
              <div className="text-sm text-gray-600 mt-1">{fundingOrg.Organization.description}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">{fundingOrg.Organization.type}</div>
          </div>
        </div>
        <button onClick={() => onDelete(fundingOrg.Organization.id)} className="text-red-500 hover:text-red-700 p-1">
          ×
        </button>
      </div>
    ),
    []
  );

  // Instructor management state
  const [instructorDialogOpen, setInstructorDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [searchValueForNewUser, setSearchValueForNewUser] = useState('');

  // Funding organization management state
  const [fundingOrgDialogOpen, setFundingOrgDialogOpen] = useState(false);

  // Instructor management mutations
  const [insertCourseInstructor] = useAdminMutation<InsertCourseInstructor, InsertCourseInstructorVariables>(
    INSERT_A_COURSEINSTRUCTOR,
    {
      refetchQueries: ['AdminCourseList'],
    }
  );

  const [deleteInstructorAPI] = useAdminMutation<DeleteCourseInstructor, DeleteCourseInstructorVariables>(
    DELETE_COURSE_INSRTRUCTOR,
    {
      refetchQueries: ['AdminCourseList'],
    }
  );

  const [fetchUserByEmail] = useLazyRoleQuery<UserSelectionWithFilter, UserSelectionWithFilterVariables>(
    USER_SELECTION_WITH_FILTER
  );

  // Funding organization management mutations
  const [insertCourseFundingOrg] = useAdminMutation<
    InsertCourseFundingOrganization,
    InsertCourseFundingOrganizationVariables
  >(INSERT_COURSE_FUNDING_ORGANIZATION, {
    refetchQueries: ['AdminCourseList'],
  });


  // Image upload functionality
  const imageUploadRef = useRef<any>(null);
  const handleImageUploadClick = useCallback(() => {
    imageUploadRef.current?.click();
  }, [imageUploadRef]);

  const handleToggleAttendanceCertificatePossible = useCallback(() => {
    onSetAttendanceCertificatePossible(course, !course.attendanceCertificatePossible);
  }, [course, onSetAttendanceCertificatePossible]);

  const handleToggleAchievementCertificatePossible = useCallback(() => {
    onSetAchievementCertificatePossible(course, !course.achievementCertificatePossible);
  }, [course, onSetAchievementCertificatePossible]);

  // Instructor management functions
  const openInstructorDialog = useCallback(() => {
    setInstructorDialogOpen(true);
  }, []);

  const closeInstructorDialog = useCallback(() => {
    setInstructorDialogOpen(false);
  }, []);

  const deleteInstructorFromCourse = useCallback(
    async (userId: string) => {
      const response = await deleteInstructorAPI({
        variables: {
          courseId: course.id,
          userId,
        },
      });

      if (response.errors) {
        handleError(response.errors?.[0]?.message || t('operation_failed'));
        return;
      }
    },
    [deleteInstructorAPI, course.id, handleError, t]
  );

  const addInstructorHandler = useCallback(
    async (confirmed: boolean, user: UserSelectionWithFilter_User | null) => {
      if (!confirmed || user == null) {
        closeInstructorDialog();
        return;
      }

      // Check if user is already an instructor for this course
      if (course.CourseInstructors.some((instructor) => instructor.User.id === user.id)) {
        closeInstructorDialog();
        return;
      }

      const response = await insertCourseInstructor({
        variables: {
          courseId: course.id,
          userId: user.id,
        },
      });

      if (response.errors) {
        handleError(response.errors?.[0]?.message || t('operation_failed'));
        closeInstructorDialog();
        return;
      }

      closeInstructorDialog();
    },
    [course, insertCourseInstructor, closeInstructorDialog, handleError, t]
  );

  const handleAddNewUser = useCallback(
    (searchValue: string) => {
      setSearchValueForNewUser(searchValue);
      setInstructorDialogOpen(false);
      setCreateUserDialogOpen(true);
    },
    []
  );

  const parseSearchValue = useCallback((searchValue: string) => {
    const trimmed = searchValue.trim();
    const parts = trimmed.split(' ');
    if (parts.length >= 2) {
      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
        email: '',
      };
    } else if (trimmed.includes('@')) {
      return {
        firstName: '',
        lastName: '',
        email: trimmed,
      };
    } else {
      return {
        firstName: trimmed,
        lastName: '',
        email: '',
      };
    }
  }, []);

  const handleUserCreated = useCallback(
    async (userId: string, firstName: string, lastName: string, email: string) => {
      setCreateUserDialogOpen(false);

      // Fetch the newly created user to get the full UserSelectionWithFilter_User structure
      try {
        const { data } = await fetchUserByEmail({
          variables: {
            limit: 100,
            filter: {
              _or: [{ id: { _eq: userId } }, { email: { _ilike: `%${email}%` } }],
            },
            order_by: [{ lastName: order_by.asc }, { firstName: order_by.asc }],
          },
        });

        const newUser = data?.User?.find((u) => u.id === userId);
        if (newUser) {
          // Auto-select the new user as instructor
          await addInstructorHandler(true, newUser);
        }
      } catch (error) {
        console.error('Error fetching new user:', error);
        handleError(t('operation_failed'));
      } finally {
        setSearchValueForNewUser('');
      }
    },
    [fetchUserByEmail, addInstructorHandler, handleError, t]
  );

  const parsedSearchValues = parseSearchValue(searchValueForNewUser);

  // Funding organization management functions
  const openFundingOrgDialog = useCallback(() => {
    setFundingOrgDialogOpen(true);
  }, []);

  const closeFundingOrgDialog = useCallback(() => {
    setFundingOrgDialogOpen(false);
  }, []);

  const addFundingOrgHandler = useCallback(
    async (confirmed: boolean, organization: OrganizationList_Organization | null) => {
      if (!confirmed || organization == null) {
        closeFundingOrgDialog();
        return;
      }

      // Check if organization is already associated with the course
      if (course.CourseFundingOrganizations?.some((cfo) => cfo.Organization.id === organization.id)) {
        closeFundingOrgDialog();
        return;
      }

      const response = await insertCourseFundingOrg({
        variables: {
          courseId: course.id,
          organizationId: organization.id,
        },
      });

      if (response.errors) {
        handleError(response.errors?.[0]?.message || t('operation_failed'));
        closeFundingOrgDialog();
        return;
      }

      closeFundingOrgDialog();
    },
    [insertCourseFundingOrg, course, closeFundingOrgDialog, handleError, t]
  );

  const [updateCourse] = useAdminMutation<UpdateCourseByPk, UpdateCourseByPkVariables>(UPDATE_COURSE_PROPERTY);

  const [saveCourseImage] = useAdminMutation<SaveCourseImage, SaveCourseImageVariables>(SAVE_COURSE_IMAGE, {
    onError: (error) => handleError(t(normalizeErrorKey(error.message))),
    refetchQueries: ['AdminCourseList'],
  });

  const handleUploadCourseImageEvent = useCallback(
    async (event: any) => {
      const ufile = await parseFileUploadEvent(event);

      if (ufile != null) {
        const result = await saveCourseImage({
          variables: {
            base64File: ufile.data,
            fileName: ufile.name,
            courseId: course.id,
          },
        });

        const uploadResult = result.data?.saveCourseImage;
        if (uploadResult?.success) {
          await updateCourse({
            variables: {
              id: course.id,
              changes: {
                coverImage: uploadResult.filePath,
              },
            },
            refetchQueries: ['AdminCourseList'],
          });
        } else {
          handleError(t(uploadResult?.messageKey || 'operation-failed'));
        }
      }
    },
    [course.id, saveCourseImage, updateCourse, handleError, t]
  );

  const currentCourseGroups = course.CourseGroups.map((group) => ({
    id: group.CourseGroupOption.id,
    name: group.CourseGroupOption.title
      ? t(`common.course_group_options.${group.CourseGroupOption.title}`)
      : '—',
  }));

  const currentCourseDegrees = course.CourseDegrees.map((degree) => ({
    id: degree.degreeCourseId,
    name: t(degree.DegreeCourse.title),
  }));

  const coverImage = useMemo(() => getPublicImageUrl(course?.coverImage, 460), [course?.coverImage]);

  const registrationTypeOptions = Object.values(CourseRegistrationType_enum).map((type) => ({
    value: type,
    label: t(`manageCourses.registration_type.options.${type}`),
  }));

  return (
    <div className="w-full flex-1 min-w-0">
      <div className="bg-edu-course-list p-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Left Column */}
          <div className="space-y-4 w-full min-w-0">
            {/* 1. Registration Settings - Card Container */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <DropDownSelector
                variant="material"
                label={t('manageCourses.registration_type.label')}
                value={course.registrationType || CourseRegistrationType_enum.APPROVAL_WITH_INPUT}
                options={registrationTypeOptions}
                updateValueMutation={UPDATE_COURSE_REGISTRATION_TYPE}
                identifierVariables={{ itemId: course.id }}
                refetchQueries={['AdminCourseList']}
                helpText={t('manageCourses.registration_type.help_text')}
              />

              {/* External Registration Link */}
              {isExternalRegistration && (
                <InputField
                  variant="material"
                  type="link"
                  label={t('manageCourses.external_registration_link.label')}
                  placeholder={t('manageCourses.external_registration_link.label')}
                  itemId={course.id}
                  value={course.externalRegistrationLink || ''}
                  updateValueMutation={UPDATE_COURSE_EXTERNAL_REGISTRATION_LINK}
                  refetchQueries={['AdminCourseList']}
                  helpText={t('manageCourses.external_registration_link.help_text')}
                />
              )}

              {/* Formbricks Survey Configuration - Show for courses that require input */}
              {(course.registrationType === CourseRegistrationType_enum.APPROVAL_WITH_INPUT ||
                course.registrationType === CourseRegistrationType_enum.DIRECT_WITH_INPUT) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="mb-4">
                    <span>{t('manageCourse.formbricks.title')}</span>
                    <br />
                    <InputField
                      variant="material"
                      type="link"
                      placeholder={course.Program?.defaultFormbricksEnrollmentSurveyUrl || t('manageCourse.formbricks.survey_url_helper')}
                      itemId={course.id}
                      value={course.formbricksEnrollmentSurveyUrl || ''}
                      updateValueMutation={UPDATE_COURSE_FORMBRICKS_ENROLLMENT_SURVEY}
                      refetchQueries={['AdminCourseList']}
                      helpText={t('manageCourse.formbricks.help_text_hidden_fields')}
                      onValueUpdated={() => {
                        // Refetch handled via refetchQueries prop
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Course Organization - Card Container */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <TagSelector
                variant="material"
                label={t('manageCourses.course_degree_title.label')}
                placeholder={t('manageCourses.course_degree_title.placeholder')}
                itemId={course.id}
                values={currentCourseDegrees}
                options={degreeCourses}
                insertValueMutation={INSERT_COURSE_DEGREE_TAG}
                deleteValueMutation={DELETE_COURSE_DEGREE_TAG}
                refetchQueries={['AdminCourseList']}
              />

              <TagSelector
                variant="material"
                label={t('manageCourses.tile_slider_group.label')}
                placeholder={t('manageCourses.tile_slider_group.placeholder')}
                itemId={course.id}
                values={currentCourseGroups}
                options={courseGroupOptions}
                insertValueMutation={INSERT_COURSE_GROUP_TAG}
                deleteValueMutation={DELETE_COURSE_GROUP_TAG}
                refetchQueries={['AdminCourseList']}
              />
            </div>

            {/* 3. Cover Image Upload - Card Container */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">{t('manageCourses.cover_image.label')}</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors bg-gray-50">
                <div className="flex flex-col items-center justify-center space-y-2">
                  {coverImage ? (
                    <div className="relative">
                      <Image
                        src={coverImage}
                        alt={t('manageCourses.cover_image.alt')}
                        width={160}
                        height={96}
                        className="object-contain rounded bg-gray-100"
                        style={{ width: '160px', height: '96px' }}
                      />
                      <button
                        onClick={handleImageUploadClick}
                        className="absolute inset-0 bg-black bg-opacity-50 text-white rounded flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <MdUpload className="w-6 h-6" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleImageUploadClick}
                      className="flex flex-col items-center space-y-2 text-gray-500 hover:text-gray-700"
                    >
                      <MdUpload className="w-8 h-8" />
                      <span className="text-sm">{t('manageCourses.cover_image.upload_text')}</span>
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={imageUploadRef}
                onChange={handleUploadCourseImageEvent}
                className="hidden"
                type="file"
                accept="image/*"
              />
            </div>

            {/* 4. Communication Settings - Card Container */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <InputField
                variant="material"
                type="link"
                label={t('manageCourses.chat_link.label')}
                placeholder={t('manageCourses.chat_link.label')}
                itemId={course.id}
                value={course.chatLink || ''}
                updateValueMutation={UPDATE_COURSE_CHAT_LINK}
                refetchQueries={['AdminCourseList']}
                helpText={t('manageCourses.chat_link.help_text')}
              />

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {t('manageCourses.email_templates.label')}
                </h4>
                <button
                  onClick={handleManageEmailTemplates}
                  disabled={isExternalRegistration}
                  className={`flex items-center space-x-2 px-4 py-2 rounded ${
                    isExternalRegistration
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } transition-colors`}
                >
                  <MdEmail className="w-5 h-5" />
                  <span>
                    {hasCustomTemplates
                      ? t('manageCourses.email_templates.edit_button')
                      : t('manageCourses.email_templates.create_button')}
                  </span>
                </button>
                {isExternalRegistration && (
                  <p className="text-sm text-gray-500 mt-1">
                    {t('manageCourses.email_templates.external_registration_note')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 w-full min-w-0">
            {/* 1. List of Instructors - Card Container */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">{t('manageCourses.instructors.label')}</h4>
              <div className="space-y-2">
                {course.CourseInstructors.map((courseInstructor) => (
                  <Fragment key={courseInstructor.User.id}>
                    {renderInstructor(courseInstructor, deleteInstructorFromCourse)}
                  </Fragment>
                ))}
                <button
                  onClick={openInstructorDialog}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 p-2 w-full rounded hover:bg-blue-50 transition-colors"
                >
                  <MdAddCircle className="w-5 h-5" />
                  <span>{t('manageCourses.instructors.add')}</span>
                </button>
              </div>
            </div>

            {/* 2. Funding Organizations - Card Container */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 w-full">
              <EntityListManager
                variant="material"
                label={t('manageCourses.funding_organizations.label')}
                addButtonText={t('manageCourses.funding_organizations.add')}
                itemId={course.id}
                entities={course.CourseFundingOrganizations || []}
                renderEntity={renderFundingOrganization}
                selectionDialog={
                  <SelectOrganizationDialog
                    onClose={addFundingOrgHandler}
                    open={fundingOrgDialogOpen}
                    title={t('manageCourses.funding_organizations.add')}
                  />
                }
                dialogOpen={fundingOrgDialogOpen}
                onOpenDialog={openFundingOrgDialog}
                onCloseDialog={closeFundingOrgDialog}
                onEntitySelected={addFundingOrgHandler}
                insertEntityMutation={INSERT_COURSE_FUNDING_ORGANIZATION}
                deleteEntityMutation={DELETE_COURSE_FUNDING_ORGANIZATION}
                buildInsertVariables={(courseId, organization) => ({
                  courseId,
                  organizationId: organization.id,
                })}
                buildDeleteVariables={(courseId, organizationId) => ({ courseId, organizationId })}
                refetchQueries={['AdminCourseList']}
              />
            </div>

            {/* 3. Types of Available Certificates - Card Container */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">{t('manageCourses.possible_certificates.label')}</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="cursor-pointer" onClick={handleToggleAttendanceCertificatePossible}>
                    {course.attendanceCertificatePossible ? (
                      <MdCheckBox className="w-6 h-6 text-blue-600" />
                    ) : (
                      <MdOutlineCheckBoxOutlineBlank className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <span>{t('manageCourses.possible_certificates.attendance_certificate')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="cursor-pointer" onClick={handleToggleAchievementCertificatePossible}>
                    {course.achievementCertificatePossible ? (
                      <MdCheckBox className="w-6 h-6 text-blue-600" />
                    ) : (
                      <MdOutlineCheckBoxOutlineBlank className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <span>{t('manageCourses.possible_certificates.achievement_certificate')}</span>
                </div>
                {course.achievementCertificatePossible && (
                  <div className="ml-8 mt-2">
                    <InputField
                      variant="material"
                      type="ects"
                      label={t('manageCourses.ects.label')}
                      placeholder={t('manageCourses.ects.label')}
                      itemId={course.id}
                      value={course.ects || ''}
                      updateValueMutation={UPDATE_COURSE_ECTS}
                      refetchQueries={['AdminCourseList']}
                      helpText={t('manageCourses.ects.help_text')}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 4. Course Requirements - Card Container */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              {/* Maximum Number of Allowed Missing Sessions */}
              <InputField
                variant="material"
                type="number"
                label={t('manageCourses.max_missed_sessions.label')}
                placeholder={t('manageCourses.max_missed_sessions.label')}
                itemId={course.id}
                value={String(course.maxMissedSessions ?? 2)}
                updateValueMutation={UPDATE_COURSE_MAX_MISSED_SESSION}
                refetchQueries={['AdminCourseList']}
                helpText={t('manageCourses.max_missed_sessions.help_text')}
                min={0}
              />
            </div>

            {/* 5. Learning Goals - Card Container */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 [&_.text-gray-400]:text-gray-700">
              <InputField
                variant="eduhub"
                type="textarea"
                value={course.learningGoals ?? ''}
                updateValueMutation={UPDATE_COURSE_LEARNING_GOALS}
                refetchQueries={['AdminCourseList']}
                itemId={course.id}
                label={t('manageCourses.learning_goals.label')}
                placeholder={t('manageCourses.learning_goals.placeholder')}
                helpText={t('manageCourses.learning_goals.help_text')}
                maxLength={500}
                className="h-32 !text-gray-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Instructor Management Dialog */}
      {instructorDialogOpen && (
        <SelectUserDialog
          onClose={addInstructorHandler}
          open={instructorDialogOpen}
          title={t('manageCourses.instructors.add')}
          onAddNewUser={handleAddNewUser}
          showAddNewUserOption={true}
        />
      )}

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createUserDialogOpen}
        onClose={() => {
          setCreateUserDialogOpen(false);
          setSearchValueForNewUser('');
        }}
        onSuccess={() => {
          // Refetch handled in handleUserCreated
        }}
        onUserCreated={handleUserCreated}
        initialFirstName={parsedSearchValues.firstName}
        initialLastName={parsedSearchValues.lastName}
        initialEmail={parsedSearchValues.email}
      />

      {/* Error Message Dialog */}
      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
    </div>
  );
};

export default ExpandableCourseRow;
