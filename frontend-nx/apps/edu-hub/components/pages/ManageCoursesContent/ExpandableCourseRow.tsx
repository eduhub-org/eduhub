import { FC, Fragment, useCallback, useMemo, useState, useEffect } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import { MdCheckBox, MdOutlineCheckBoxOutlineBlank, MdAddCircle, MdEmail, MdForum } from 'react-icons/md';
import { useRouter } from 'next/router';
import { useManageMutation } from '../../../hooks/authedMutation';
import { SAVE_COURSE_IMAGE } from '../../../queries/actions';
import { INSERT_COURSE_GROUP_TAG, DELETE_COURSE_GROUP_TAG } from '../../../queries/courseGroup';
import { INSERT_COURSE_DEGREE_TAG, DELETE_COURSE_DEGREE_TAG } from '../../../queries/courseDegree';
import { DELETE_COURSE_INSRTRUCTOR, INSERT_A_COURSEINSTRUCTOR } from '../../../queries/mutateCourseInstructor';
import { USER_SELECTION_WITH_FILTER, buildUserSelectionFilter } from '../../../queries/user';
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
import { CourseRegistrationType_enum, order_by } from '../../../__generated__/globalTypes';
import { getEmailTemplateTypesForCourseRegistration } from '../../../utils/getEmailTemplateTypesForCourseRegistration';
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
import { useTranslations } from 'next-intl';
import TagSelector from '../../inputs/TagSelector';
import { isKnownCourseGroupOptionTitle } from '../../../helpers/courseGroupOptions';
import InputField from '../../inputs/InputField';
import DropDownSelector from '../../inputs/DropDownSelector';
import FileUploadField from '../../inputs/FileUploadField';
import DatePicker from '../../inputs/DatePicker';
import {
  UPDATE_COURSE_ECTS,
  UPDATE_COURSE_EXTERNAL_REGISTRATION_LINK,
  UPDATE_COURSE_MAX_MISSED_SESSION,
  UPDATE_COURSE_REGISTRATION_TYPE,
  UPDATE_COURSE_LEARNING_GOALS,
  SAVE_COURSE_FORMBRICKS_ENROLLMENT_SURVEY,
  UPDATE_COURSE_BASE_PRICE,
  UPDATE_COURSE_CURRENCY,
  UPDATE_COURSE_PROJECT_SUBMISSION_DEADLINE,
  UPDATE_COURSE_REQUIRED_ECTS,
  UPDATE_COURSE_REQUIRED_EVENT_COUNT,
} from '../../../queries/course';
import { VALIDATE_FORMBRICKS_SURVEY, SAVE_ADDON_MAPPINGS, CREATE_STRIPE_BASE_PRICE, GET_COURSE_ADDON_MAPPINGS } from '../../../queries/stripe';
import { AddonValidationDialog } from './AddonValidationDialog';
import CreateMatrixRoomDialog from './CreateMatrixRoomDialog';
import { Button } from '../../common/Button';
import Card from '../../common/Card';
import { ProgramType } from '../../../types/enums';
import { UPDATE_COURSE_PROPERTY } from '../../../queries/mutateCourse';
import useErrorHandler from '../../../hooks/useErrorHandler';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { InfoDialog } from '../../common/dialogs/InfoDialog';
import { translateErrorMessage } from '../../../helpers/errorHandling';
import { submissionDeadlineToCalendarDate } from '../CourseContent/Projects/projectEffectiveSubmissionDeadline';
import { useRoleQuery, useLazyRoleQuery } from '../../../hooks/authedQuery';
import { useCurrentRole } from '../../../hooks/authentication';
import { useManagementRoleContext } from '../../../hooks/managementRole';
import PricingSummary from '../../common/PricingSummary';
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
  sliderCourseGroupIds: number[];
  degreeCourses: { id: number; name: string }[];
  onSetAttendanceCertificatePossible: (c: AdminCourseList_Course, isPossible: boolean) => any;
  onSetAchievementCertificatePossible: (c: AdminCourseList_Course, isPossible: boolean) => any;
}

