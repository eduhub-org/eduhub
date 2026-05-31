import { QueryResult } from '@apollo/client';
import { FC, useCallback, useMemo, useState } from 'react';
import {
  ManagedCourse_Course_by_pk,
} from '../../../../queries/__generated__/ManagedCourse';
import {
  ManagedCourseApplications,
  ManagedCourseApplicationsVariables,
  ManagedCourseApplications_Course_by_pk,
  ManagedCourseApplications_Course_by_pk_CourseEnrollments,
} from '../../../../queries/__generated__/ManagedCourseApplications';
import {
  ManagedCourseApplicationRecipients,
  ManagedCourseApplicationRecipientsVariables,
  ManagedCourseApplicationRecipients_Course_by_pk_CourseEnrollments,
} from '../../../../queries/__generated__/ManagedCourseApplicationRecipients';
import { useLazyRoleQuery, useRoleQuery } from '../../../../hooks/authedQuery';
import { MANAGED_COURSE_APPLICATIONS, MANAGED_COURSE_APPLICATION_RECIPIENTS } from '../../../../queries/course';
import Dot from '../../../common/Dot';
import { OnlyInstructor } from '../../../common/OnlyLoggedIn';
import { useIsInstructor, useIsAdmin } from '../../../../hooks/authentication';
import {
  identityEventMapper,
  pickIdPkMapper,
  useRoleMutation,
  useUpdateCallback2,
} from '../../../../hooks/authedMutation';
import {
  UpdateEnrollmentRating,
  UpdateEnrollmentRatingVariables,
} from '../../../../queries/__generated__/UpdateEnrollmentRating';
import {
  UPDATE_ENROLLMENT_STATUS_FOR_INVITE,
  UPDATE_ENROLLMENT_STATUS_WHEN_APPLIED,
  UPDATE_ENROLLMENT_RATING,
} from '../../../../queries/insertEnrollment';
import { Button as OldButton } from '../../../common/Button';
import { Dialog, DialogTitle, Tooltip } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { MdClose } from 'react-icons/md';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  UpdateEnrollmentStatusWhenApplied,
  UpdateEnrollmentStatusWhenAppliedVariables,
} from '../../../../queries/__generated__/UpdateEnrollmentStatusWhenApplied';
import { useTranslations, useLocale } from 'next-intl';
import Modal from '../../../common/Modal';
import AddParticipantsForm from './AddParticipantsForm';
import TableGrid from '../../../common/TableGrid';
import { useTableGrid } from '../../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../../common/TableGrid/utils';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { GoDotFill } from 'react-icons/go';
import { IoIosCheckmarkCircle, IoIosCloseCircle } from 'react-icons/io';
import { CourseEnrollmentStatus_enum, MotivationRating_enum } from '../../../../__generated__/globalTypes';
import { getPaymentStatusFromInvoices } from '../../../../utils/invoicePaymentStatus';
import { useDisplayDate } from '../../../../helpers/dateTimeHelpers';
import { BulkAction } from '../../../common/TableGrid/types';
import { ApolloError } from '@apollo/client';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import { FormbricksResponsesDisplay } from './FormbricksResponsesDisplay';
import { getRegistrationFeatures, type RegistrationFeatures } from './registrationConfig';
import NotificationSnackbar from '../../../common/dialogs/NotificationSnackbar';
import Loading from '../../../common/Loading';

/** Matches TableGrid `gap-3` between columns; keep in sync with expandable row width math. */
const APPLICATION_TABLE_GAP_PX = 12;
const BULK_EMAIL_MAILTO_URL_LIMIT = 1800;
const BULK_EMAIL_RECIPIENT_LIMIT = 10000;
const BULK_EMAIL_PREVIEW_COUNT = 8;

/**
 * Default pixel widths for Applications tab columns (accessorKey → size).
 * Used by both TableGrid column defs and ExpandableApplicationRow alignment.
 */
const APPLICATION_TABLE_COLUMN_SIZES = {
  'User.firstName': 200,
  'User.lastName': 200,
  'User.Organization.name': 300,
  created_at: 104,
  motivationRating: 100,
  Invoices: 120,
  status: 120,
} as const;

function sumColumnWidthsWithGaps(widths: number[]): number {
  if (widths.length === 0) {
    return 0;
  }
  return widths.reduce((acc, w, i) => (i === 0 ? w : acc + APPLICATION_TABLE_GAP_PX + w), 0);
}

/** Widths for the three expandable blocks so they line up with the table columns above. */
function getExpandableRowWidths(features: RegistrationFeatures) {
  const s = APPLICATION_TABLE_COLUMN_SIZES;
  const emailWidth = sumColumnWidthsWithGaps([s['User.firstName'], s['User.lastName']]);

  // Questionnaire / motivation: columns from organization up to (but not including) motivationRating.
  // With application process: org + created_at. Without: org, and if payment-only flow includes payment before status.
  let middleParts: number[];
  if (features.hasApplicationProcess) {
    middleParts = [s['User.Organization.name'], s.created_at];
  } else {
    middleParts = [s['User.Organization.name']];
    if (features.hasPayment) {
      middleParts.push(s.Invoices);
    }
  }
  const questionnaireWidth = sumColumnWidthsWithGaps(middleParts);

  const ratingWidth = s.motivationRating;

  return { emailWidth, questionnaireWidth, ratingWidth };
}

interface IProps {
  course: ManagedCourse_Course_by_pk;
}

type ApplicationCourse = ManagedCourseApplications_Course_by_pk;
type ApplicationEnrollment = ManagedCourseApplications_Course_by_pk_CourseEnrollments;
type BulkEmailRecipient = ManagedCourseApplicationRecipients_Course_by_pk_CourseEnrollments;

type BulkEmailDialogData = {
  actionLabel: string;
  recipients: BulkEmailRecipient[];
  totalCount: number;
  isMailtoTooLong: boolean;
  isLimited: boolean;
};

