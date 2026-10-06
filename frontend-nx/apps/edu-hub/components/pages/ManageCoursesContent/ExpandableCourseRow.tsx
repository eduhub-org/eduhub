import { FC, Fragment, useCallback, useMemo, useState, useEffect } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import { MdAddCircle, MdForum } from 'react-icons/md';
import { useManageMutation } from '../../../hooks/authedMutation';
import { SAVE_COURSE_IMAGE } from '../../../queries/actions';
import { INSERT_COURSE_GROUP_TAG, DELETE_COURSE_GROUP_TAG } from '../../../queries/courseGroup';
import {
  COURSE_SERIES_OPTIONS,
  COURSE_SERIES_RUNS,
  CREATE_COURSE_SERIES,
  UPDATE_COURSE_SERIES,
} from '../../../queries/courseSeries';
import { CourseSeriesOptions, CourseSeriesOptionsVariables } from '../../../queries/__generated__/CourseSeriesOptions';
import { CourseSeriesRuns, CourseSeriesRunsVariables } from '../../../queries/__generated__/CourseSeriesRuns';
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
import CheckboxSelector from '../../inputs/CheckboxSelector';
import FileUploadField from '../../inputs/FileUploadField';
import {
  UPDATE_COURSE_EXTERNAL_REGISTRATION_LINK,
  UPDATE_COURSE_GUEST_REGISTRATION_ENABLED,
  SAVE_COURSE_FORMBRICKS_ENROLLMENT_SURVEY,
  UPDATE_COURSE_BASE_PRICE,
  UPDATE_COURSE_CURRENCY,
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
import { useRoleQuery, useLazyRoleQuery } from '../../../hooks/authedQuery';
import { useCurrentRole } from '../../../hooks/authentication';
import { useManagementRoleContext } from '../../../hooks/managementRole';
import PricingSummary from '../../common/PricingSummary';
import RegistrationTypeSwitches from './RegistrationTypeSwitches';
import CourseEmailTemplatesSection from './CourseEmailTemplatesSection';
import CertificatesSection, { LearningGoalsField } from './CertificatesSection';
import FieldHint from './FieldHint';

interface ExpandableCourseRowProps {
  course: AdminCourseList_Course;
  courseGroupOptions: { id: number; name: string }[];
  sliderCourseGroupIds: number[];
  degreeCourses: { id: number; name: string }[];
  onSetShowAvailablePlaces: (c: AdminCourseList_Course, show: boolean) => any;
  onSetAttendanceCertificatePossible: (c: AdminCourseList_Course, isPossible: boolean) => any;
  onSetAchievementCertificatePossible: (c: AdminCourseList_Course, isPossible: boolean) => any;
}

const ExpandableCourseRow: FC<ExpandableCourseRowProps> = ({
  course,
  courseGroupOptions,
  sliderCourseGroupIds,
  degreeCourses,
  onSetShowAvailablePlaces,
  onSetAttendanceCertificatePossible,
  onSetAchievementCertificatePossible,
}) => {
  const t = useTranslations();
  const { error, handleError, resetError } = useErrorHandler();
  const managementRole = useManagementRoleContext();
  const currentRole = useCurrentRole();
  const queryRole = managementRole ?? currentRole;

  // A course series belongs to the organization of the course's program.
  const courseOrganizationId = course.Program?.organizationId ?? null;
  const { data: courseSeriesData } = useRoleQuery<CourseSeriesOptions, CourseSeriesOptionsVariables>(
    COURSE_SERIES_OPTIONS,
    {
      variables: { organizationId: courseOrganizationId ?? 0 },
      skip: courseOrganizationId === null,
    }
  );
  const courseSeriesOptions = useMemo(
    () => courseSeriesData?.CourseSeries.map((series) => ({ value: series.id.toString(), label: series.title })) ?? [],
    [courseSeriesData]
  );
  const { data: courseSeriesRunsData } = useRoleQuery<CourseSeriesRuns, CourseSeriesRunsVariables>(
    COURSE_SERIES_RUNS,
    {
      variables: { courseSeriesId: course.courseSeriesId ?? 0 },
      skip: course.courseSeriesId === null,
    }
  );
  const otherSeriesRuns = courseSeriesRunsData?.Course.filter((run) => run.id !== course.id) ?? [];

  const isExternalRegistration = course.registrationType === CourseRegistrationType_enum.EXTERNAL_REGISTRATION;

  // A "degree" is a course inside a DEGREES program; only such a course carries
  // completion thresholds for its degree certificate.
  const isDegreeCourse = course.Program?.type === ProgramType.DEGREES;
  const isEventCourse = course.Program?.type === ProgramType.EVENTS;

  // Mirrors the guards in functions/callNodeFunction/registerGuestForCourse.
  const supportsGuestRegistration =
    isEventCourse &&
    (course.registrationType === CourseRegistrationType_enum.DIRECT_CONFIRMATION ||
      course.registrationType === CourseRegistrationType_enum.DIRECT_WITH_INPUT);

  // Check if course requires payment
  const requiresPayment = course.registrationType === 'DIRECT_WITH_INPUT_AND_PAYMENT' ||
    course.registrationType === 'DIRECT_CONFIRMATION_AND_PAYMENT';
  const requiresQuestionnaire =
    course.registrationType === CourseRegistrationType_enum.APPROVAL_WITH_INPUT ||
    course.registrationType === CourseRegistrationType_enum.DIRECT_WITH_INPUT ||
    course.registrationType === CourseRegistrationType_enum.DIRECT_WITH_INPUT_AND_PAYMENT;

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
      <div className="bg-bg-secondary p-4 sm:p-6 w-full">
        {/* Left: how people sign up and hear from the offering. Right: what is shown about it and
            what it awards. The cards that grow with the registration options (questionnaire,
            payment) sit on the left, the ones that grow with certificates on the right, so the
            columns stay about the same length. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full items-start">
          {/* Left Column */}
          <div className="space-y-4 w-full min-w-0">
            {/* Registration: switches plus the fields each of them needs */}
            <Card className="space-y-4">
              <RegistrationTypeSwitches courseId={course.id} registrationType={course.registrationType} />

              {isExternalRegistration && (
                <div>
                  <InputField
                    variant="material"
                    type="link"
                    label={t('manageCourses.external_registration_link.label')}
                    placeholder={t('manageCourses.external_registration_link.label')}
                    itemId={course.id}
                    value={course.externalRegistrationLink || ''}
                    updateValueMutation={UPDATE_COURSE_EXTERNAL_REGISTRATION_LINK}
                    refetchQueries={['AdminCourseList']}
                  />
                  <FieldHint>{t('manageCourses.external_registration_link.help_text')}</FieldHint>
                </div>
              )}

              {/* Only meaningful for standalone events registered directly - the
                  backend rejects guest registration for anything else, so showing
                  the toggle elsewhere would just promise something that cannot work. */}
              {supportsGuestRegistration && (
                <div>
                  <CheckboxSelector
                    variant="switch"
                    labelPlacement="end"
                    label={t('manageCourse.guest_registration.label')}
                    checked={Boolean(course.guestRegistrationEnabled)}
                    updateValueMutation={UPDATE_COURSE_GUEST_REGISTRATION_ENABLED}
                    identifierVariables={{ courseId: course.id }}
                    refetchQueries={['AdminCourseList']}
                  />
                  <FieldHint className="ml-11">{t('manageCourse.guest_registration.help_text')}</FieldHint>
                </div>
              )}
            </Card>

            {/* Questionnaire - for every registration type that asks for input */}
            {requiresQuestionnaire && (
              <Card title={t('manageCourse.formbricks.title')} description={t('manageCourse.formbricks.help_text')}>
                <InputField
                  variant="material"
                  type="link"
                  placeholder={
                    course.Program?.defaultFormbricksEnrollmentSurveyUrl || t('manageCourse.formbricks.survey_url_helper')
                  }
                  itemId={course.id}
                  value={course.formbricksEnrollmentSurveyUrl || ''}
                  updateValueMutation={SAVE_COURSE_FORMBRICKS_ENROLLMENT_SURVEY}
                  refetchQueries={['AdminCourseList']}
                />
                <button
                  type="button"
                  onClick={() => setIsFormbricksHelpDialogOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                >
                  {t('manageCourse.formbricks.learn_more')}
                </button>
              </Card>
            )}

            {/* Pricing - configuration and the resulting summary together */}
            {requiresPayment && (
              <Card title={t('manageCourse.pricing.title')} description={t('manageCourse.pricing.base_price_help')}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <InputField
                        variant="material"
                        type="number"
                        label={t('manageCourse.pricing.base_price')}
                        placeholder="0"
                        itemId={course.id}
                        value={(course as any).basePrice?.toString() || '0'}
                        updateValueMutation={UPDATE_COURSE_BASE_PRICE}
                        refetchQueries={['AdminCourseList']}
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
                    <div>
                      <Button onClick={handleValidateSurvey} disabled={isValidatingSurvey}>
                        {isValidatingSurvey ? t('manageCourse.pricing.validating') : t('manageCourse.pricing.validate_addons')}
                      </Button>
                      <FieldHint>{t('manageCourse.pricing.validate_help')}</FieldHint>
                    </div>
                  )}

                  {(course as any).basePrice > 0 || (addonMappings && addonMappings.length > 0) ? (
                    <div>
                      <PricingSummary
                        basePrice={(course as any).basePrice || 0}
                        currency={(course as any).currency || 'EUR'}
                        stripeProductId={(course as any).stripeProductId}
                        stripePriceId={(course as any).stripePriceId}
                        addons={addonMappings || []}
                        showStripeStatus={true}
                        showTotal={false}
                      />
                      {addonMappings && addonMappings.length > 0 && (
                        <FieldHint className="italic">{t('manageCourse.addons.manage_hint')}</FieldHint>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-label-secondary italic">{t('manageCourse.pricing.no_pricing_configured')}</p>
                  )}
                </div>
              </Card>
            )}

            <CourseEmailTemplatesSection course={course} />

            {/* Participant chat (Matrix / legacy channel) */}
            <Card
              title={t('manageCourses.participant_chat.title')}
              description={t(
                legacyChatUrl && !matrixRoomId
                  ? 'manageCourses.participant_chat.explanation_external'
                  : 'manageCourses.participant_chat.explanation'
              )}
            >
              <div className="flex items-center gap-3 flex-wrap">
                {openParticipantChatHref ? (
                  <Button as="a" href={openParticipantChatHref} target="_blank" rel="noreferrer" filled>
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
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4 w-full min-w-0">
            {/* Cover image - every offering has one, so it leads the column */}
            <Card title={t('manageCourses.cover_image.label')} description={t('manageCourses.cover_image.help_text')}>
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
            </Card>

            <Card title={t('manageCourses.instructors.label')} description={t('manageCourses.instructors.help_text')}>
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
            </Card>

            {/* Certificates - hidden for a degree: the flags are forced by a trigger
                (achievement possible, attendance not), a degree is not assigned to another
                degree and has no sessions to miss; its thresholds live in the card below. */}
            {!isDegreeCourse && (
              <CertificatesSection
                course={course}
                isEventCourse={isEventCourse}
                degreeCourses={degreeCourses}
                onSetAttendanceCertificatePossible={onSetAttendanceCertificatePossible}
                onSetAchievementCertificatePossible={onSetAchievementCertificatePossible}
              />
            )}

            {/* Degree requirements - only for a course in a DEGREES program. An empty
                field means that requirement is not checked when the degree
                certificate is generated. */}
            {isDegreeCourse && (
              <Card
                title={t('manageCourses.degree_requirements.label')}
                description={t('manageCourses.degree_requirements.help_text')}
              >
                <div className="space-y-4">
                  <div>
                    <InputField
                      variant="material"
                      type="decimal"
                      label={t('manageCourses.degree_requirements.required_ects.label')}
                      placeholder={t('manageCourses.degree_requirements.required_ects.placeholder')}
                      itemId={course.id}
                      value={course.requiredEcts != null ? String(course.requiredEcts) : ''}
                      updateValueMutation={UPDATE_COURSE_REQUIRED_ECTS}
                      refetchQueries={['AdminCourseList']}
                      min={0}
                    />
                    <FieldHint>{t('manageCourses.degree_requirements.required_ects.help_text')}</FieldHint>
                  </div>
                  <div>
                    <InputField
                      variant="material"
                      type="number"
                      label={t('manageCourses.degree_requirements.required_event_count.label')}
                      placeholder={t('manageCourses.degree_requirements.required_event_count.placeholder')}
                      itemId={course.id}
                      value={course.requiredEventCount != null ? String(course.requiredEventCount) : ''}
                      updateValueMutation={UPDATE_COURSE_REQUIRED_EVENT_COUNT}
                      refetchQueries={['AdminCourseList']}
                      min={0}
                    />
                    <FieldHint>{t('manageCourses.degree_requirements.required_event_count.help_text')}</FieldHint>
                  </div>
                  <LearningGoalsField course={course} />
                </div>
              </Card>
            )}

            {/* Visibility - homepage sliders and widgets, course series, available places */}
            <Card title={t('manageCourses.course_group.label')} description={t('manageCourses.course_group.help_text')}>
              <div className="space-y-5">
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

                {/* Course series - past runs' projects are shown on the course page */}
                {courseOrganizationId !== null && (
                  <div>
                    <DropDownSelector
                      variant="material"
                      label={t('manageCourses.course_series.label')}
                      placeholder={t('manageCourses.course_series.placeholder')}
                      value={course.courseSeriesId?.toString() ?? ''}
                      options={courseSeriesOptions}
                      updateValueMutation={UPDATE_COURSE_SERIES}
                      createOptionMutation={CREATE_COURSE_SERIES}
                      identifierVariables={{ itemId: course.id, organizationId: courseOrganizationId }}
                      creatable
                      nullable
                      nullableLabel={t('manageCourses.course_series.none')}
                      refetchQueries={['AdminCourseList', 'CourseSeriesOptions', 'CourseSeriesRuns']}
                    />
                    <FieldHint>{t('manageCourses.course_series.help_text')}</FieldHint>
                    {course.courseSeriesId !== null && (
                      <div className="mt-2 text-sm text-label-secondary">
                        {otherSeriesRuns.length > 0 ? (
                          <>
                            <p>{t('manageCourses.course_series.other_runs')}</p>
                            <ul className="list-disc pl-5">
                              {otherSeriesRuns.map((run) => (
                                <li key={run.id}>
                                  {run.title} ({run.Program?.shortTitle || run.Program?.title})
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p>{t('manageCourses.course_series.no_other_runs')}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* What the public course page states about numbers */}
                <div>
                  <CheckboxSelector
                    variant="switch"
                    labelPlacement="end"
                    label={t('manageCourses.participants.show_available_places')}
                    checked={Boolean(course.showAvailablePlaces)}
                    onValueUpdated={(value: boolean) => onSetShowAvailablePlaces(course, value)}
                  />
                  <FieldHint className="ml-11">{t('manageCourses.participants.show_available_places_hint')}</FieldHint>
                </div>
              </div>
            </Card>

            {/* Funding organizations - last, rarely needed */}
            <Card>
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
            </Card>
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