const ExpandableCourseRow: FC<ExpandableCourseRowProps> = ({
  course,
  courseGroupOptions,
  sliderCourseGroupIds,
  degreeCourses,
  onSetAttendanceCertificatePossible,
  onSetAchievementCertificatePossible,
}) => {
  const t = useTranslations();
  const router = useRouter();
  const { error, handleError, resetError } = useErrorHandler();
  const managementRole = useManagementRoleContext();
  const currentRole = useCurrentRole();
  const queryRole = managementRole ?? currentRole;

  // Check if course has custom email templates
  const { data: templatesCountData, refetch: refetchTemplatesCount } = useRoleQuery<GetCourseTemplatesCount>(
    GET_COURSE_TEMPLATES_COUNT,
    {
      variables: { courseId: course.id },
    }
  );
  const hasCustomTemplates = (templatesCountData?.MailTemplate_aggregate?.aggregate?.count || 0) > 0;

  // Get default templates
  const { data: defaultTemplatesData } = useRoleQuery<GetDefaultTemplates>(GET_DEFAULT_TEMPLATES);

  const [insertEmailTemplate] = useManageMutation<InsertEmailTemplate, InsertEmailTemplateVariables>(
    INSERT_EMAIL_TEMPLATE
  );

  const isExternalRegistration = course.registrationType === CourseRegistrationType_enum.EXTERNAL_REGISTRATION;

  // A "degree" is a course inside a DEGREES program; only such a course carries
  // completion thresholds for its degree certificate.
  const isDegreeCourse = course.Program?.type === ProgramType.DEGREES;

  const projectSubmissionDeadlineValue = useMemo(
    () => submissionDeadlineToCalendarDate(course.projectSubmissionDeadline),
    [course.projectSubmissionDeadline]
  );

  // Check if course requires payment
  const requiresPayment = course.registrationType === 'DIRECT_WITH_INPUT_AND_PAYMENT' ||
    course.registrationType === 'DIRECT_CONFIRMATION_AND_PAYMENT';

  // Payment and add-on validation state
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [addonQuestions, setAddonQuestions] = useState<any[]>([]);
  const [isValidatingSurvey, setIsValidatingSurvey] = useState(false);
  const [isSavingMappings, setIsSavingMappings] = useState(false);

  // Formbricks help dialog state
  const [isFormbricksHelpDialogOpen, setIsFormbricksHelpDialogOpen] = useState(false);

  // Base price help dialog state
  const [isBasePriceHelpDialogOpen, setIsBasePriceHelpDialogOpen] = useState(false);

  // Stripe sync state
  const [isStripeSyncing, setIsStripeSyncing] = useState(false);
  const [stripeSyncStatus, setStripeSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const [validateSurvey] = useManageMutation(VALIDATE_FORMBRICKS_SURVEY);
  const [saveAddonMappings] = useManageMutation(SAVE_ADDON_MAPPINGS);
  const [createStripeBasePrice] = useManageMutation(CREATE_STRIPE_BASE_PRICE);

  // Fetch addon mappings for the course
  const { data: addonMappingsData, refetch: refetchAddonMappings } = useRoleQuery(GET_COURSE_ADDON_MAPPINGS, {
    variables: { courseId: course.id },
    skip: !requiresPayment, // Only fetch for payment-enabled courses
  });
  const addonMappings = addonMappingsData?.CourseAddonMapping || [];


  // Handle survey validation
  const handleValidateSurvey = useCallback(async () => {
    const surveyUrl = course.formbricksEnrollmentSurveyUrl || course.Program?.defaultFormbricksEnrollmentSurveyUrl;
    if (!surveyUrl) {
      handleError(t('manageCourse.formbricks.no_survey_url'));
      return;
    }

    setIsValidatingSurvey(true);
    try {
      const result = await validateSurvey({
        variables: {
          surveyUrl,
          courseId: course.id,
        },
      });

      if (result.data?.validateFormbricksSurvey?.success) {
        setAddonQuestions(result.data.validateFormbricksSurvey.addonQuestions || []);
        setIsValidationDialogOpen(true);
      } else {
        handleError(result.data?.validateFormbricksSurvey?.error || 'Validation failed');
      }
    } catch (err: any) {
      handleError(err?.message || 'Validation failed');
    } finally {
      setIsValidatingSurvey(false);
    }
  }, [course, validateSurvey, handleError, t]);

  // Handle saving add-on mappings
  const handleSaveAddonMappings = useCallback(async (mappings: any[]) => {
    setIsSavingMappings(true);
    try {
      const result = await saveAddonMappings({
        variables: {
          courseId: course.id,
          mappings,
        },
        refetchQueries: [
          //{ query: GET_COURSE_ADDON_MAPPINGS, variables: { courseId: course.id } },
          'AdminCourseList'
        ],
        awaitRefetchQueries: true,
        errorPolicy: 'all', // Return partial data even if there are errors
      });

      // Check if mutation succeeded even if there were GraphQL errors
      if (result.data?.saveAddonMappings?.success) {
        setIsValidationDialogOpen(false);
        //Manually refetch to ensure UI updates immediately
        if (refetchAddonMappings) {
          await refetchAddonMappings();
        }
      } else if (result.errors && result.errors.length > 0) {
        // Check if it's just a stripeResults field error but mutation succeeded
        const hasStripeResultsError = result.errors.some(
          (e: any) => e.message?.includes('stripeResults') || e.message?.includes('Cannot query field')
        );
        if (hasStripeResultsError && result.data?.saveAddonMappings) {
          // Mutation likely succeeded, just schema mismatch
          console.warn('GraphQL schema mismatch with stripeResults field, but mutation may have succeeded');
          setIsValidationDialogOpen(false);
          // The refetchQueries should update the UI
        } else {
          handleError(result.data?.saveAddonMappings?.error || result.errors[0]?.message || 'Failed to save mappings');
        }
      } else {
        handleError(result.data?.saveAddonMappings?.error || 'Failed to save mappings');
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.graphQLErrors?.[0]?.message || 'Failed to save mappings';
      handleError(errorMessage);
    } finally {
      setIsSavingMappings(false);
    }
  }, [course.id, saveAddonMappings, handleError, refetchAddonMappings]);

  // Handle Stripe base price sync
  const handleSyncStripeBasePrice = useCallback(async () => {
    const basePrice = (course as any).basePrice || 0;
    const currency = (course as any).currency || 'EUR';
    
    if (basePrice <= 0) {
      setStripeSyncStatus('idle');
      return;
    }
    
    setIsStripeSyncing(true);
    setStripeSyncStatus('syncing');
    
    try {
      const result = await createStripeBasePrice({
        variables: {
          courseId: course.id,
          basePrice: basePrice,
          currency: currency,
          courseTitle: course.title,
        },
        refetchQueries: ['AdminCourseList'],
      });
      
      if (result.data?.createStripeBasePrice?.success) {
        setStripeSyncStatus('success');
        // Reset to idle after 3 seconds
        setTimeout(() => setStripeSyncStatus('idle'), 3000);
      } else {
        setStripeSyncStatus('error');
        handleError(result.data?.createStripeBasePrice?.error || 'Stripe sync failed');
      }
    } catch (err: any) {
      setStripeSyncStatus('error');
      handleError(err?.message || 'Failed to sync with Stripe');
    } finally {
      setIsStripeSyncing(false);
    }
  }, [course, createStripeBasePrice, handleError]);

  // Auto-sync on mount if base price exists but no Stripe product
  useEffect(() => {
    const basePrice = (course as any).basePrice || 0;
    const hasStripeProduct = !!(course as any).stripeProductId;
    if (requiresPayment && basePrice > 0 && !hasStripeProduct && stripeSyncStatus === 'idle' && !isStripeSyncing) {
      // Auto-sync after a short delay to avoid blocking render
      const timer = setTimeout(() => {
        handleSyncStripeBasePrice();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [course, requiresPayment, stripeSyncStatus, isStripeSyncing, handleSyncStripeBasePrice]);

  // Handle button click - create templates if needed, then navigate
  const handleManageEmailTemplates = useCallback(async () => {
    if (isExternalRegistration) {
      return;
    }

    // If templates don't exist, create them from defaults
    if (!hasCustomTemplates && defaultTemplatesData?.MailTemplate) {
      const availableTemplateTypes = getEmailTemplateTypesForCourseRegistration(course.registrationType);
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
              } catch (insertError: any                ) {
                  // If template already exists (unique constraint violation), that's okay
                  // This can happen if templates were created in another tab/session
                  if (
                    insertError?.message?.includes('Uniqueness violation') ||
                    insertError?.message?.includes('duplicate key')
                  ) {
                    // Template already exists, continue silently
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
          handleError(err instanceof Error ? err.message : String(err));
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
    course.registrationType,
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
      <div className="flex items-center justify-between bg-bg-secondary p-2 rounded">
        <div className="flex-1">
          <div className="font-medium text-label-primary">
            {makeFullName(instructor.User.firstName, instructor.User.lastName ?? '')}
            {instructor.User.email && (
              <span className="text-sm text-label-secondary ml-1">({instructor.User.email})</span>
            )}
          </div>
        </div>
        <button onClick={() => onDelete(String(instructor.User.id))} className="text-error hover:text-error p-1">
          ×
        </button>
      </div>
    ),
    []
  );

  const renderFundingOrganization = useCallback(
    (fundingOrg: any, onDelete: (id: number) => void) => (
      <div className="flex items-center justify-between bg-bg-secondary p-2 rounded">
        <div className="flex-1">
          <div className="font-medium text-label-primary">
            {fundingOrg.Organization.name}
            {fundingOrg.Organization.description && (
              <div className="text-sm text-label-secondary mt-1">{fundingOrg.Organization.description}</div>
            )}
            <div className="text-xs text-label-secondary mt-1">{fundingOrg.Organization.type}</div>
          </div>
        </div>
        <button onClick={() => onDelete(fundingOrg.Organization.id)} className="text-error hover:text-error p-1">
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
  const [matrixDialogOpen, setMatrixDialogOpen] = useState(false);

  // Instructor management mutations
  const [insertCourseInstructor] = useManageMutation<InsertCourseInstructor, InsertCourseInstructorVariables>(
    INSERT_A_COURSEINSTRUCTOR,
    {
      refetchQueries: ['AdminCourseList'],
    }
  );

  const [deleteInstructorAPI] = useManageMutation<DeleteCourseInstructor, DeleteCourseInstructorVariables>(
    DELETE_COURSE_INSRTRUCTOR,
    {
      refetchQueries: ['AdminCourseList'],
    }
  );

  const [fetchUserByEmail] = useLazyRoleQuery<UserSelectionWithFilter, UserSelectionWithFilterVariables>(
    USER_SELECTION_WITH_FILTER
  );

  // Funding organization management mutations
  const [insertCourseFundingOrg] = useManageMutation<
    InsertCourseFundingOrganization,
    InsertCourseFundingOrganizationVariables
  >(INSERT_COURSE_FUNDING_ORGANIZATION, {
    refetchQueries: ['AdminCourseList'],
  });



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
    async (userId: string, _firstName: string, _lastName: string, email: string) => {
      setCreateUserDialogOpen(false);

      // Fetch the newly created user to get the full UserSelectionWithFilter_User structure
      try {
        const { data } = await fetchUserByEmail({
          variables: {
            limit: 100,
            filter: buildUserSelectionFilter(
              {
                _or: [{ id: { _eq: userId } }, { email: { _ilike: `%${email}%` } }],
              },
              queryRole
            ),
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
    [fetchUserByEmail, addInstructorHandler, handleError, queryRole, t]
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


  const currentCourseGroups = course.CourseGroups.map((group) => {
    const title = group.CourseGroupOption.title;
    return {
      id: group.CourseGroupOption.id,
      name: isKnownCourseGroupOptionTitle(title) ? t(`common.course_group_options.${title}`) : title ?? '—',
    };
  });

  const currentCourseDegrees = course.CourseDegrees.map((degree) => ({
    id: degree.degreeCourseId,
    name: t(degree.DegreeCourse.title),
  }));

  const registrationTypeOptions = Object.values(CourseRegistrationType_enum).map((type) => ({
    value: type,
    label: t(`manageCourses.registration_type.options.${type}`),
  }));

  const matrixRoomId = (course as any).matrixRoomId as string | undefined;
  const elementBaseUrl = process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL?.replace(/\/+$/, '');
  const derivedMatrixLink =
    matrixRoomId && elementBaseUrl ? `${elementBaseUrl}/#/room/${matrixRoomId}` : '';
  const legacyChatUrl = course.chatLink?.trim() ? course.chatLink.trim() : '';
  const openParticipantChatHref = derivedMatrixLink || legacyChatUrl || '';

  const isLikelyMattermostChatUrl = (url: string) => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host.includes('mattermost') || host.includes('chat.opencampus');
    } catch {
      return false;
    }
  };

  let participantChatButtonKey = 'manageCourses.participant_chat.button_open_chat';
  if (matrixRoomId) {
    participantChatButtonKey = 'manageCourses.participant_chat.button_open_element';
  } else if (legacyChatUrl && isLikelyMattermostChatUrl(legacyChatUrl)) {
    participantChatButtonKey = 'manageCourses.participant_chat.button_open_mattermost';
  }

  return (
    <div className="w-full flex-1 min-w-0 light">
      <div className="bg-bg-secondary p-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Left Column */}
          <div className="space-y-4 w-full min-w-0">
            {/* 1. Registration Settings - Card Container */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4 space-y-4">
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
                course.registrationType === CourseRegistrationType_enum.DIRECT_WITH_INPUT ||
                course.registrationType === 'DIRECT_WITH_INPUT_AND_PAYMENT') && (
                <div className="mt-4 pt-4 border-t border-border-primary">
                  <div className="mb-4">
                    <span>{t('manageCourse.formbricks.title')}</span>
                    <br />
                    <InputField
                      variant="material"
                      type="link"
                      placeholder={course.Program?.defaultFormbricksEnrollmentSurveyUrl || t('manageCourse.formbricks.survey_url_helper')}
                      itemId={course.id}
                      value={course.formbricksEnrollmentSurveyUrl || ''}
                      updateValueMutation={SAVE_COURSE_FORMBRICKS_ENROLLMENT_SURVEY}
                      refetchQueries={['AdminCourseList']}
                      helpText={t('manageCourse.formbricks.help_text')}
                      onValueUpdated={() => {
                        // Refetch handled via refetchQueries prop
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setIsFormbricksHelpDialogOpen(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                    >
                      {t('manageCourse.formbricks.learn_more')}
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Configuration - Show for courses that require payment */}
              {requiresPayment && (
                <div className="mt-4 pt-4 border-t border-border-primary">
                  <div className="space-y-4">
                    <div>
                      <span className="font-medium">{t('manageCourse.pricing.title')}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <InputField
                          variant="material"
                          type="number"
                          label={t('manageCourse.pricing.base_price')}
                          placeholder="0"
                          itemId={course.id}
                          value={(course as any).basePrice?.toString() || '0'}
                          updateValueMutation={UPDATE_COURSE_BASE_PRICE}
                          refetchQueries={['AdminCourseList']}
                          helpText={t('manageCourse.pricing.base_price_help')}
                          min={0}
                          onValueUpdated={handleSyncStripeBasePrice}
                        />
                        <button
                          type="button"
                          onClick={() => setIsBasePriceHelpDialogOpen(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                        >
                          {t('manageCourse.pricing.base_price_learn_more')}
                        </button>
                      </div>

                      <DropDownSelector
                        variant="material"
                        label={t('manageCourse.pricing.currency')}
                        value={(course as any).currency || 'EUR'}
                        options={[
                          { value: 'EUR', label: 'EUR (€)' },
                          { value: 'USD', label: 'USD ($)' },
                          { value: 'GBP', label: 'GBP (£)' },
                        ]}
                        updateValueMutation={UPDATE_COURSE_CURRENCY}
                        identifierVariables={{ itemId: course.id }}
                        refetchQueries={['AdminCourseList']}
                        onValueUpdated={handleSyncStripeBasePrice}
                      />
                    </div>

                    {/* Survey Validation - Show if survey URL exists */}
                    {(course.formbricksEnrollmentSurveyUrl || course.Program?.defaultFormbricksEnrollmentSurveyUrl) && (
                      <div className="mt-4">
                        <Button
                          onClick={handleValidateSurvey}
                          disabled={isValidatingSurvey}
                        >
                          {isValidatingSurvey ? t('manageCourse.pricing.validating') : t('manageCourse.pricing.validate_addons')}
                        </Button>
                        <p className="text-sm text-label-secondary mt-2">
                          {t('manageCourse.pricing.validate_help')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Course Group - Card Container */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-label-primary">{t('manageCourses.course_group.label')}</h4>
              <TagSelector
                variant="material"
                label={t('manageCourses.course_group.label')}
                placeholder={t('manageCourses.course_group.placeholder')}
                itemId={course.id}
                values={currentCourseGroups}
                options={courseGroupOptions}
                markedOptionIds={sliderCourseGroupIds}
                markLabel={t('manageCourses.course_group.slider_badge')}
                insertValueMutation={INSERT_COURSE_GROUP_TAG}
                deleteValueMutation={DELETE_COURSE_GROUP_TAG}
                refetchQueries={['AdminCourseList']}
              />
            </div>

            {/* 3. Cover Image Upload - Card Container */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4">
              <h4 className="text-sm font-medium text-label-primary mb-3">{t('manageCourses.cover_image.label')}</h4>
              <FileUploadField
                variant="material"
                currentFileUrl={course?.coverImage}
                uploadMutation={SAVE_COURSE_IMAGE}
                updateMutation={UPDATE_COURSE_PROPERTY}
                identifierVariables={{ id: course.id }}
                uploadIdentifierVariables={{ courseId: course.id }}
                updateFieldName="coverImage"
                useChangesObject={true}
                acceptedFileTypes="image/*"
                maxFileSize={5 * 1024 * 1024}
                uploadText={t('manageCourses.cover_image.upload_text')}
                altText={t('manageCourses.cover_image.alt')}
                imageWidth={160}
                imageHeight={96}
                showFileName={true}
                refetchQueries={['AdminCourseList']}
                onUploadError={(error) => {
                  // Normalize error key: lowercase and add file_upload namespace prefix
                  const normalizedKey = error.toLowerCase().replaceAll('.', '_');
                  const fileUploadKey = `file_upload.${normalizedKey}`;
                  // Try file_upload namespace first, fall back to generic translation
                  const translated = t(fileUploadKey) === fileUploadKey ? translateErrorMessage(error, t) : t(fileUploadKey);
                  handleError(translated);
                }}
              />
            </div>

            {/* 4. Participant chat (Matrix / legacy channel) */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-label-primary">
                {t('manageCourses.participant_chat.title')}
              </h4>
              <div className="flex items-center gap-3 flex-wrap">
                {openParticipantChatHref ? (
                  <Button
                    as="a"
                    href={openParticipantChatHref}
                    target="_blank"
                    rel="noreferrer"
                    filled
                  >
                    <span className="inline-flex items-center gap-2">
                      <MdForum className="w-4 h-4" />
                      {t(participantChatButtonKey)}
                    </span>
                  </Button>
                ) : (
                  <Button onClick={() => setMatrixDialogOpen(true)}>
                    <span className="inline-flex items-center gap-2">
                      <MdForum className="w-4 h-4" />
                      {t('manageCourses.matrix_room.button_create')}
                    </span>
                  </Button>
                )}
              </div>
            </div>

            {/* 5. Email Templates - Card Container */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-label-primary mb-2">
                {t('manageCourses.email_templates.label')}
              </h4>
              <button
                onClick={handleManageEmailTemplates}
                disabled={isExternalRegistration}
                className={`flex items-center space-x-2 px-4 py-2 rounded ${
                  isExternalRegistration
                    ? 'bg-fill-disabled text-label-disabled cursor-not-allowed'
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
                <p className="text-sm text-label-secondary mt-1">
                  {t('manageCourses.email_templates.external_registration_note')}
                </p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 w-full min-w-0">
            {/* 1. Pricing Summary - Read-only Display (only for payment courses) */}
            {requiresPayment && (
              <>
                {(course as any).basePrice > 0 || (addonMappings && addonMappings.length > 0) ? (
                  <>
                    <PricingSummary
                      basePrice={(course as any).basePrice || 0}
                      currency={(course as any).currency || 'EUR'}
                      stripeProductId={(course as any).stripeProductId}
                      stripePriceId={(course as any).stripePriceId}
                      addons={addonMappings || []}
                      showStripeStatus={true}
                      showTotal={false}
                    />
                    
                    {/* Hint for managing addons */}
                    {addonMappings && addonMappings.length > 0 && (
                      <p className="text-xs text-label-secondary mt-2 italic px-4">
                        {t('manageCourse.addons.manage_hint')}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="bg-fill-primary border border-border-primary rounded-lg p-4">
                    <p className="text-sm text-label-secondary italic">
                      {t('manageCourse.pricing.no_pricing_configured')}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* 2. List of Instructors - Card Container */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4">
              <h4 className="text-sm font-medium text-label-primary mb-3">{t('manageCourses.instructors.label')}</h4>
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

            {/* 3. Funding Organizations - Card Container */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4 w-full">
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

            {/* 3. Certificates - Card Container - hidden for a degree: the flags are
                forced by a trigger (achievement possible, attendance not), a degree is
                not assigned to another degree, and its ECTS is edited in the degree
                requirements card below. */}
            {!isDegreeCourse && (
              <div className="bg-fill-primary border border-border-primary rounded-lg p-4">
                <h4 className="text-sm font-medium text-label-primary mb-3">{t('manageCourses.certificates.label')}</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      onClick={handleToggleAttendanceCertificatePossible}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleAttendanceCertificatePossible();
                        }
                      }}
                      aria-label={t('manageCourses.possible_certificates.attendance_certificate')}
                    >
                      {course.attendanceCertificatePossible ? (
                        <MdCheckBox className="w-6 h-6 text-blue-600" />
                      ) : (
                        <MdOutlineCheckBoxOutlineBlank className="w-6 h-6 text-label-disabled" />
                      )}
                    </button>
                    <span>{t('manageCourses.possible_certificates.attendance_certificate')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      onClick={handleToggleAchievementCertificatePossible}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleAchievementCertificatePossible();
                        }
                      }}
                      aria-label={t('manageCourses.possible_certificates.achievement_certificate')}
                    >
                      {course.achievementCertificatePossible ? (
                        <MdCheckBox className="w-6 h-6 text-blue-600" />
                      ) : (
                        <MdOutlineCheckBoxOutlineBlank className="w-6 h-6 text-label-disabled" />
                      )}
                    </button>
                    <span>{t('manageCourses.possible_certificates.achievement_certificate')}</span>
                  </div>
                  {course.achievementCertificatePossible && (
                    <div className="ml-8 mt-2 space-y-4">
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

                      <DatePicker
                        variant="material"
                        label={t('manageCourses.project_options.submission_deadline.label')}
                        helpText={t('manageCourses.project_options.submission_deadline.help_text')}
                        itemId={course.id}
                        value={projectSubmissionDeadlineValue}
                        updateValueMutation={UPDATE_COURSE_PROJECT_SUBMISSION_DEADLINE}
                        identifierVariables={{ itemId: course.id }}
                        dateFieldName="value"
                        refetchQueries={['AdminCourseList']}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border-primary">
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
                </div>
              </div>
            )}

            {/* 5. Course Requirements - Card Container - a degree has no sessions,
                so nothing can be missed. */}
            {!isDegreeCourse && (
              <div className="bg-fill-primary border border-border-primary rounded-lg p-4 space-y-4">
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
            )}

            {/* Degree requirements - only for a course in a DEGREES program. An empty
                field means that requirement is not checked when the degree
                certificate is generated. */}
            {isDegreeCourse && (
              <Card
                title={t('manageCourses.degree_requirements.label')}
                helpText={t('manageCourses.degree_requirements.help_text')}
                className="space-y-4"
              >
                <InputField
                  variant="material"
                  type="decimal"
                  label={t('manageCourses.degree_requirements.required_ects.label')}
                  placeholder={t('manageCourses.degree_requirements.required_ects.placeholder')}
                  itemId={course.id}
                  value={course.requiredEcts != null ? String(course.requiredEcts) : ''}
                  updateValueMutation={UPDATE_COURSE_REQUIRED_ECTS}
                  refetchQueries={['AdminCourseList']}
                  helpText={t('manageCourses.degree_requirements.required_ects.help_text')}
                  min={0}
                />

                <InputField
                  variant="material"
                  type="number"
                  label={t('manageCourses.degree_requirements.required_event_count.label')}
                  placeholder={t('manageCourses.degree_requirements.required_event_count.placeholder')}
                  itemId={course.id}
                  value={course.requiredEventCount != null ? String(course.requiredEventCount) : ''}
                  updateValueMutation={UPDATE_COURSE_REQUIRED_EVENT_COUNT}
                  refetchQueries={['AdminCourseList']}
                  helpText={t('manageCourses.degree_requirements.required_event_count.help_text')}
                  min={0}
                />
              </Card>
            )}

            {/* 6. Learning Goals - Card Container */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4 [&_.text-label-disabled]:text-label-primary">
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
                className="h-32 !text-label-primary"
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
      
      <AddonValidationDialog
        open={isValidationDialogOpen}
        onClose={() => setIsValidationDialogOpen(false)}
        onSave={handleSaveAddonMappings}
        addonQuestions={addonQuestions}
        courseId={course.id}
        isLoading={isSavingMappings}
      />

      {/* Formbricks Help Dialog */}
      <InfoDialog
        open={isFormbricksHelpDialogOpen}
        onClose={() => setIsFormbricksHelpDialogOpen(false)}
        title={t('manageCourse.formbricks.setup_dialog_title')}
        content={t('manageCourse.formbricks.setup_dialog_content')}
      />

      {/* Base Price Help Dialog */}
      <InfoDialog
        open={isBasePriceHelpDialogOpen}
        onClose={() => setIsBasePriceHelpDialogOpen(false)}
        title={t('manageCourse.pricing.base_price_dialog_title')}
        content={t('manageCourse.pricing.base_price_dialog_content')}
      />

      <CreateMatrixRoomDialog
        open={matrixDialogOpen}
        onClose={() => setMatrixDialogOpen(false)}
        course={course}
      />
    </div>
  );
};

export default ExpandableCourseRow;