interface ApplicationsTabContentProps {
  course: ApplicationCourse;
  qResult: QueryResult<ManagedCourseApplications, ManagedCourseApplicationsVariables>;
  loading: boolean;
  error: ApolloError | undefined;
  pageIndex: number;
  setPageIndex: (index: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  searchFilter: string;
  setSearchFilter: (value: string) => void;
  sorting: SortingState;
  setSorting: (sorting: SortingState | ((prev: SortingState) => SortingState)) => void;
}

const isExpired = (enrollment: ApplicationEnrollment) => {
  if (enrollment.invitationExpirationDate == null) {
    return false;
  }
  return new Date(enrollment.invitationExpirationDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
};

const isInviteEligibleEnrollment = (enrollment: ApplicationEnrollment) =>
  enrollment.motivationRating === 'INVITE' &&
  (enrollment.status === 'APPLIED' ||
    enrollment.status === 'INVITED' ||
    enrollment.status === 'WAITLIST');

const isRejectionEligibleEnrollment = (enrollment: ApplicationEnrollment) =>
  enrollment.motivationRating === 'DECLINE' &&
  (enrollment.status === 'APPLIED' || enrollment.status === 'WAITLIST');

export const ApplicationsTab: FC<IProps> = ({ course }) => {
  const t = useTranslations('manageCourse');
  const [pageSize, setPageSize] = useState(20);
  const {
    data,
    loading,
    error,
    queryResult,
    pageIndex,
    setPageIndex,
    searchFilter,
    setSearchFilter,
    sorting,
    setSorting,
  } = useTableGrid<ManagedCourseApplicationsVariables>({
    queryHook: useRoleQuery,
    query: MANAGED_COURSE_APPLICATIONS,
    queryVariables: { id: course.id },
    pageSize,
    refetchFilter: (search) => {
      const searchCondition = createMultiWordSearchCondition(search, [
        'User.firstName',
        'User.lastName',
        'User.email',
        'motivationLetter',
      ]);
      return { filter: searchCondition };
    },
    sortColumnMapper: (columnId) => {
      switch (columnId) {
        case 'User.firstName':
          return { User: { firstName: null } };
        case 'User.lastName':
          return { User: { lastName: null } };
        case 'User.Organization.name':
          return { User: { Organization: { name: null } } };
        case 'created_at':
        case 'motivationRating':
        case 'status':
          return columnId;
        default:
          return null;
      }
    },
    defaultSort: [{ id: 'asc' }],
  });

  if (loading && !data) {
    return <Loading />;
  }

  if (error) {
    return <div className="text-error">{error.message}</div>;
  }

  if (!data?.Course_by_pk) {
    return <div>{t('course_not_found', { courseId: course.id })}</div>;
  }

  return (
    <ApplicationsTabContent
      course={data.Course_by_pk}
      qResult={queryResult}
      loading={loading}
      error={error}
      pageIndex={pageIndex}
      setPageIndex={setPageIndex}
      pageSize={pageSize}
      setPageSize={setPageSize}
      searchFilter={searchFilter}
      setSearchFilter={setSearchFilter}
      sorting={sorting}
      setSorting={setSorting}
    />
  );
};

const ApplicationsTabContent: FC<ApplicationsTabContentProps> = ({
  course,
  qResult,
  loading,
  error,
  pageIndex,
  setPageIndex,
  pageSize,
  setPageSize,
  searchFilter,
  setSearchFilter,
  sorting,
  setSorting,
}) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');
  const tCourse = useTranslations('course');
  const locale = useLocale();
  const displayDate = useDisplayDate();
  const isInstructor = useIsInstructor();
  const isAdmin = useIsAdmin();
  const theme = useTheme();
  const matrixRoomId = course.matrixRoomId?.trim();
  const elementBaseUrl = process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL?.replace(/\/+$/, '');
  const organizerCourseChatLink = matrixRoomId && elementBaseUrl ? `${elementBaseUrl}/#/room/${matrixRoomId}` : null;

  const features = useMemo(
    () => getRegistrationFeatures(course.registrationType),
    [course.registrationType]
  );

  const expandableRowWidths = useMemo(() => getExpandableRowWidths(features), [features]);
  
  const applicationStats = useMemo(
    () => ({
      totalApplications: course.TotalCourseEnrollments.aggregate?.count ?? 0,
      approvedApplications: course.ApprovedCourseEnrollments.aggregate?.count ?? 0,
      invitedApplicants: course.InvitedCourseEnrollments.aggregate?.count ?? 0,
      confirmedApplicants: course.ConfirmedCourseEnrollments.aggregate?.count ?? 0,
    }),
    [
      course.ApprovedCourseEnrollments.aggregate?.count,
      course.ConfirmedCourseEnrollments.aggregate?.count,
      course.InvitedCourseEnrollments.aggregate?.count,
      course.TotalCourseEnrollments.aggregate?.count,
    ]
  );

  const courseEnrollments = useMemo(() => {
    return course.CourseEnrollments ?? [];
  }, [course]);

  const infoDots = (
    <div className="text-gray-400 text-sm">
      <div className="mb-1">{t('rating.label')}</div>
      <div className="flex gap-4 text-gray-400">
        <div className="flex items-center gap-1">
          <Dot color="lightgreen" /> <span>{t('rating.invite')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Dot color="orange" /> <span>{t('rating.unclear')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Dot color="red" /> <span>{t('rating.reject')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Dot color="grey" /> <span>{t('rating.not_rated')}</span>
        </div>
      </div>
    </div>
  );

  const [updateEnrollmentStatusForInvite] = useRoleMutation<
    UpdateEnrollmentStatusWhenApplied,
    UpdateEnrollmentStatusWhenAppliedVariables
  >(UPDATE_ENROLLMENT_STATUS_FOR_INVITE);

  const [updateEnrollmentStatusWhenApplied] = useRoleMutation<
    UpdateEnrollmentStatusWhenApplied,
    UpdateEnrollmentStatusWhenAppliedVariables
  >(UPDATE_ENROLLMENT_STATUS_WHEN_APPLIED);

  const [loadBulkEmailRecipients, bulkEmailRecipientsQuery] = useLazyRoleQuery<
    ManagedCourseApplicationRecipients,
    ManagedCourseApplicationRecipientsVariables
  >(MANAGED_COURSE_APPLICATION_RECIPIENTS, {
    fetchPolicy: 'network-only',
  });

  const [bulkNoticeOpen, setBulkNoticeOpen] = useState(false);
  const [bulkNoticeMessage, setBulkNoticeMessage] = useState('');
  const [bulkNoticeDurationMs, setBulkNoticeDurationMs] = useState(2000);
  const showBulkNotice = useCallback((message: string, durationMs = 2000) => {
    setBulkNoticeMessage(message);
    setBulkNoticeDurationMs(durationMs);
    setBulkNoticeOpen(true);
  }, []);
  const handleCloseBulkNotice = useCallback(() => {
    setBulkNoticeOpen(false);
  }, []);

  // Calculate default invitation expiration date (3 days before first session, or 3 days from now)
  const getDefaultInviteExpireDate = useCallback(() => {
    const now = new Date();
    if (course.Sessions && course.Sessions.length > 0) {
      const firstSession = course.Sessions[0];
      const firstSessionDate = new Date(firstSession.startDateTime);
      const defaultDate = new Date(firstSessionDate);
      defaultDate.setDate(defaultDate.getDate() - 3);
      // Make sure it's not in the past
      return defaultDate < now ? new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) : defaultDate;
    }
    // If no sessions, default to 3 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    return defaultDate;
  }, [course.Sessions]);

  const [inviteExpireDate, setInviteExpireDate] = useState(() => getDefaultInviteExpireDate());
  const handleSetInviteExpireDate = useCallback(
    (d: Date | null) => {
      setInviteExpireDate(d || getDefaultInviteExpireDate());
    },
    [getDefaultInviteExpireDate]
  );

  // Dialog state for invitations
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteDialogData, setInviteDialogData] = useState<{
    enrollmentsToSend: ApplicationEnrollment[];
    selectedCount?: number;
    identifiedCount: number;
    actionType: 'selected' | 'all';
  } | null>(null);

  const handleOpenInviteDialog = useCallback(
    (enrollmentIds: number[], selectedCount: number | undefined, actionType: 'selected' | 'all') => {
      const idToRow = new Map(courseEnrollments.map((e) => [e.id, e]));
      const enrollmentsToSend = enrollmentIds
        .map((id) => idToRow.get(id))
        .filter(
          (e): e is ApplicationEnrollment => !!e && isInviteEligibleEnrollment(e)
        );
      if (enrollmentsToSend.length === 0) {
        showBulkNotice(t('bulk_actions.no_eligible_invitations'));
        return;
      }
      setInviteDialogData({
        enrollmentsToSend,
        selectedCount,
        identifiedCount: enrollmentsToSend.length,
        actionType,
      });
      setInviteExpireDate(getDefaultInviteExpireDate());
      setIsInviteDialogOpen(true);
    },
    [courseEnrollments, getDefaultInviteExpireDate, showBulkNotice, t]
  );

  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleCloseInviteDialog = useCallback(() => {
    setIsInviteDialogOpen(false);
    setInviteDialogData(null);
    setInviteError(null);
  }, []);

  const handleSendInvitations = useCallback(async () => {
    if (!inviteDialogData) return;

    const idToRow = new Map(courseEnrollments.map((e) => [e.id, e]));
    const enrollmentIds = inviteDialogData.enrollmentsToSend
      .map((e) => e.id)
      .filter((id) => {
        const row = idToRow.get(id);
        return !!row && isInviteEligibleEnrollment(row);
      });

    if (enrollmentIds.length === 0) {
      showBulkNotice(t('bulk_actions.no_eligible_invitations'));
      handleCloseInviteDialog();
      return;
    }

    let invitedCount = 0;
    try {
      const result = await updateEnrollmentStatusForInvite({
        variables: {
          enrollmentIds,
          status: CourseEnrollmentStatus_enum.INVITED,
          expire: inviteExpireDate,
        },
      });
      invitedCount = result.data?.update_CourseEnrollment?.affected_rows ?? 0;
    } catch (error) {
      const errorMessage = error instanceof ApolloError 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : String(error);
      setInviteError(
        t('bulk_actions.send_invitations_error', { error: errorMessage }) || 
        `Failed to send invitations: ${errorMessage}`
      );
      return;
    }

    if (invitedCount === 0) {
      showBulkNotice(t('bulk_actions.no_eligible_invitations'));
    } else {
      showBulkNotice(
        invitedCount === 1
          ? t('bulk_actions.invitations_queued_singular', { count: invitedCount })
          : t('bulk_actions.invitations_queued_plural', { count: invitedCount }),
        4000
      );
    }
    handleCloseInviteDialog();

    try {
      await qResult.refetch();
    } catch (refetchError) {
      console.error('ApplicationsTab: refetch after bulk invite failed', refetchError);
    }
  }, [
    inviteDialogData,
    inviteExpireDate,
    courseEnrollments,
    updateEnrollmentStatusForInvite,
    qResult,
    handleCloseInviteDialog,
    showBulkNotice,
    t,
  ]);

  // Dialog state for rejections
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [rejectionDialogData, setRejectionDialogData] = useState<{
    enrollmentsToSend: ApplicationEnrollment[];
    selectedCount?: number;
    identifiedCount: number;
    actionType: 'selected' | 'all';
  } | null>(null);

  const handleOpenRejectionDialog = useCallback(
    (enrollmentIds: number[], selectedCount: number | undefined, actionType: 'selected' | 'all') => {
      const idToRow = new Map(courseEnrollments.map((e) => [e.id, e]));
      const enrollmentsToSend = enrollmentIds
        .map((id) => idToRow.get(id))
        .filter(
          (e): e is ApplicationEnrollment =>
            !!e && isRejectionEligibleEnrollment(e)
        );
      if (enrollmentsToSend.length === 0) {
        showBulkNotice(t('bulk_actions.no_eligible_rejections'));
        return;
      }
      setRejectionDialogData({
        enrollmentsToSend,
        selectedCount,
        identifiedCount: enrollmentsToSend.length,
        actionType,
      });
      setIsRejectionDialogOpen(true);
    },
    [courseEnrollments, showBulkNotice, t]
  );

  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const handleCloseRejectionDialog = useCallback(() => {
    setIsRejectionDialogOpen(false);
    setRejectionDialogData(null);
    setRejectionError(null);
  }, []);

  const handleSendRejections = useCallback(async () => {
    if (!rejectionDialogData) return;

    const idToRow = new Map(courseEnrollments.map((e) => [e.id, e]));
    const enrollmentIds = rejectionDialogData.enrollmentsToSend
      .map((e) => e.id)
      .filter((id) => {
        const row = idToRow.get(id);
        return !!row && isRejectionEligibleEnrollment(row);
      });

    if (enrollmentIds.length === 0) {
      showBulkNotice(t('bulk_actions.no_eligible_rejections'));
      handleCloseRejectionDialog();
      return;
    }

    let declinedCount = 0;
    try {
      const result = await updateEnrollmentStatusWhenApplied({
        variables: {
          enrollmentIds,
          status: CourseEnrollmentStatus_enum.REJECTED,
          expire: null,
        },
      });
      declinedCount = result.data?.update_CourseEnrollment?.affected_rows ?? 0;
    } catch (error) {
      const errorMessage = error instanceof ApolloError 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : String(error);
      setRejectionError(
        t('bulk_actions.send_rejections_error', { error: errorMessage }) || 
        `Failed to send rejections: ${errorMessage}`
      );
      return;
    }

    if (declinedCount === 0) {
      showBulkNotice(t('bulk_actions.no_eligible_rejections'));
    } else {
      showBulkNotice(
        declinedCount === 1
          ? t('bulk_actions.declines_queued_singular', { count: declinedCount })
          : t('bulk_actions.declines_queued_plural', { count: declinedCount }),
        4000
      );
    }
    handleCloseRejectionDialog();

    try {
      await qResult.refetch();
    } catch (refetchError) {
      console.error('ApplicationsTab: refetch after bulk decline failed', refetchError);
    }
  }, [
    rejectionDialogData,
    courseEnrollments,
    updateEnrollmentStatusWhenApplied,
    qResult,
    handleCloseRejectionDialog,
    showBulkNotice,
    t,
  ]);

  // Dialog state for "no selection" warning
  const [isNoSelectionDialogOpen, setIsNoSelectionDialogOpen] = useState(false);
  const handleCloseNoSelectionDialog = useCallback(() => {
    setIsNoSelectionDialogOpen(false);
  }, []);

  const [bulkEmailDialogData, setBulkEmailDialogData] = useState<BulkEmailDialogData | null>(null);
  const [bulkEmailPendingLabel, setBulkEmailPendingLabel] = useState<string | null>(null);
  const [bulkEmailCopyStatus, setBulkEmailCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [bulkEmailError, setBulkEmailError] = useState<string | null>(null);

  const handleCloseBulkEmailDialog = useCallback(() => {
    setBulkEmailDialogData(null);
    setBulkEmailPendingLabel(null);
    setBulkEmailCopyStatus('idle');
    setBulkEmailError(null);
  }, []);

  const setEnrollmentRating = useUpdateCallback2<UpdateEnrollmentRating, UpdateEnrollmentRatingVariables>(
    UPDATE_ENROLLMENT_RATING,
    'enrollmentId',
    'rating',
    pickIdPkMapper,
    identityEventMapper,
    qResult
  );

  const [isAddParticipantsModalOpen, setAddParticipantsModalOpen] = useState(false);
  const openAddParticipantsModal = () => setAddParticipantsModalOpen(true);
  const closeAddParticipantsModal = () => setAddParticipantsModalOpen(false);

  const buildMailtoUrl = useCallback((emails: string[]) => {
    return `mailto:?bcc=${encodeURIComponent(emails.join(','))}`;
  }, []);

  const openMailtoOrShowFallback = useCallback(
    (dialogData: BulkEmailDialogData) => {
      const emails = dialogData.recipients.map((recipient) => recipient.User.email).filter(Boolean);
      const mailtoUrl = buildMailtoUrl(emails);

      if (mailtoUrl.length <= BULK_EMAIL_MAILTO_URL_LIMIT) {
        window.location.href = mailtoUrl;
        handleCloseBulkEmailDialog();
        return;
      }

      setBulkEmailDialogData({
        ...dialogData,
        isMailtoTooLong: true,
      });
    },
    [buildMailtoUrl, handleCloseBulkEmailDialog]
  );

  const copyBulkEmailRecipients = useCallback(async () => {
    if (!bulkEmailDialogData) {
      return;
    }

    const emails = bulkEmailDialogData.recipients.map((recipient) => recipient.User.email).filter(Boolean);

    try {
      await navigator.clipboard.writeText(emails.join(','));
      setBulkEmailCopyStatus('success');
    } catch (error) {
      console.error('ApplicationsTab: copying bulk email recipients failed', error);
      setBulkEmailCopyStatus('error');
    }
  }, [bulkEmailDialogData]);

  // Bulk actions handler
  const handleBulkEmailAction = useCallback(
    async (action: string, selectedRows: ApplicationEnrollment[]) => {
      let targetEnrollments: ApplicationEnrollment[] = [];

      // Row expansion actions are handled directly in TableGrid.
      // We only show feedback here when no row was selected.
      if (action === 'expand_selected_rows' || action === 'collapse_selected_rows') {
        if (selectedRows.length === 0) {
          setIsNoSelectionDialogOpen(true);
        }
        return;
      }

      // Handle invitation actions
      if (action === 'send_invitations_selected') {
        if (selectedRows.length === 0) {
          setIsNoSelectionDialogOpen(true);
          return;
        }
        const enrollmentsToSend = selectedRows.filter((e) => isInviteEligibleEnrollment(e));
        if (enrollmentsToSend.length === 0) {
          showBulkNotice(t('bulk_actions.no_eligible_invitations'));
          return;
        }
        handleOpenInviteDialog(enrollmentsToSend.map((e) => e.id), selectedRows.length, 'selected');
        return;
      }

      // Handle rejection actions
      if (action === 'send_rejections_selected') {
        if (selectedRows.length === 0) {
          setIsNoSelectionDialogOpen(true);
          return;
        }
        const enrollmentsToSend = selectedRows.filter((e) => isRejectionEligibleEnrollment(e));
        if (enrollmentsToSend.length === 0) {
          showBulkNotice(t('bulk_actions.no_eligible_rejections'));
          return;
        }
        handleOpenRejectionDialog(enrollmentsToSend.map((e) => e.id), selectedRows.length, 'selected');
        return;
      }

      // Handle email actions (existing)
      if (action === 'email_selected') {
        targetEnrollments = selectedRows;
      } else if (action.startsWith('email_status_') || action.startsWith('email_rating_')) {
        const isStatusAction = action.startsWith('email_status_');
        const emailActionLabelByValue: Record<string, string> = {
          email_status_CONFIRMED: t('bulk_actions.email_all_confirmed'),
          email_status_INVITED: t('bulk_actions.email_all_invited'),
          email_status_APPLIED: t('bulk_actions.email_all_applied'),
          email_status_REJECTED: t('bulk_actions.email_all_rejected'),
          email_status_WAITLIST: t('bulk_actions.email_all_waitlist'),
          email_rating_INVITE: t('bulk_actions.email_all_invite_rating'),
          email_rating_DECLINE: t('bulk_actions.email_all_decline_rating'),
          email_rating_REVIEW: t('bulk_actions.email_all_review_rating'),
        };
        const filter = isStatusAction
          ? {
              status: {
                _eq: action.replace('email_status_', '') as CourseEnrollmentStatus_enum,
              },
            }
          : {
              motivationRating: {
                _eq: action.replace('email_rating_', '') as MotivationRating_enum,
              },
            };
        const actionLabel = emailActionLabelByValue[action] ?? t('bulk_actions.email_selected');

        setBulkEmailDialogData(null);
        setBulkEmailCopyStatus('idle');
        setBulkEmailError(null);
        setBulkEmailPendingLabel(actionLabel);

        try {
          const result = await loadBulkEmailRecipients({
            variables: {
              id: course.id,
              limit: BULK_EMAIL_RECIPIENT_LIMIT,
              filter,
            },
          });
          const courseData = result.data?.Course_by_pk;
          const recipients = courseData?.CourseEnrollments ?? [];
          const totalCount = courseData?.CourseEnrollments_aggregate.aggregate?.count ?? recipients.length;
          const emails = recipients.map((recipient) => recipient.User.email).filter(Boolean);

          if (emails.length === 0) {
            showBulkNotice(t('bulk_actions.no_email_recipients'));
            return;
          }

          setBulkEmailDialogData({
            actionLabel,
            recipients,
            totalCount,
            isMailtoTooLong: buildMailtoUrl(emails).length > BULK_EMAIL_MAILTO_URL_LIMIT,
            isLimited: totalCount > recipients.length,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          setBulkEmailError(t('bulk_actions.bulk_email_load_error', { error: errorMessage }));
        } finally {
          setBulkEmailPendingLabel(null);
        }
        return;
      }

      if (targetEnrollments.length === 0) {
        return;
      }

      const emails = targetEnrollments.map((e) => e.User.email).filter(Boolean);
      if (emails.length > 0) {
        window.location.href = buildMailtoUrl(emails);
      }
    },
    [
      buildMailtoUrl,
      course.id,
      handleOpenInviteDialog,
      handleOpenRejectionDialog,
      loadBulkEmailRecipients,
      setIsNoSelectionDialogOpen,
      showBulkNotice,
      t,
    ]
  );

  const bulkActions: BulkAction[] = useMemo(() => {
    const actions: BulkAction[] = [
      {
        value: 'expand_selected_rows',
        label: t('bulk_actions.expand_selected_rows'),
        group: t('bulk_actions.expand_collapse_rows'),
        requiresSelection: true,
        disabledReason: t('bulk_actions.disabled_reasons.select_participants_first'),
      },
      {
        value: 'collapse_selected_rows',
        label: t('bulk_actions.collapse_selected_rows'),
        group: t('bulk_actions.expand_collapse_rows'),
        requiresSelection: true,
        disabledReason: t('bulk_actions.disabled_reasons.select_participants_first'),
      },
      {
        value: 'email_selected',
        label: t('bulk_actions.email_selected'),
        requiresSelection: true,
        disabledReason: t('bulk_actions.disabled_reasons.select_participants_first'),
      },
      {
        value: 'send_invitations_selected',
        label: t('bulk_actions.send_invitations_selected'),
        group: t('bulk_actions.send_decisions'),
        requiresSelection: true,
        disabled: !isInstructor,
        disabledReason: !isInstructor
          ? t('bulk_actions.disabled_reasons.instructors_only')
          : t('bulk_actions.disabled_reasons.select_participants_first'),
      },
      {
        value: 'send_rejections_selected',
        label: t('bulk_actions.send_rejections_selected'),
        group: t('bulk_actions.send_decisions'),
        requiresSelection: true,
        disabled: !isInstructor,
        disabledReason: !isInstructor
          ? t('bulk_actions.disabled_reasons.instructors_only')
          : t('bulk_actions.disabled_reasons.select_participants_first'),
      },
      {
        value: 'email_status_CONFIRMED',
        label: t('bulk_actions.email_all_confirmed'),
        group: t('bulk_actions.email_all_by_status'),
      },
      {
        value: 'email_status_INVITED',
        label: t('bulk_actions.email_all_invited'),
        group: t('bulk_actions.email_all_by_status'),
      },
      {
        value: 'email_status_APPLIED',
        label: t('bulk_actions.email_all_applied'),
        group: t('bulk_actions.email_all_by_status'),
      },
      {
        value: 'email_status_REJECTED',
        label: t('bulk_actions.email_all_rejected'),
        group: t('bulk_actions.email_all_by_status'),
      },
      {
        value: 'email_status_WAITLIST',
        label: t('bulk_actions.email_all_waitlist'),
        group: t('bulk_actions.email_all_by_status'),
      },
      {
        value: 'email_rating_INVITE',
        label: t('bulk_actions.email_all_invite_rating'),
        group: t('bulk_actions.email_all_by_rating'),
      },
      {
        value: 'email_rating_DECLINE',
        label: t('bulk_actions.email_all_decline_rating'),
        group: t('bulk_actions.email_all_by_rating'),
      },
      {
        value: 'email_rating_REVIEW',
        label: t('bulk_actions.email_all_review_rating'),
        group: t('bulk_actions.email_all_by_rating'),
      },
    ];

    return actions;
  }, [isInstructor, t]);

  // Rating sort function
  const ratingSortFn = useCallback((a: MotivationRating_enum, b: MotivationRating_enum) => {
    const order: Record<MotivationRating_enum, number> = {
      UNRATED: 0,
      REVIEW: 1,
      DECLINE: 2,
      INVITE: 3,
    };
    return order[a] - order[b];
  }, []);

  // Status sort function
  const statusSortFn = useCallback((a: CourseEnrollmentStatus_enum, b: CourseEnrollmentStatus_enum) => {
    const order: Record<CourseEnrollmentStatus_enum, number> = {
      APPLIED: 0,
      INVITED: 1,
      CONFIRMED: 2,
      COMPLETED: 3,
      REJECTED: 4,
      ABORTED: 5,
      CANCELLED: 6,
      REGISTERED: 7,
      WAITLIST: 8,
    };
    return order[a] - order[b];
  }, []);

  // Columns definition
  const columns = useMemo<ColumnDef<ApplicationEnrollment>[]>(
    () => {
      const baseColumns: ColumnDef<ApplicationEnrollment>[] = [
        {
          header: t('first_name'),
          accessorKey: 'User.firstName',
          size: APPLICATION_TABLE_COLUMN_SIZES['User.firstName'],
          enableSorting: true,
          cell: ({ row }) => row.original.User.firstName,
        },
        {
          header: t('last_name'),
          accessorKey: 'User.lastName',
          size: APPLICATION_TABLE_COLUMN_SIZES['User.lastName'],
          enableSorting: true,
          cell: ({ row }) => row.original.User.lastName,
        },
        {
          header: t('organization'),
          accessorKey: 'User.Organization.name',
          size: APPLICATION_TABLE_COLUMN_SIZES['User.Organization.name'],
          enableSorting: true,
          cell: ({ row }) => {
            const orgName = row.original.User.Organization?.name;
            return (
              <div className="truncate" title={orgName || ''}>
                {orgName || '-'}
              </div>
            );
          },
        },
      ];

      // Only include application date + evaluation columns for application process types
      if (features.hasApplicationProcess) {
        baseColumns.push({
          header: t('application_submitted_at'),
          accessorKey: 'created_at',
          size: APPLICATION_TABLE_COLUMN_SIZES.created_at,
          enableSorting: true,
          sortingFn: (rowA, rowB) => {
            const ta = rowA.original.created_at
              ? new Date(rowA.original.created_at as string).getTime()
              : 0;
            const tb = rowB.original.created_at
              ? new Date(rowB.original.created_at as string).getTime()
              : 0;
            return ta - tb;
          },
          cell: ({ row }) => {
            const raw = row.original.created_at;
            if (raw == null) {
              return <span className="text-label-secondary">—</span>;
            }
            return (
              <span className="text-sm tabular-nums" title={String(raw)}>
                {displayDate(raw)}
              </span>
            );
          },
        });
        baseColumns.push({
          header: t('evaluation'),
          accessorKey: 'motivationRating',
          size: APPLICATION_TABLE_COLUMN_SIZES.motivationRating,
          enableSorting: true,
          meta: { align: 'center' },
          sortingFn: (rowA, rowB) => {
            return ratingSortFn(
              rowA.original.motivationRating,
              rowB.original.motivationRating
            );
          },
          cell: ({ row }) => {
            const rating = row.original.motivationRating;
            return (
              <div>
                {rating === 'UNRATED' && <Dot color="grey" title={t('rating.not_rated')} />}
                {rating === 'INVITE' && <Dot color="lightgreen" title={t('rating.invite')} />}
                {rating === 'REVIEW' && <Dot color="orange" title={t('rating.unclear')} />}
                {rating === 'DECLINE' && <Dot color="red" title={t('rating.reject')} />}
              </div>
            );
          },
        });
      }

      // Payment status column - only for payment types (derived from Invoice)
      if (features.hasPayment) {
        baseColumns.push({
          header: t('payment_status'),
          accessorKey: 'Invoices',
          size: APPLICATION_TABLE_COLUMN_SIZES.Invoices,
          enableSorting: false,
          cell: ({ row }) => {
            const paymentStatus = getPaymentStatusFromInvoices(row.original.Invoices);
            return (
              <div className="text-center">
                <span className="text-sm">
                  {t(`payment_status_values.${paymentStatus}`)}
                </span>
              </div>
            );
          },
        });
      }

      // Status column - shown for all registration types
      baseColumns.push({
        header: t('status_label'),
        accessorKey: 'status',
        size: APPLICATION_TABLE_COLUMN_SIZES.status,
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          return statusSortFn(rowA.original.status, rowB.original.status);
        },
        meta: {
          align: 'center',
        },
        cell: ({ row }) => {
          const enrollment = row.original;
          const expired = isExpired(enrollment);
          return (
            <div>
              {!expired && enrollment.status === 'APPLIED' && (
                <GoDotFill className="inline" title={t('status.applied')} color="grey" size="1.5em" />
              )}
              {!expired && enrollment.status === 'INVITED' && (
                <IoIosCheckmarkCircle className="inline" title={t('status.invited')} color="grey" size="1.5em" />
              )}
              {(enrollment.status === 'CONFIRMED' || enrollment.status === 'COMPLETED') && (
                <IoIosCheckmarkCircle
                  className="inline"
                  title={t('status.invitation_confirmed')}
                  color="lightgreen"
                  size="1.5em"
                />
              )}
              {enrollment.status === 'REGISTERED' && (
                <IoIosCheckmarkCircle
                  className="inline"
                  title={t('status.registered')}
                  color="lightgreen"
                  size="1.5em"
                />
              )}
              {enrollment.status === 'ABORTED' && (
                <IoIosCheckmarkCircle title={t('status.aborted')} color="red" size="1.5em" className="inline" />
              )}
              {enrollment.status === 'REJECTED' && (
                <IoIosCloseCircle title={t('status.rejected')} color="red" size="1.5em" className="inline" />
              )}
              {enrollment.status === 'CANCELLED' && (
                <IoIosCloseCircle title={t('status.cancelled')} color="red" size="1.5em" className="inline" />
              )}
              {enrollment.status === 'WAITLIST' && (
                <span
                  className="inline-block max-w-full truncate text-[11px] font-semibold text-label-primary bg-bg-secondary px-1.5 py-0.5 rounded border border-border-primary"
                  title={t('status.waitlist')}
                >
                  {t('status.waitlist_badge')}
                </span>
              )}
              {expired && (enrollment.status === 'APPLIED' || enrollment.status === 'INVITED') && (
                <IoIosCloseCircle
                  className="inline"
                  title={t('status.invitation_expired')}
                  color="grey"
                  size="1.5em"
                />
              )}
            </div>
          );
        },
      });

      return baseColumns;
    },
    [t, ratingSortFn, statusSortFn, features, displayDate]
  );

  // Expandable row component
  const ExpandableApplicationRow = ({ row: enrollment }: { row: ApplicationEnrollment }) => {
    const setUnrated = useCallback(() => {
      setEnrollmentRating(enrollment, MotivationRating_enum.UNRATED);
    }, [enrollment]);

    const setInvite = useCallback(() => {
      setEnrollmentRating(enrollment, MotivationRating_enum.INVITE);
    }, [enrollment]);

    const setReview = useCallback(() => {
      setEnrollmentRating(enrollment, MotivationRating_enum.REVIEW);
    }, [enrollment]);

    const setDecline = useCallback(() => {
      setEnrollmentRating(enrollment, MotivationRating_enum.DECLINE);
    }, [enrollment]);

    // Access Organization from the User object
    const orgName = enrollment.User.Organization?.name;
    
    // Get effective Formbricks survey URL (course-level overrides program default)
    const effectiveSurveyUrl = course.formbricksEnrollmentSurveyUrl || course.Program?.defaultFormbricksEnrollmentSurveyUrl || null;
    const hasFormbricksSurvey = !!effectiveSurveyUrl;

    return (
      <div className="pt-5 pb-5 text-label-primary">
        <div className="flex items-start gap-3 pl-3">
          {/* Email and Application History — width matches firstName + gap + lastName (see APPLICATION_TABLE_COLUMN_SIZES) */}
          <div style={{ width: expandableRowWidths.emailWidth, flexShrink: 0 }}>
            <div className="mb-4">
              <div className="text-sm font-medium text-label-primary mb-1">{t('email')}</div>
              <div className="text-label-primary break-words font-medium pl-4" title={enrollment.User.email}>
                {enrollment.User.email}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-label-primary mb-2">{t('application_history.label')}</div>
              <div className="space-y-1">
                {enrollment.User.CourseEnrollments.length > 0 && enrollment.User.CourseEnrollments.filter(e => e.courseId !== enrollment.courseId).length === 0 ? (
                  <div className="text-sm text-label-secondary italic pl-4">{t('no_applications_present')}</div>
                ) : (
                  enrollment.User.CourseEnrollments.map((pastEnrollment, index) => {
                    if (pastEnrollment.courseId === enrollment.courseId) {
                      return null;
                    }
                    // Format ECTS if available (only for courses with achievement certificates)
                    let ectsInfo = '';
                    if (pastEnrollment.achievementCertificateURL && pastEnrollment.Course?.ects) {
                      let ects = pastEnrollment.Course.ects.replace(',', '.');
                      ects = isNaN(parseFloat(ects)) ? '0' : parseFloat(ects).toString();
                      ectsInfo = `; ${ects} ECTS`;
                    }
                    return (
                      <div
                        key={index}
                        className="text-sm text-gray-900 whitespace-normal break-words pl-4"
                      >
                        {pastEnrollment.Course?.title} ({pastEnrollment.Course?.Program.shortTitle}{ectsInfo})
                        {orgName ? ` - ${orgName}` : ''} - {tCommon(pastEnrollment.status)}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Application Content — spans org (+ created_at when application process) columns; width from APPLICATION_TABLE_COLUMN_SIZES */}
          {features.hasQuestionnaire && (
            <div style={{ width: expandableRowWidths.questionnaireWidth, flexShrink: 0 }}>
              <div className="mb-4">
                {hasFormbricksSurvey ? (
                  <FormbricksResponsesDisplay
                    courseId={enrollment.courseId}
                    userId={enrollment.userId}
                    enrollmentId={enrollment.id}
                    formbricksEnrollmentSurveyUrl={effectiveSurveyUrl || ''}
                  />
                ) : (
                  <>
                    <div className="text-sm font-medium text-label-primary mb-1">{t('application')}</div>
                    <div className="text-label-primary whitespace-pre-wrap break-words pl-4">
                      {enrollment.motivationLetter || '-'}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Rating Controls — width matches motivationRating column */}
          {features.hasApplicationProcess && (
            <div style={{ width: expandableRowWidths.ratingWidth, flexShrink: 0 }}>
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  {t('evaluation')}
                  <Tooltip title={t('application_status_tooltip')} placement="top">
                    <HelpOutline style={{ cursor: 'pointer', color: theme.palette.text.disabled }} />
                  </Tooltip>
                </div>
                <div className="flex gap-2 pl-4">
                  <button
                    onClick={setUnrated}
                    className="cursor-pointer hover:opacity-80 hover:scale-110 transition-all duration-200 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    title={t('rating.not_rated')}
                    aria-label={t('rating.not_rated')}
                  >
                    <Dot
                      color="grey"
                      size={enrollment.motivationRating === 'UNRATED' ? 'LARGE' : 'DEFAULT'}
                      className="block"
                    />
                  </button>
                  <button
                    onClick={setInvite}
                    className="cursor-pointer hover:opacity-80 hover:scale-110 transition-all duration-200 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    title={t('rating.invite')}
                    aria-label={t('rating.invite')}
                  >
                    <Dot
                      color="lightgreen"
                      size={enrollment.motivationRating === 'INVITE' ? 'LARGE' : 'DEFAULT'}
                      className="block"
                    />
                  </button>
                  <button
                    onClick={setReview}
                    className="cursor-pointer hover:opacity-80 hover:scale-110 transition-all duration-200 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    title={t('rating.unclear')}
                    aria-label={t('rating.unclear')}
                  >
                    <Dot
                      color="orange"
                      size={enrollment.motivationRating === 'REVIEW' ? 'LARGE' : 'DEFAULT'}
                      className="block"
                    />
                  </button>
                  <button
                    onClick={setDecline}
                    className="cursor-pointer hover:opacity-80 hover:scale-110 transition-all duration-200 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    title={t('rating.reject')}
                    aria-label={t('rating.reject')}
                  >
                    <Dot
                      color="red"
                      size={enrollment.motivationRating === 'DECLINE' ? 'LARGE' : 'DEFAULT'}
                      className="block"
                    />
                  </button>
                </div>
              </div>

              {enrollment.status === 'INVITED' && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    {t('invitation_deadline')}
                    <Tooltip title={t('application_deadline_tooltip')} placement="top">
                      <HelpOutline style={{ cursor: 'pointer', color: theme.palette.text.disabled }} />
                    </Tooltip>
                  </div>
                  <div className="text-gray-900 font-medium pl-4">{displayDate(enrollment.invitationExpirationDate)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0);
  }, [setPageIndex, setPageSize]);

  const handleSearchFilterChange = useCallback((value: string) => {
    setSearchFilter(value);
    setPageIndex(0);
  }, [setPageIndex, setSearchFilter]);

  return (
    <>
      {/* Add Participants Modal - accessible to all, but button only shown to admins */}
      <Modal
        isOpen={isAddParticipantsModalOpen}
        onClose={closeAddParticipantsModal}
        title={t('add_participants')}
      >
        <AddParticipantsForm courseId={course.id} onSubmit={closeAddParticipantsModal} />
      </Modal>

      {organizerCourseChatLink ? (
        <div className="mb-6 flex items-center justify-center gap-3 rounded-lg border border-border-primary bg-bg-secondary p-4">
          <p className="text-sm text-label-primary">{t('element_chat_welcome_prompt')}</p>
          <OldButton
            className="!bg-brand !text-white !border-brand hover:!bg-brand-light hover:!border-brand-light whitespace-nowrap"
            as="a"
            href={organizerCourseChatLink}
            filled
          >
            {tCourse('general.to_course_chat')}
          </OldButton>
        </div>
      ) : null}

      {/* Statistics Cards */}
      {courseEnrollments.length > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${features.hasApplicationProcess ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4 mb-6`}>
          {features.hasApplicationProcess ? (
            <>
              {/* Approval-based Registration: Show all 4 cards */}
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t('statistics_applications_total')}</div>
                <div className="text-label-primary text-2xl font-semibold">{applicationStats.totalApplications}</div>
              </div>
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t('statistics_applications_accepted')}</div>
                <div className="text-label-primary text-2xl font-semibold">{applicationStats.approvedApplications}</div>
              </div>
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t('statistics_invitations_total')}</div>
                <div className="text-label-primary text-2xl font-semibold">{applicationStats.invitedApplicants}</div>
              </div>
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t('statistics_invitations_confirmed')}</div>
                <div className="text-label-primary text-2xl font-semibold">{applicationStats.confirmedApplicants}</div>
              </div>
            </>
          ) : (
            <>
              {/* Direct Registration: Show only total and confirmed registrations */}
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t('statistics_registrations_total')}</div>
                <div className="text-label-primary text-2xl font-semibold">{applicationStats.totalApplications}</div>
              </div>
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t('statistics_registrations_confirmed')}</div>
                <div className="text-label-primary text-2xl font-semibold">{applicationStats.confirmedApplicants}</div>
              </div>
            </>
          )}
        </div>
      )}

      <div>
        <OnlyInstructor>
          <TableGrid<ApplicationEnrollment>
            columns={columns}
            data={courseEnrollments}
            loading={loading}
            error={error}
            expandableRowComponent={ExpandableApplicationRow}
            bulkActions={bulkActions}
            onBulkAction={handleBulkEmailAction}
            enablePagination={true}
            totalCount={course.CourseEnrollments_aggregate.aggregate?.count ?? 0}
            pageIndex={pageIndex}
            onPageChange={setPageIndex}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            searchFilter={searchFilter}
            onSearchFilterChange={handleSearchFilterChange}
            sorting={sorting}
            onSortingChange={setSorting}
            refetchQueries={[]}
            {...(isAdmin && {
              addButtonText: t('add_participants'),
              onAddButtonClick: openAddParticipantsModal,
            })}
          />
        </OnlyInstructor>

        {courseEnrollments.length > 0 && features.hasApplicationProcess && (
          <div className="-mt-8 mb-3">{infoDots}</div>
        )}
      </div>

      {/* Invitation Dialog — Paper uses .light so semantic button/text colors match white surface */}
      <Dialog
        open={isInviteDialogOpen}
        onClose={handleCloseInviteDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'light' }}
      >
        <DialogTitle>
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold text-label-primary">{t('bulk_actions.send_invitations_dialog_title')}</div>
            <div className="cursor-pointer text-label-primary" onClick={handleCloseInviteDialog}>
              <MdClose className="w-6 h-6" />
            </div>
          </div>
        </DialogTitle>
        <div className="px-6 pb-6">
          {inviteDialogData && (
            <>
              <div className="mb-6">
                <p className="text-label-primary mb-4">
                  {inviteDialogData.actionType === 'selected' ? (
                    inviteDialogData.selectedCount !== undefined && inviteDialogData.selectedCount > 0 ? (
                      inviteDialogData.identifiedCount === 1
                        ? t('bulk_actions.send_invitations_selected_count_singular', { selected: inviteDialogData.selectedCount, identified: inviteDialogData.identifiedCount })
                        : t('bulk_actions.send_invitations_selected_count_plural', { selected: inviteDialogData.selectedCount, identified: inviteDialogData.identifiedCount })
                    ) : (
                      t('bulk_actions.send_invitations_selected_count_plural', { selected: 0, identified: inviteDialogData.identifiedCount })
                    )
                  ) : (
                    inviteDialogData.identifiedCount === 1
                      ? t('bulk_actions.send_invitations_all_count_singular', { count: inviteDialogData.identifiedCount })
                      : t('bulk_actions.send_invitations_all_count_plural', { count: inviteDialogData.identifiedCount })
                  )}
                </p>
                <div className="flex flex-col gap-4">
                  <label className="text-sm font-medium text-label-primary">
                    {t('invitation_deadline')}
                  </label>
                  <DatePicker
                    dateFormat={locale === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'}
                    selected={inviteExpireDate}
                    onChange={handleSetInviteExpireDate}
                    minDate={new Date()}
                    locale={locale}
                    className="w-full p-2 rounded border border-border-primary bg-fill-primary text-label-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <OldButton onClick={handleCloseInviteDialog} inverted>
                  {tCommon('cancel')}
                </OldButton>
                <OldButton onClick={handleSendInvitations} filled>
                  {t('bulk_actions.send_invitations_confirm')}
                </OldButton>
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog
        open={isRejectionDialogOpen}
        onClose={handleCloseRejectionDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'light' }}
      >
        <DialogTitle>
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold text-label-primary">{t('bulk_actions.send_rejections_dialog_title')}</div>
            <div className="cursor-pointer text-label-primary" onClick={handleCloseRejectionDialog}>
              <MdClose className="w-6 h-6" />
            </div>
          </div>
        </DialogTitle>
        <div className="px-6 pb-6">
          {rejectionDialogData && (
            <>
              <div className="mb-6">
                <p className="text-label-primary">
                  {rejectionDialogData.actionType === 'selected' ? (
                    rejectionDialogData.selectedCount !== undefined && rejectionDialogData.selectedCount > 0 ? (
                      rejectionDialogData.identifiedCount === 1
                        ? t('bulk_actions.send_rejections_selected_count_singular', { selected: rejectionDialogData.selectedCount, identified: rejectionDialogData.identifiedCount })
                        : t('bulk_actions.send_rejections_selected_count_plural', { selected: rejectionDialogData.selectedCount, identified: rejectionDialogData.identifiedCount })
                    ) : (
                      t('bulk_actions.send_rejections_selected_count_plural', { selected: 0, identified: rejectionDialogData.identifiedCount })
                    )
                  ) : (
                    rejectionDialogData.identifiedCount === 1
                      ? t('bulk_actions.send_rejections_all_count_singular', { count: rejectionDialogData.identifiedCount })
                      : t('bulk_actions.send_rejections_all_count_plural', { count: rejectionDialogData.identifiedCount })
                  )}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <OldButton onClick={handleCloseRejectionDialog} inverted>
                  {tCommon('cancel')}
                </OldButton>
                <OldButton onClick={handleSendRejections} filled>
                  {t('bulk_actions.send_rejections_confirm')}
                </OldButton>
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* Bulk Email Dialog */}
      <Dialog
        open={!!bulkEmailPendingLabel || !!bulkEmailDialogData || !!bulkEmailError}
        onClose={handleCloseBulkEmailDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'light' }}
      >
        <DialogTitle>
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold text-label-primary">{t('bulk_actions.bulk_email_dialog_title')}</div>
            <div className="cursor-pointer text-label-primary" onClick={handleCloseBulkEmailDialog}>
              <MdClose className="w-6 h-6" />
            </div>
          </div>
        </DialogTitle>
        <div className="px-6 pb-6">
          {bulkEmailPendingLabel || bulkEmailRecipientsQuery.loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <Loading />
              <p className="text-label-primary">{t('bulk_actions.bulk_email_loading', { action: bulkEmailPendingLabel ?? '' })}</p>
            </div>
          ) : bulkEmailError ? (
            <>
              <p className="mb-6 text-error">{bulkEmailError}</p>
              <div className="flex justify-end">
                <OldButton onClick={handleCloseBulkEmailDialog} filled>
                  {tCommon('ok')}
                </OldButton>
              </div>
            </>
          ) : bulkEmailDialogData ? (
            <>
              <div className="mb-6 space-y-4">
                <p className="text-label-primary">
                  {t('bulk_actions.bulk_email_recipient_count', {
                    action: bulkEmailDialogData.actionLabel,
                    count: bulkEmailDialogData.totalCount,
                  })}
                </p>
                {bulkEmailDialogData.isLimited ? (
                  <p className="text-error">
                    {t('bulk_actions.bulk_email_recipient_limit', {
                      limit: BULK_EMAIL_RECIPIENT_LIMIT,
                      count: bulkEmailDialogData.totalCount,
                    })}
                  </p>
                ) : bulkEmailDialogData.isMailtoTooLong ? (
                  <p className="text-label-primary">
                    {t('bulk_actions.bulk_email_mailto_too_long', {
                      limit: BULK_EMAIL_MAILTO_URL_LIMIT,
                    })}
                  </p>
                ) : null}
                <div>
                  <div className="mb-2 text-sm font-medium text-label-primary">{t('bulk_actions.bulk_email_preview_label')}</div>
                  <div className="max-h-40 overflow-auto rounded border border-border-primary bg-bg-secondary p-3 text-sm text-label-primary">
                    {bulkEmailDialogData.recipients.slice(0, BULK_EMAIL_PREVIEW_COUNT).map((recipient) => (
                      <div key={recipient.id} className="truncate" title={recipient.User.email}>
                        {recipient.User.email}
                      </div>
                    ))}
                    {bulkEmailDialogData.recipients.length > BULK_EMAIL_PREVIEW_COUNT && (
                      <div className="mt-2 text-label-secondary">
                        {t('bulk_actions.bulk_email_preview_more', {
                          count: bulkEmailDialogData.recipients.length - BULK_EMAIL_PREVIEW_COUNT,
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {bulkEmailCopyStatus === 'success' && (
                  <p className="text-label-primary">{t('bulk_actions.bulk_email_copy_success')}</p>
                )}
                {bulkEmailCopyStatus === 'error' && (
                  <p className="text-error">{t('bulk_actions.bulk_email_copy_error')}</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <OldButton onClick={handleCloseBulkEmailDialog} inverted>
                  {tCommon('cancel')}
                </OldButton>
                {bulkEmailDialogData.isMailtoTooLong || bulkEmailDialogData.isLimited ? (
                  <OldButton onClick={copyBulkEmailRecipients} filled disabled={bulkEmailDialogData.isLimited}>
                    {t('bulk_actions.bulk_email_copy')}
                  </OldButton>
                ) : (
                  <OldButton onClick={() => openMailtoOrShowFallback(bulkEmailDialogData)} filled>
                    {t('bulk_actions.bulk_email_open_mail')}
                  </OldButton>
                )}
              </div>
            </>
          ) : null}
        </div>
      </Dialog>

      {/* No Selection Dialog */}
      <Dialog
        open={isNoSelectionDialogOpen}
        onClose={handleCloseNoSelectionDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'light' }}
      >
        <DialogTitle>
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold text-label-primary">{t('bulk_actions.no_selection_dialog_title')}</div>
            <div className="cursor-pointer text-label-primary" onClick={handleCloseNoSelectionDialog}>
              <MdClose className="w-6 h-6" />
            </div>
          </div>
        </DialogTitle>
        <div className="px-6 pb-6">
          <div className="mb-6">
            <p className="text-label-primary">{t('select_applicants_first')}</p>
          </div>
          <div className="flex justify-end gap-3">
            <OldButton onClick={handleCloseNoSelectionDialog} filled>
              {tCommon('ok')}
            </OldButton>
          </div>
        </div>
      </Dialog>

      {/* Error Dialogs */}
      <ErrorMessageDialog
        errorMessage={inviteError || ''}
        open={!!inviteError}
        onClose={() => setInviteError(null)}
      />
      <ErrorMessageDialog
        errorMessage={rejectionError || ''}
        open={!!rejectionError}
        onClose={() => setRejectionError(null)}
      />
      <NotificationSnackbar
        open={bulkNoticeOpen}
        onClose={handleCloseBulkNotice}
        message={bulkNoticeMessage}
        duration={bulkNoticeDurationMs}
      />
    </>
  );
};
