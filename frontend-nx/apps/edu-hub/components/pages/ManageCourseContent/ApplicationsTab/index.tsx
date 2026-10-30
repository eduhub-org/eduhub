import { QueryResult } from '@apollo/client';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
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
import { CourseEnrollmentStatistics } from './CourseEnrollmentStatistics';
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
  CANCEL_ENROLLMENTS_BY_ORGANIZER,
  CONFIRM_WAITLIST_ENROLLMENT,
  UPDATE_ENROLLMENT_STATUS_FOR_INVITE,
  UPDATE_ENROLLMENT_STATUS_BY_RATING,
  UPDATE_ENROLLMENT_RATING,
} from '../../../../queries/insertEnrollment';
import {
  CancelEnrollmentsByOrganizer,
  CancelEnrollmentsByOrganizerVariables,
} from '../../../../queries/__generated__/CancelEnrollmentsByOrganizer';
import {
  ConfirmWaitlistEnrollment,
  ConfirmWaitlistEnrollmentVariables,
} from '../../../../queries/__generated__/ConfirmWaitlistEnrollment';
import { Button as OldButton } from '../../../common/Button';
import { Dialog, DialogTitle } from '@mui/material';
import { MdClose } from 'react-icons/md';
import DatePicker from 'react-datepicker';
import { ensurePortalContainer } from '../../../inputs/OptimisticDatePicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  UpdateEnrollmentStatusForInvite,
  UpdateEnrollmentStatusForInviteVariables,
} from '../../../../queries/__generated__/UpdateEnrollmentStatusForInvite';
import {
  UpdateEnrollmentStatusByRating,
  UpdateEnrollmentStatusByRatingVariables,
} from '../../../../queries/__generated__/UpdateEnrollmentStatusByRating';
import { useTranslations, useLocale } from 'next-intl';
import Modal from '../../../common/Modal';
import AddParticipantsForm from './AddParticipantsForm';
import TableGrid from '../../../common/TableGrid';
import { ParticipantExportMenu } from '../ParticipantExport/ParticipantExportMenu';
import { useDeferredBulkAction, usePersistedPageSize, useTableGrid } from '../../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../../common/TableGrid/utils';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { IconType } from 'react-icons';
import {
  MdCheckCircleOutline,
  MdHighlightOff,
  MdHourglassEmpty,
  MdMailOutline,
  MdOutlineTimerOff,
  MdRadioButtonChecked,
  MdWarningAmber,
} from 'react-icons/md';
import {
  CourseEnrollmentStatus_enum,
  CourseRegistrationType_enum,
  MailTemplateType_enum,
  MotivationRating_enum,
  UserStatus_enum,
} from '../../../../__generated__/globalTypes';
import { getPaymentStatusFromInvoices } from '../../../../utils/invoicePaymentStatus';
import { useDisplayDate } from '../../../../helpers/dateTimeHelpers';
import { BulkAction, ExpandedRowProps } from '../../../common/TableGrid/types';
import { ApolloError } from '@apollo/client';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';
import { ApplicationDetails, RATING_OPTIONS } from './ApplicationDetails';
import { getRegistrationFeatures } from './registrationConfig';
import { defaultInvitationDeadline } from './invitationDeadline';
import NotificationSnackbar from '../../../common/dialogs/NotificationSnackbar';
import Loading from '../../../common/Loading';
import { StatusChangeEmail, StatusChangeEmailNotice, useMailTemplateLabel } from '../../../common/StatusChangeEmailNotice';
import { enrollmentStatusMailTemplate } from '../../../../helpers/enrollmentStatusEmail';

/** Matches TableGrid `gap-3` between columns; keep in sync with expandable row width math. */
const BULK_EMAIL_MAILTO_URL_LIMIT = 1800;
const BULK_EMAIL_RECIPIENT_LIMIT = 10000;
const BULK_EMAIL_PREVIEW_COUNT = 8;

/**
 * Default pixel widths for Applications tab columns (accessorKey → size). TableGrid treats them as
 * minimum widths.
 */
const APPLICATION_TABLE_COLUMN_SIZES = {
  'User.firstName': 150,
  'User.lastName': 150,
  'User.Organization.name': 200,
  created_at: 104,
  motivationRating: 120,
  Invoices: 120,
  // Icon and label, plus "· Guest" and a cancellation request pill on one line.
  status: 280,
} as const;

/** Statuses in which a participant's cancellation request still awaits the organizer. */
const CANCELLATION_REQUEST_OPEN_STATUSES: string[] = ['APPLIED', 'WAITLIST', 'INVITED', 'CONFIRMED', 'REGISTERED'];

/**
 * Email actions that address several statuses at once. "Registered" is everyone holding a place,
 * whether with an account (CONFIRMED) or as a guest (REGISTERED), and both once the course is
 * over (COMPLETED); "cancelled" includes enrollments that were aborted.
 */
const EMAIL_ACTION_STATUSES: Record<string, CourseEnrollmentStatus_enum[]> = {
  email_status_REGISTERED: [
    CourseEnrollmentStatus_enum.CONFIRMED,
    CourseEnrollmentStatus_enum.REGISTERED,
    CourseEnrollmentStatus_enum.COMPLETED,
  ],
  email_status_CANCELLED: [CourseEnrollmentStatus_enum.CANCELLED, CourseEnrollmentStatus_enum.ABORTED],
};

/** Guests registered without an account; unconfirmed guest sign-ups have no enrollment yet. */
const isGuest = (enrollment: ApplicationEnrollment) => enrollment.User.status === UserStatus_enum.GUEST;

/** Icon, colour and short label of an enrollment's status; the long label stays as tooltip. */
const statusDisplay = (
  enrollment: ApplicationEnrollment,
  hasApplicationProcess: boolean
): { icon: IconType; color: string; labelKey: string; muted?: boolean } => {
  if (enrollment.status === 'EXPIRED' || (isExpired(enrollment) && enrollment.status === 'INVITED')) {
    return { icon: MdOutlineTimerOff, color: 'var(--eduhub-label-disabled)', labelKey: 'status.invitation_expired', muted: true };
  }
  switch (enrollment.status) {
    case 'INVITED':
      return { icon: MdMailOutline, color: 'var(--eduhub-info)', labelKey: 'status.invited' };
    case 'CONFIRMED':
    case 'COMPLETED':
    case 'REGISTERED':
      return {
        icon: MdCheckCircleOutline,
        color: 'var(--eduhub-success)',
        labelKey: hasApplicationProcess ? 'status.confirmed_short' : 'status.registered_short',
      };
    case 'WAITLIST':
      return { icon: MdHourglassEmpty, color: 'var(--eduhub-warning)', labelKey: 'status.waitlist' };
    case 'REJECTED':
      return { icon: MdHighlightOff, color: 'var(--eduhub-error)', labelKey: 'status.rejected_short' };
    case 'CANCELLED':
      return { icon: MdHighlightOff, color: 'var(--eduhub-error)', labelKey: 'status.cancelled' };
    case 'ABORTED':
      return { icon: MdHighlightOff, color: 'var(--eduhub-error)', labelKey: 'status.aborted' };
    default:
      return { icon: MdRadioButtonChecked, color: 'var(--eduhub-label-disabled)', labelKey: 'status.applied' };
  }
};

/**
 * Status as icon and short label, followed by "· Guest" for guests and, while a paid participant's
 * cancellation request awaits the organizer, a "cancellation requested" pill.
 */
const renderStatus = (enrollment: ApplicationEnrollment, t: (key: string) => string, hasApplicationProcess: boolean) => {
  const { icon: Icon, color, labelKey, muted } = statusDisplay(enrollment, hasApplicationProcess);
  const cancellationRequested =
    !!enrollment.cancellationRequestedAt && CANCELLATION_REQUEST_OPEN_STATUSES.includes(enrollment.status);
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span
        className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold"
        title={t(statusLabelKey(enrollment, hasApplicationProcess))}
      >
        <Icon size="1.15em" style={{ color }} className="flex-shrink-0" aria-hidden="true" />
        <span className={muted ? 'font-normal text-label-secondary' : ''}>{t(labelKey)}</span>
      </span>
      {isGuest(enrollment) && (
        <span className="whitespace-nowrap text-xs text-label-secondary" title={t('status.registered_guest')}>
          · {t('status.guest_badge')}
        </span>
      )}
      {cancellationRequested && (
        <span
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-error px-2 py-0.5 text-[11px] font-semibold text-error"
          title={
            enrollment.cancellationRequestReason
              ? `${t('status.cancellation_requested')}: ${enrollment.cancellationRequestReason}`
              : t('status.cancellation_requested')
          }
        >
          <MdWarningAmber className="flex-shrink-0" aria-hidden="true" />
          {t('status.cancellation_requested_badge')}
        </span>
      )}
    </div>
  );
};

const statusLabelKey = (enrollment: ApplicationEnrollment, hasApplicationProcess: boolean): string => {
  if (enrollment.status === 'EXPIRED' || (isExpired(enrollment) && enrollment.status === 'INVITED')) {
    return 'status.invitation_expired';
  }
  switch (enrollment.status) {
    case 'APPLIED':
      return 'status.applied';
    case 'INVITED':
      return 'status.invited';
    // Without an application process nobody was invited: account users land in CONFIRMED,
    // guests in REGISTERED once they confirmed their email address.
    case 'CONFIRMED':
    case 'COMPLETED':
    case 'REGISTERED':
      if (isGuest(enrollment)) return 'status.registered_guest';
      return hasApplicationProcess ? 'status.invitation_confirmed' : 'status.registered_account';
    case 'ABORTED':
      return 'status.aborted';
    case 'REJECTED':
      return 'status.rejected';
    case 'CANCELLED':
      return 'status.cancelled';
    case 'WAITLIST':
      return 'status.waitlist';
    default:
      return 'status.applied';
  }
};

interface IProps {
  course: ManagedCourse_Course_by_pk;
  /** The viewer manages the course as an org admin: they may act on registrations like its instructors. */
  manageAsOrgAdmin?: boolean;
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
  /** Loads up to `limit` enrollments matching the current search, across all pages. */
  fetchAllRows: (limit: number) => Promise<ManagedCourseApplications | undefined>;
  manageAsOrgAdmin: boolean;
}

// An invitation counts as expired once its expiration date is before today. The
// expire_invitations cron only flips lapsed INVITED enrollments to EXPIRED once
// an hour, so the same cutoff is applied client-side and passed to the expired
// invitations aggregate to keep the table and the statistics cards in sync.
// invitationExpirationDate is a Postgres date, so the cutoff is a calendar day
// ("yyyy-MM-dd"); Hasura rejects a timestamp variable for it. "Today" is the
// Europe/Berlin day for every viewer, the same boundary as the cron and as
// REGISTRATION_TIME_ZONE in CourseContent/Registration/types.ts.
const INVITATION_TIME_ZONE = 'Europe/Berlin';
const invitationExpirationCutoff = () => formatInTimeZone(new Date(), INVITATION_TIME_ZONE, 'yyyy-MM-dd');

const INVITE_DATEPICKER_PORTAL_ID = 'invite-datepicker-portal';

const isExpired = (enrollment: ApplicationEnrollment) => {
  if (enrollment.invitationExpirationDate == null) {
    return false;
  }
  // The Apollo cache stores this date as a Date pinned to UTC midnight (see
  // config/apollo.ts), so its calendar day is read back in UTC. "yyyy-MM-dd"
  // strings compare chronologically.
  const expirationDay = formatInTimeZone(new Date(enrollment.invitationExpirationDate), 'UTC', 'yyyy-MM-dd');
  return expirationDay < invitationExpirationCutoff();
};

/**
 * "Send invitations and rejections" addresses everyone rated green or red who has not been decided
 * on yet, across all pages of the table, so it is a server-side filter rather than a check on the
 * loaded rows. Green ones are invited, red ones rejected.
 */
const UNDECIDED_RATED_FILTER = {
  _and: [
    { motivationRating: { _in: [MotivationRating_enum.INVITE, MotivationRating_enum.DECLINE] } },
    { status: { _in: [CourseEnrollmentStatus_enum.APPLIED, CourseEnrollmentStatus_enum.WAITLIST] } },
  ],
};

/**
 * Places still free, or null when the course has no limit. Organizers may overbook: "send by
 * rating" stays within the free places, every other invitation or confirmation warns first.
 */
const freePlacesOf = (
  course: { maxParticipants: number | null; TakenPlaces: { aggregate: { count: number } | null } } | null
): number | null => {
  if (course?.maxParticipants == null) return null;
  return Math.max(0, course.maxParticipants - (course.TakenPlaces.aggregate?.count ?? 0));
};

/** People an action places beyond the free places; 0 when it fits or the course has no limit. */
const overbookingOf = (freePlaces: number | null, placesTaken: number) =>
  freePlaces == null ? 0 : Math.max(0, placesTaken - freePlaces);

/** Direct registration with payment: someone moved up is invited to pay by a deadline. */
const isPaidDirectRegistration = (registrationType: string | null) =>
  registrationType === CourseRegistrationType_enum.DIRECT_CONFIRMATION_AND_PAYMENT ||
  registrationType === CourseRegistrationType_enum.DIRECT_WITH_INPUT_AND_PAYMENT;

const isCourseFullError = (error: unknown) => error instanceof Error && error.message.includes('This course is full');

/** An invitation that is still open or has lapsed can be sent again with a new deadline. */
const canRenewInvitation = (enrollment: ApplicationEnrollment) =>
  enrollment.status === 'INVITED' || enrollment.status === 'EXPIRED';

export const ApplicationsTab: FC<IProps> = ({ course, manageAsOrgAdmin = false }) => {
  const t = useTranslations('manageCourse');
  const [pageSize, setPageSize] = usePersistedPageSize('manageCourse.applications', 20);
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
    fetchAllRows,
  } = useTableGrid<ManagedCourseApplicationsVariables>({
    queryHook: useRoleQuery,
    query: MANAGED_COURSE_APPLICATIONS,
    queryVariables: { id: course.id, expirationCutoff: invitationExpirationCutoff() },
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
    console.error('ApplicationsTab: failed to load course applications', error);
    return <div className="text-error">{t('course_load_error')}</div>;
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
      fetchAllRows={fetchAllRows}
      manageAsOrgAdmin={manageAsOrgAdmin}
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
  fetchAllRows,
  manageAsOrgAdmin,
}) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');
  const tCourse = useTranslations('course');
  const templateLabel = useMailTemplateLabel();
  const locale = useLocale();
  const displayDate = useDisplayDate();
  // An org admin managing the course acts on registrations like its instructors.
  const isInstructor = useIsInstructor() || manageAsOrgAdmin;
  const isAdmin = useIsAdmin();
  // Inviting, rejecting and cancelling registrations is open to the course's instructors, super
  // admins, and org admins whose grant covers the course's program type (manageAsOrgAdmin).
  const canDecideRegistrations = isInstructor || isAdmin;
  const matrixRoomId = course.matrixRoomId?.trim();
  const elementBaseUrl = process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL?.replace(/\/+$/, '');
  const organizerCourseChatLink = matrixRoomId && elementBaseUrl ? `${elementBaseUrl}/#/room/${matrixRoomId}` : null;

  const features = useMemo(
    () => getRegistrationFeatures(course.registrationType),
    [course.registrationType]
  );

  
  // Evaluated fresh on every render (not memoized) so opening the modal after the first
  // session's start time has passed picks up the change without needing a refetch.
  const firstSession = course.Sessions[0];
  const hasCourseStarted = firstSession != null && new Date(firstSession.startDateTime).getTime() <= Date.now();

  const courseEnrollments = useMemo(() => {
    return course.CourseEnrollments ?? [];
  }, [course]);

  const loadAllEnrollments = useCallback(async () => {
    const allData = await fetchAllRows(BULK_EMAIL_RECIPIENT_LIMIT);
    return allData?.Course_by_pk?.CourseEnrollments ?? [];
  }, [fetchAllRows]);

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
    UpdateEnrollmentStatusForInvite,
    UpdateEnrollmentStatusForInviteVariables
  >(UPDATE_ENROLLMENT_STATUS_FOR_INVITE);

  const [cancelEnrollmentsByOrganizer] = useRoleMutation<
    CancelEnrollmentsByOrganizer,
    CancelEnrollmentsByOrganizerVariables
  >(CANCEL_ENROLLMENTS_BY_ORGANIZER);

  const [confirmWaitlistEnrollment] = useRoleMutation<ConfirmWaitlistEnrollment, ConfirmWaitlistEnrollmentVariables>(
    CONFIRM_WAITLIST_ENROLLMENT
  );

  const [updateEnrollmentStatusByRating] = useRoleMutation<
    UpdateEnrollmentStatusByRating,
    UpdateEnrollmentStatusByRatingVariables
  >(UPDATE_ENROLLMENT_STATUS_BY_RATING);

  const [loadBulkEmailRecipients, bulkEmailRecipientsQuery] = useLazyRoleQuery<
    ManagedCourseApplicationRecipients,
    ManagedCourseApplicationRecipientsVariables
  >(MANAGED_COURSE_APPLICATION_RECIPIENTS, {
    fetchPolicy: 'network-only',
  });

  const [loadInviteRecipients] = useLazyRoleQuery<
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

  const firstSessionStart = course.Sessions[0]?.startDateTime ?? null;
  const getDefaultInviteExpireDate = useCallback(
    () => defaultInvitationDeadline(firstSessionStart),
    [firstSessionStart]
  );

  const [inviteExpireDate, setInviteExpireDate] = useState(() => getDefaultInviteExpireDate());
  const handleSetInviteExpireDate = useCallback(
    (d: Date | null) => {
      setInviteExpireDate(d || getDefaultInviteExpireDate());
    },
    [getDefaultInviteExpireDate]
  );

  useEffect(() => {
    ensurePortalContainer(INVITE_DATEPICKER_PORTAL_ID);
  }, []);

  // Sending decisions for the selected rows or cancelling finishes in a dialog, so the selection is
  // only released once that dialog reports success.
  const dialogBulkAction = useDeferredBulkAction();

  // Dialog state for decisions: inviting everyone green and rejecting everyone red at once
  // (source 'rating'), deciding on the selected rows (source 'selection'), inviting one person from
  // their row ('single') or renewing one invitation. By rating, invitations never exceed the free
  // places: the earliest applications are invited and the rest (withheldCount) keep their status.
  // A selection or a single invitation may overbook the course; the dialog warns first.
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteDialogData, setInviteDialogData] = useState<
    | {
        mode: 'decisions';
        source: 'rating' | 'selection';
        enrollmentIds: number[];
        /** Of enrollmentIds, those on the waitlist: they get WAITLIST_PROMOTED instead of INVITE. */
        waitlistInviteCount: number;
        rejectionIds: number[];
        freePlaces: number | null;
        withheldCount: number;
        skippedCount: number;
      }
    | { mode: 'renew'; enrollmentIds: number[]; name: string }
    | { mode: 'single'; enrollmentIds: number[]; name: string; fromWaitlist: boolean; freePlaces: number | null }
    | null
  >(null);
  const [isLoadingInviteRecipients, setIsLoadingInviteRecipients] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  /** Loads the undecided rated applications (optionally only some ids) and the free places. */
  const loadUndecidedRated = useCallback(
    async (onlyIds?: number[]) => {
      const result = await loadInviteRecipients({
        variables: {
          id: course.id,
          limit: BULK_EMAIL_RECIPIENT_LIMIT,
          filter: onlyIds ? { _and: [{ id: { _in: onlyIds } }, UNDECIDED_RATED_FILTER] } : UNDECIDED_RATED_FILTER,
        },
      });
      if (result.error) throw result.error;
      // Application order: the earliest applications are invited first when places run short.
      const recipients = [...(result.data?.Course_by_pk?.CourseEnrollments ?? [])].sort((a, b) => a.id - b.id);
      return {
        inviteIds: recipients.filter((e) => e.motivationRating === MotivationRating_enum.INVITE).map((e) => e.id),
        rejectionIds: recipients.filter((e) => e.motivationRating === MotivationRating_enum.DECLINE).map((e) => e.id),
        waitlistIds: new Set(
          recipients.filter((e) => e.status === CourseEnrollmentStatus_enum.WAITLIST).map((e) => e.id)
        ),
        // Green waitlisted rows in queue order, as WaitlistOrder shows them: created_at, then id.
        waitlistQueueIds: recipients
          .filter(
            (e) =>
              e.status === CourseEnrollmentStatus_enum.WAITLIST && e.motivationRating === MotivationRating_enum.INVITE
          )
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || a.id - b.id)
          .map((e) => e.id),
        freePlaces: freePlacesOf(result.data?.Course_by_pk ?? null),
      };
    },
    [course.id, loadInviteRecipients]
  );

  const handleOpenDecisionsDialog = useCallback(async () => {
    setIsLoadingInviteRecipients(true);
    try {
      const { inviteIds, rejectionIds, waitlistIds, waitlistQueueIds, freePlaces } = await loadUndecidedRated();
      // The waitlist moves up first, in queue order; the other applications follow in application order.
      const waitlistFirst = [...waitlistQueueIds, ...inviteIds.filter((id) => !waitlistIds.has(id))];
      const enrollmentIds = freePlaces == null ? inviteIds : waitlistFirst.slice(0, freePlaces);
      const withheldCount = inviteIds.length - enrollmentIds.length;
      if (enrollmentIds.length === 0 && rejectionIds.length === 0) {
        showBulkNotice(
          withheldCount > 0 ? t('bulk_actions.course_full_no_invitations') : t('bulk_actions.no_eligible_decisions'),
          4000
        );
        return;
      }
      setInviteDialogData({
        mode: 'decisions',
        source: 'rating',
        enrollmentIds,
        waitlistInviteCount: enrollmentIds.filter((id) => waitlistIds.has(id)).length,
        rejectionIds,
        freePlaces,
        withheldCount,
        skippedCount: 0,
      });
      setInviteExpireDate(getDefaultInviteExpireDate());
      setIsInviteDialogOpen(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setInviteError(t('bulk_actions.send_invitations_error', { error: errorMessage }));
    } finally {
      setIsLoadingInviteRecipients(false);
    }
  }, [getDefaultInviteExpireDate, loadUndecidedRated, showBulkNotice, t]);

  /**
   * Opens the dialog for inviting the selected green-rated or rejecting the selected red-rated
   * applications. Eligibility is checked against the server, not the loaded rows. Returns whether
   * the dialog opened. A selection that needs more places than are free may overbook the course:
   * the organizer chose these people, so the dialog only warns.
   */
  const openSelectionDecisionDialog = useCallback(
    async (kind: 'invite' | 'reject', selectedRows: ApplicationEnrollment[]) => {
      setIsLoadingInviteRecipients(true);
      try {
        const { inviteIds, rejectionIds, waitlistIds, freePlaces } = await loadUndecidedRated(
          selectedRows.map((e) => e.id)
        );
        const eligibleIds = kind === 'invite' ? inviteIds : rejectionIds;
        if (eligibleIds.length === 0) {
          showBulkNotice(
            kind === 'invite' ? t('bulk_actions.no_eligible_invitations') : t('bulk_actions.no_eligible_rejections'),
            4000
          );
          return false;
        }
        setInviteDialogData({
          mode: 'decisions',
          source: 'selection',
          enrollmentIds: kind === 'invite' ? eligibleIds : [],
          waitlistInviteCount: kind === 'invite' ? eligibleIds.filter((id) => waitlistIds.has(id)).length : 0,
          rejectionIds: kind === 'reject' ? eligibleIds : [],
          freePlaces,
          withheldCount: 0,
          skippedCount: selectedRows.length - eligibleIds.length,
        });
        setInviteExpireDate(getDefaultInviteExpireDate());
        setIsInviteDialogOpen(true);
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setInviteError(t('bulk_actions.send_invitations_error', { error: errorMessage }));
        return false;
      } finally {
        setIsLoadingInviteRecipients(false);
      }
    },
    [getDefaultInviteExpireDate, loadUndecidedRated, showBulkNotice, t]
  );

  const handleOpenRenewInvitationDialog = useCallback(
    (enrollment: ApplicationEnrollment) => {
      setInviteDialogData({
        mode: 'renew',
        enrollmentIds: [enrollment.id],
        name: `${enrollment.User.firstName} ${enrollment.User.lastName}`.trim(),
      });
      setInviteExpireDate(getDefaultInviteExpireDate());
      setIsInviteDialogOpen(true);
    },
    [getDefaultInviteExpireDate]
  );

  const courseFreePlaces = freePlacesOf(course);

  /** Invites one applied or waitlisted person from their row, whatever their rating. */
  const handleOpenSingleInviteDialog = useCallback(
    (enrollment: ApplicationEnrollment) => {
      setInviteDialogData({
        mode: 'single',
        enrollmentIds: [enrollment.id],
        name: `${enrollment.User.firstName} ${enrollment.User.lastName}`.trim(),
        fromWaitlist: enrollment.status === CourseEnrollmentStatus_enum.WAITLIST,
        freePlaces: courseFreePlaces,
      });
      setInviteExpireDate(getDefaultInviteExpireDate());
      setIsInviteDialogOpen(true);
    },
    [courseFreePlaces, getDefaultInviteExpireDate]
  );

  // The dialog cannot be closed while the mutation runs.
  const [isSendingInvitations, setIsSendingInvitations] = useState(false);

  const isSelectionDecision = inviteDialogData?.mode === 'decisions' && inviteDialogData.source === 'selection';

  const handleCloseInviteDialog = useCallback(() => {
    if (isSendingInvitations) return;
    setIsInviteDialogOpen(false);
    setInviteDialogData(null);
    // Not confirmed: the selected rows stay selected.
    if (isSelectionDecision) dialogBulkAction.fail();
  }, [dialogBulkAction, isSelectionDecision, isSendingInvitations]);

  const handleSendInvitations = useCallback(async () => {
    if (!inviteDialogData || isSendingInvitations) return;
    // The mutations only touch rows still undecided (and, for decisions by rating, still rated the
    // same), so a list loaded a moment ago cannot override what changed in the meantime.
    const { enrollmentIds } = inviteDialogData;
    const rejectionIds = inviteDialogData.mode === 'decisions' ? inviteDialogData.rejectionIds : [];
    // The day the picker shows. Sending the Date itself would store its
    // UTC day, which in Germany is the previous day shortly after midnight.
    const expire = format(inviteExpireDate, 'yyyy-MM-dd');

    let invitedCount = 0;
    let rejectedCount = 0;
    setIsSendingInvitations(true);
    try {
      if (enrollmentIds.length > 0) {
        const status = CourseEnrollmentStatus_enum.INVITED;
        const result =
          inviteDialogData.mode === 'renew' || inviteDialogData.mode === 'single'
            ? await updateEnrollmentStatusForInvite({ variables: { enrollmentIds, status, expire } })
            : await updateEnrollmentStatusByRating({
                variables: { enrollmentIds, rating: MotivationRating_enum.INVITE, status, expire },
              });
        invitedCount = result.data?.update_CourseEnrollment?.affected_rows ?? 0;
      }
      if (rejectionIds.length > 0) {
        const result = await updateEnrollmentStatusByRating({
          variables: {
            enrollmentIds: rejectionIds,
            rating: MotivationRating_enum.DECLINE,
            status: CourseEnrollmentStatus_enum.REJECTED,
            expire: null,
          },
        });
        rejectedCount = result.data?.update_CourseEnrollment?.affected_rows ?? 0;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Invitations that already went out are not sent twice on a retry: they are no longer
      // undecided, so the next load leaves them out.
      setInviteError(
        isCourseFullError(error)
          ? t('bulk_actions.course_full_error')
          : t('bulk_actions.send_decisions_error', { error: errorMessage })
      );
      setIsInviteDialogOpen(false);
      setInviteDialogData(null);
      if (isSelectionDecision) dialogBulkAction.fail();
      await qResult.refetch().catch(() => undefined);
      return;
    } finally {
      setIsSendingInvitations(false);
    }

    if (invitedCount === 0 && rejectedCount === 0) {
      showBulkNotice(t('bulk_actions.no_eligible_decisions'));
    } else {
      showBulkNotice(t('bulk_actions.decisions_queued', { invited: invitedCount, rejected: rejectedCount }), 4000);
    }
    if (isSelectionDecision) {
      if (invitedCount === 0 && rejectedCount === 0) dialogBulkAction.fail();
      else dialogBulkAction.succeed();
    }
    setIsInviteDialogOpen(false);
    setInviteDialogData(null);

    try {
      await qResult.refetch();
    } catch (refetchError) {
      console.error('ApplicationsTab: refetch after sending decisions failed', refetchError);
    }
  }, [
    dialogBulkAction,
    inviteDialogData,
    isSelectionDecision,
    isSendingInvitations,
    inviteExpireDate,
    updateEnrollmentStatusForInvite,
    updateEnrollmentStatusByRating,
    qResult,
    showBulkNotice,
    t,
  ]);

  // Cancelling registrations: the ids waiting for confirmation, null while no dialog is open.
  const [cancelEnrollmentIds, setCancelEnrollmentIds] = useState<number[] | null>(null);
  const [isCancellingEnrollments, setIsCancellingEnrollments] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCloseCancelDialog = useCallback(() => {
    if (isCancellingEnrollments) return;
    setCancelEnrollmentIds(null);
    // Not confirmed: the rows stay selected.
    dialogBulkAction.fail();
  }, [dialogBulkAction, isCancellingEnrollments]);

  const handleConfirmCancelEnrollments = useCallback(async () => {
    if (!cancelEnrollmentIds || isCancellingEnrollments) return;
    let cancelledCount = 0;
    setIsCancellingEnrollments(true);
    try {
      const result = await cancelEnrollmentsByOrganizer({
        variables: { enrollmentIds: cancelEnrollmentIds, courseId: course.id },
      });
      cancelledCount = result.data?.update_CourseEnrollment?.affected_rows ?? 0;
    } catch (error) {
      // A failed request is not "nothing eligible": say what went wrong, keep the rows selected.
      const errorMessage = error instanceof Error ? error.message : String(error);
      setCancelError(t('bulk_actions.cancel_registrations_error', { error: errorMessage }));
      setCancelEnrollmentIds(null);
      dialogBulkAction.fail();
      return;
    } finally {
      setIsCancellingEnrollments(false);
    }
    setCancelEnrollmentIds(null);
    if (cancelledCount === 0) {
      showBulkNotice(t('bulk_actions.no_eligible_cancellations'));
      dialogBulkAction.fail();
      return;
    }
    showBulkNotice(
      `${t('bulk_actions.registrations_cancelled', { count: cancelledCount })} ${tCommon('status_email.sent', {
        count: cancelledCount,
        template: templateLabel(MailTemplateType_enum.ENROLLMENT_CANCELLED),
      })}`,
      5000
    );
    dialogBulkAction.succeed();
    try {
      await qResult.refetch();
    } catch (refetchError) {
      console.error('ApplicationsTab: refetch after cancelling registrations failed', refetchError);
    }
  }, [
    cancelEnrollmentIds,
    isCancellingEnrollments,
    cancelEnrollmentsByOrganizer,
    course.id,
    showBulkNotice,
    t,
    tCommon,
    templateLabel,
    dialogBulkAction,
    qResult,
  ]);

  // Moving one person up from the waitlist on a direct-registration course: confirmed straight away.
  const [waitlistConfirmCandidate, setWaitlistConfirmCandidate] = useState<ApplicationEnrollment | null>(null);
  const [isConfirmingWaitlist, setIsConfirmingWaitlist] = useState(false);
  const [waitlistConfirmError, setWaitlistConfirmError] = useState<string | null>(null);
  const handleCloseWaitlistConfirmDialog = useCallback(() => {
    if (isConfirmingWaitlist) return;
    setWaitlistConfirmCandidate(null);
  }, [isConfirmingWaitlist]);

  const handleConfirmWaitlistEnrollment = useCallback(async () => {
    if (!waitlistConfirmCandidate || isConfirmingWaitlist) return;
    const name = `${waitlistConfirmCandidate.User.firstName} ${waitlistConfirmCandidate.User.lastName}`.trim();
    let confirmedCount = 0;
    setIsConfirmingWaitlist(true);
    try {
      const result = await confirmWaitlistEnrollment({
        variables: { enrollmentId: waitlistConfirmCandidate.id, courseId: course.id },
      });
      confirmedCount = result.data?.update_CourseEnrollment?.affected_rows ?? 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setWaitlistConfirmError(t('bulk_actions.waitlist_confirm_error', { error: errorMessage }));
      return;
    } finally {
      setIsConfirmingWaitlist(false);
      setWaitlistConfirmCandidate(null);
    }
    if (confirmedCount === 0) {
      // Someone else moved or cancelled them in the meantime.
      showBulkNotice(t('bulk_actions.waitlist_confirm_stale', { name }), 4000);
    } else {
      showBulkNotice(
        `${t('bulk_actions.waitlist_confirmed', { name })} ${tCommon('status_email.sent', {
          count: 1,
          template: templateLabel(MailTemplateType_enum.WAITLIST_CONFIRMED),
        })}`,
        5000
      );
    }
    try {
      await qResult.refetch();
    } catch (refetchError) {
      console.error('ApplicationsTab: refetch after confirming from the waitlist failed', refetchError);
    }
  }, [
    waitlistConfirmCandidate,
    isConfirmingWaitlist,
    confirmWaitlistEnrollment,
    course.id,
    showBulkNotice,
    t,
    tCommon,
    templateLabel,
    qResult,
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
        return false;
      }

      if (action === 'cancel_registrations_selected') {
        // Nothing happened in these cases, so the rows stay selected.
        if (selectedRows.length === 0) {
          setIsNoSelectionDialogOpen(true);
          return false;
        }
        const enrollmentIds = selectedRows
          .filter((e) => CANCELLATION_REQUEST_OPEN_STATUSES.includes(e.status))
          .map((e) => e.id);
        if (enrollmentIds.length === 0) {
          showBulkNotice(t('bulk_actions.no_eligible_cancellations'));
          return false;
        }
        setCancelEnrollmentIds(enrollmentIds);
        // handleConfirmCancelEnrollments settles the action once the dialog is confirmed.
        return dialogBulkAction.start();
      }

      if (action === 'send_invitations_selected' || action === 'send_rejections_selected') {
        // Nothing happened in these cases, so the rows stay selected.
        if (selectedRows.length === 0) {
          setIsNoSelectionDialogOpen(true);
          return false;
        }
        const opened = await openSelectionDecisionDialog(
          action === 'send_invitations_selected' ? 'invite' : 'reject',
          selectedRows
        );
        if (!opened) return false;
        // handleSendInvitations settles the action once the dialog is confirmed.
        return dialogBulkAction.start();
      }

      // Handle email actions (existing)
      if (action === 'email_selected') {
        targetEnrollments = selectedRows;
      } else if (action.startsWith('email_status_') || action.startsWith('email_rating_')) {
        const isStatusAction = action.startsWith('email_status_');
        const emailActionLabelByValue: Record<string, string> = {
          email_status_REGISTERED: t('bulk_actions.email_all_registered'),
          email_status_CANCELLED: t('bulk_actions.email_all_cancelled'),
          email_status_INVITED: t('bulk_actions.email_all_invited'),
          email_status_APPLIED: t('bulk_actions.email_all_applied'),
          email_status_REJECTED: t('bulk_actions.email_all_rejected'),
          email_status_WAITLIST: t('bulk_actions.email_all_waitlist'),
          email_rating_INVITE: t('bulk_actions.email_all_invite_rating'),
          email_rating_DECLINE: t('bulk_actions.email_all_decline_rating'),
          email_rating_REVIEW: t('bulk_actions.email_all_review_rating'),
        };
        const groupedStatuses = EMAIL_ACTION_STATUSES[action];
        const filter = isStatusAction
          ? groupedStatuses
            ? { status: { _in: groupedStatuses } }
            : {
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
            return false;
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
        // These actions address everyone matching the filter rather than the selection, so the
        // selection is left untouched.
        return false;
      }

      // Nothing happened in these cases, so the rows stay selected.
      if (targetEnrollments.length === 0) {
        return false;
      }

      const emails = targetEnrollments.map((e) => e.User.email).filter(Boolean);
      if (emails.length === 0) {
        showBulkNotice(t('bulk_actions.no_email_recipients'));
        return false;
      }

      openMailtoOrShowFallback({
        actionLabel: t('bulk_actions.email_selected'),
        recipients: targetEnrollments,
        totalCount: targetEnrollments.length,
        isMailtoTooLong: false,
        isLimited: false,
      });
    },
    [
      buildMailtoUrl,
      course.id,
      dialogBulkAction,
      setCancelEnrollmentIds,
      loadBulkEmailRecipients,
      openMailtoOrShowFallback,
      openSelectionDecisionDialog,
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
    ];

    // Cancelling is the organizer's side of a participant's cancellation request (a paid
    // registration cannot be cancelled by the participant), and applies to every registration type.
    actions.push({
      value: 'cancel_registrations_selected',
      label: t('bulk_actions.cancel_registrations_selected'),
      group: t('bulk_actions.manage_registrations'),
      requiresSelection: true,
      disabled: !canDecideRegistrations,
      disabledReason: !canDecideRegistrations
        ? t('bulk_actions.disabled_reasons.instructors_only')
        : t('bulk_actions.disabled_reasons.select_participants_first'),
    });

    // Invitations, rejections, applied/invited/rejected/waitlist statuses, and motivation
    // ratings only exist as part of an approval-based application process — direct
    // registrations never move through them, so they don't belong in this menu.
    if (!features.hasApplicationProcess) {
      actions.push({
        value: 'email_status_REGISTERED',
        label: t('bulk_actions.email_all_registered'),
        group: t('bulk_actions.email_all_by_status'),
      });
      actions.push({
        value: 'email_status_CANCELLED',
        label: t('bulk_actions.email_all_cancelled'),
        group: t('bulk_actions.email_all_by_status'),
      });
      return actions;
    }

    // The "send by rating" button above the table decides on everyone rated green or red; these
    // decide on the selected rows only.
    const decisionDisabledReason = !canDecideRegistrations
      ? t('bulk_actions.disabled_reasons.instructors_only')
      : t('bulk_actions.disabled_reasons.select_participants_first');
    actions.push(
      {
        value: 'send_invitations_selected',
        label: t('bulk_actions.send_invitations_selected'),
        group: t('bulk_actions.send_decisions'),
        requiresSelection: true,
        disabled: !canDecideRegistrations,
        disabledReason: decisionDisabledReason,
      },
      {
        value: 'send_rejections_selected',
        label: t('bulk_actions.send_rejections_selected'),
        group: t('bulk_actions.send_decisions'),
        requiresSelection: true,
        disabled: !canDecideRegistrations,
        disabledReason: decisionDisabledReason,
      },
      {
        value: 'email_status_REGISTERED',
        label: t('bulk_actions.email_all_registered'),
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
      }
    );

    return actions;
  }, [features.hasApplicationProcess, canDecideRegistrations, t]);

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
      EXPIRED: 9,
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
          // Shown in the expanded row instead on narrower screens.
          meta: { hideBelow: 'xl' },
          cell: ({ row }) => {
            const orgName = row.original.User.Organization?.name ?? row.original.User.organizationName;
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
          meta: { hideBelow: 'lg' },
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
          meta: { hideBelow: 'lg' },
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
        cell: ({ row }) => renderStatus(row.original, t, features.hasApplicationProcess),
      });

      return baseColumns;
    },
    [t, ratingSortFn, statusSortFn, features, displayDate]
  );

  // Effective Formbricks survey URL: the course setting overrides the program default.
  const effectiveSurveyUrl =
    course.formbricksEnrollmentSurveyUrl || course.Program?.defaultFormbricksEnrollmentSurveyUrl || null;

  // 1-based place of each waitlisted enrollment, first come first served.
  const waitlistPositions = useMemo(
    () => new Map((course.WaitlistOrder ?? []).map((entry, index) => [entry.id, index + 1])),
    [course.WaitlistOrder]
  );
  const paidDirectRegistration = isPaidDirectRegistration(course.registrationType);

  /**
   * The row's way in: on an application course, invite someone who applied or waits (with a
   * deadline); on a direct-registration course, give someone waiting a confirmed place, or on a
   * paid one invite them to pay for it by a deadline.
   */
  const promotionOf = (enrollment: ApplicationEnrollment) => {
    if (!canDecideRegistrations) return {};
    const isWaiting = enrollment.status === CourseEnrollmentStatus_enum.WAITLIST;
    if (features.hasApplicationProcess) {
      return isWaiting || enrollment.status === CourseEnrollmentStatus_enum.APPLIED
        ? { onPromote: () => handleOpenSingleInviteDialog(enrollment), promoteLabelKey: 'application_details.invite_single' }
        : {};
    }
    if (!isWaiting) return {};
    if (paidDirectRegistration) {
      return { onPromote: () => handleOpenSingleInviteDialog(enrollment), promoteLabelKey: 'application_details.invite_single' };
    }
    return {
      onPromote: () => setWaitlistConfirmCandidate(enrollment),
      promoteLabelKey: 'application_details.confirm_from_waitlist',
    };
  };

  const ExpandableApplicationRow = ({ row: enrollment, ...navigation }: ExpandedRowProps<ApplicationEnrollment>) => (
    <ApplicationDetails
      enrollment={enrollment}
      features={features}
      surveyUrl={effectiveSurveyUrl}
      onRate={(rating) => setEnrollmentRating(enrollment, rating)}
      onRenewInvitation={
        canDecideRegistrations && canRenewInvitation(enrollment)
          ? () => handleOpenRenewInvitationDialog(enrollment)
          : undefined
      }
      waitlistPosition={waitlistPositions.get(enrollment.id)}
      {...promotionOf(enrollment)}
      isInvitationExpired={enrollment.status === 'EXPIRED' || isExpired(enrollment)}
      displayDate={displayDate}
      {...navigation}
    />
  );

  // Phones: one card per enrollment, with the rating and status spelled out instead of a legend.
  const renderMobileRow = useCallback(
    (enrollment: ApplicationEnrollment) => {
      const orgName = enrollment.User.Organization?.name ?? enrollment.User.organizationName;
      const rating = RATING_OPTIONS.find((option) => option.value === enrollment.motivationRating);
      return (
        <div className="flex flex-col gap-1">
          <div className="font-semibold">
            {enrollment.User.firstName} {enrollment.User.lastName}
          </div>
          {orgName && <div className="truncate text-xs text-label-secondary">{orgName}</div>}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1 text-xs text-label-secondary">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {features.hasApplicationProcess && enrollment.created_at && (
                <span className="tabular-nums">{displayDate(enrollment.created_at)}</span>
              )}
              {features.hasApplicationProcess && rating && (
                <span className="flex items-center gap-1">
                  <span className="text-[10px]">
                    <Dot color={rating.color} className="block" />
                  </span>
                  {t(rating.labelKey)}
                </span>
              )}
              {features.hasPayment && (
                <span>{t(`payment_status_values.${getPaymentStatusFromInvoices(enrollment.Invoices)}`)}</span>
              )}
            </div>
            {renderStatus(enrollment, t, features.hasApplicationProcess)}
          </div>
        </div>
      );
    },
    [features, displayDate, t]
  );

  // The emails the open invite dialog sends, and how far it would overbook the course.
  const inviteDialogEmails: StatusChangeEmail[] = [];
  let inviteDialogOverbooking = 0;
  if (inviteDialogData?.mode === 'decisions') {
    const fromWaitlist = inviteDialogData.waitlistInviteCount;
    inviteDialogEmails.push(
      {
        template: enrollmentStatusMailTemplate({
          oldStatus: 'APPLIED',
          newStatus: 'INVITED',
          registrationType: course.registrationType,
        }),
        count: inviteDialogData.enrollmentIds.length - fromWaitlist,
      },
      {
        template: enrollmentStatusMailTemplate({
          oldStatus: 'WAITLIST',
          newStatus: 'INVITED',
          registrationType: course.registrationType,
        }),
        count: fromWaitlist,
      },
      {
        template: enrollmentStatusMailTemplate({ oldStatus: 'APPLIED', newStatus: 'REJECTED' }),
        count: inviteDialogData.rejectionIds.length,
      }
    );
    inviteDialogOverbooking = overbookingOf(inviteDialogData.freePlaces, inviteDialogData.enrollmentIds.length);
  } else if (inviteDialogData?.mode === 'renew') {
    inviteDialogEmails.push({
      template: enrollmentStatusMailTemplate({
        oldStatus: 'INVITED',
        newStatus: 'INVITED',
        registrationType: course.registrationType,
      }),
      count: 1,
    });
  } else if (inviteDialogData?.mode === 'single') {
    inviteDialogEmails.push({
      template: enrollmentStatusMailTemplate({
        oldStatus: inviteDialogData.fromWaitlist ? 'WAITLIST' : 'APPLIED',
        newStatus: 'INVITED',
        registrationType: course.registrationType,
      }),
      count: 1,
    });
    inviteDialogOverbooking = overbookingOf(inviteDialogData.freePlaces, 1);
  }
  const takenPlaces = course.TakenPlaces?.aggregate?.count ?? 0;
  const overbookingWarning = (count: number) =>
    count > 0 && course.maxParticipants != null ? (
      <p className="mb-2 flex items-start gap-2 text-sm text-warning" role="alert">
        <MdWarningAmber className="mt-0.5 flex-shrink-0" aria-hidden="true" />
        {t('bulk_actions.overbook_warning', { count, taken: takenPlaces + count, max: course.maxParticipants })}
      </p>
    ) : null;

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
        <AddParticipantsForm
          courseId={course.id}
          registrationType={course.registrationType}
          hasApplicationProcess={features.hasApplicationProcess}
          hasCourseStarted={hasCourseStarted}
          freePlaces={courseFreePlaces}
          takenPlaces={takenPlaces}
          maxParticipants={course.maxParticipants}
          onSubmit={closeAddParticipantsModal}
        />
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

      <CourseEnrollmentStatistics course={course} hasCourseStarted={hasCourseStarted} />

      <div>
        {(isInstructor || isAdmin) && (
          <TableGrid<ApplicationEnrollment>
            columns={columns}
            data={courseEnrollments}
            loading={loading}
            error={error}
            expandableRowComponent={ExpandableApplicationRow}
            renderMobileRow={renderMobileRow}
            bulkActions={bulkActions}
            onBulkAction={handleBulkEmailAction}
            loadAllRows={loadAllEnrollments}
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
            toolbarActions={
              <>
                {features.hasApplicationProcess && canDecideRegistrations && (
                  <OldButton onClick={handleOpenDecisionsDialog} disabled={isLoadingInviteRecipients} filled>
                    {t('bulk_actions.send_decisions_by_rating')}
                  </OldButton>
                )}
                <ParticipantExportMenu courseId={course.id} />
              </>
            }
            {...(isAdmin && {
              addButtonText: t('add_participants'),
              onAddButtonClick: openAddParticipantsModal,
            })}
          />
        )}

        {courseEnrollments.length > 0 && features.hasApplicationProcess && (
          // Mobile cards name the rating next to its dot, so the legend is only needed for the table.
          <div className="hidden md:block -mt-8 mb-3">{infoDots}</div>
        )}
      </div>

      {/* Invitation Dialog — Paper uses .light so semantic button/text colors match white surface */}
      <Dialog
        open={isInviteDialogOpen}
        onClose={handleCloseInviteDialog}
        // The date picker calendar is portaled outside the dialog; without this the
        // focus trap pulls focus back and interferes with the calendar navigation.
        disableEnforceFocus
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'light' }}
      >
        <DialogTitle>
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold text-label-primary">
              {inviteDialogData?.mode === 'renew'
                ? t('bulk_actions.renew_invitation_dialog_title')
                : inviteDialogData?.mode === 'single'
                ? t('bulk_actions.single_invite_dialog_title', { name: inviteDialogData.name })
                : inviteDialogData?.source === 'selection'
                  ? inviteDialogData.enrollmentIds.length > 0
                    ? t('bulk_actions.send_invitations_dialog_title')
                    : t('bulk_actions.send_rejections_dialog_title')
                  : t('bulk_actions.send_decisions_dialog_title')}
            </div>
            <div
              className={`text-label-primary ${
                isSendingInvitations ? 'pointer-events-none opacity-50' : 'cursor-pointer'
              }`}
              onClick={handleCloseInviteDialog}
            >
              <MdClose className="w-6 h-6" />
            </div>
          </div>
        </DialogTitle>
        <div className="px-6 pb-6">
          {inviteDialogData && (
            <>
              <div className="mb-6">
                {inviteDialogData.mode === 'renew' ? (
                  <p className="text-label-primary mb-4">
                    {t('bulk_actions.renew_invitation_text', { name: inviteDialogData.name })}
                  </p>
                ) : inviteDialogData.mode === 'single' ? (
                  <>
                    <p className="text-label-primary mb-4">
                      {t(
                        paidDirectRegistration
                          ? 'bulk_actions.single_invite_text_payment'
                          : 'bulk_actions.single_invite_text',
                        { name: inviteDialogData.name }
                      )}
                    </p>
                    {inviteDialogData.freePlaces != null && (
                      <p className="text-sm text-label-secondary mb-2">
                        {t('bulk_actions.free_places', { count: inviteDialogData.freePlaces })}
                      </p>
                    )}
                    {overbookingWarning(inviteDialogOverbooking)}
                  </>
                ) : (
                  <>
                    <ul className="text-label-primary mb-4 space-y-2">
                      {(inviteDialogData.source === 'rating' || inviteDialogData.enrollmentIds.length > 0) && (
                        <li className="flex items-center gap-2">
                          <Dot color="lightgreen" />
                          {t('bulk_actions.send_decisions_invite_count', { count: inviteDialogData.enrollmentIds.length })}
                        </li>
                      )}
                      {(inviteDialogData.source === 'rating' || inviteDialogData.rejectionIds.length > 0) && (
                        <li className="flex items-center gap-2">
                          <Dot color="red" />
                          {t('bulk_actions.send_decisions_reject_count', { count: inviteDialogData.rejectionIds.length })}
                        </li>
                      )}
                    </ul>
                    {inviteDialogData.freePlaces != null &&
                      (inviteDialogData.enrollmentIds.length > 0 || inviteDialogData.withheldCount > 0) && (
                        <p className="text-sm text-label-secondary mb-2">
                          {t('bulk_actions.free_places', { count: inviteDialogData.freePlaces })}
                        </p>
                      )}
                    {overbookingWarning(inviteDialogOverbooking)}
                    {inviteDialogData.withheldCount > 0 && (
                      <p className="text-sm text-warning mb-2">
                        {t('bulk_actions.invitations_withheld', { count: inviteDialogData.withheldCount })}
                      </p>
                    )}
                    {inviteDialogData.skippedCount > 0 && (
                      <p className="text-sm text-label-secondary mb-4">
                        {t('bulk_actions.selection_skipped', { count: inviteDialogData.skippedCount })}
                      </p>
                    )}
                  </>
                )}
                {inviteDialogData.enrollmentIds.length > 0 && (
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
                      // Render the calendar outside the dialog so it is not clipped by it
                      portalId={INVITE_DATEPICKER_PORTAL_ID}
                      popperPlacement="bottom-start"
                    />
                  </div>
                )}
                <StatusChangeEmailNotice courseId={course.id} emails={inviteDialogEmails} />
              </div>
              <div className="flex justify-end gap-3">
                <OldButton onClick={handleCloseInviteDialog} inverted disabled={isSendingInvitations}>
                  {tCommon('cancel')}
                </OldButton>
                <OldButton onClick={handleSendInvitations} filled disabled={isSendingInvitations}>
                  {inviteDialogData.mode === 'renew' || inviteDialogData.mode === 'single'
                    ? t('bulk_actions.renew_invitation_confirm')
                    : t('bulk_actions.send_decisions_confirm')}
                </OldButton>
              </div>
            </>
          )}
        </div>
      </Dialog>

      <QuestionConfirmationDialog
        open={cancelEnrollmentIds != null}
        onClose={handleCloseCancelDialog}
        onConfirm={handleConfirmCancelEnrollments}
        confirmDisabled={isCancellingEnrollments}
        confirmationText={t('bulk_actions.cancel_registrations_confirm')}
        question={t('bulk_actions.cancel_registrations_question', { count: cancelEnrollmentIds?.length ?? 0 })}
      >
        <StatusChangeEmailNotice
          courseId={course.id}
          emails={[
            {
              template: enrollmentStatusMailTemplate({ oldStatus: 'CONFIRMED', newStatus: 'CANCELLED' }),
              count: cancelEnrollmentIds?.length ?? 0,
            },
          ]}
        />
      </QuestionConfirmationDialog>

      <QuestionConfirmationDialog
        open={waitlistConfirmCandidate != null}
        title={t('bulk_actions.confirm_waitlist_dialog_title')}
        onClose={handleCloseWaitlistConfirmDialog}
        onConfirm={handleConfirmWaitlistEnrollment}
        confirmDisabled={isConfirmingWaitlist}
        confirmationText={t('bulk_actions.confirm_waitlist_confirm')}
        question={
          waitlistConfirmCandidate
            ? t('bulk_actions.confirm_waitlist_question', {
                name: `${waitlistConfirmCandidate.User.firstName} ${waitlistConfirmCandidate.User.lastName}`.trim(),
                position: waitlistPositions.get(waitlistConfirmCandidate.id) ?? 1,
              })
            : ''
        }
      >
        {courseFreePlaces != null && (
          <p className="mt-3 text-sm text-label-secondary">
            {t('bulk_actions.free_places', { count: courseFreePlaces })}
          </p>
        )}
        <div className="mt-2">{overbookingWarning(overbookingOf(courseFreePlaces, 1))}</div>
        <StatusChangeEmailNotice
          courseId={course.id}
          emails={[
            {
              template: enrollmentStatusMailTemplate({
                oldStatus: 'WAITLIST',
                newStatus: 'CONFIRMED',
                registrationType: course.registrationType,
              }),
              count: 1,
            },
          ]}
        />
      </QuestionConfirmationDialog>

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
        errorMessage={waitlistConfirmError || ''}
        open={!!waitlistConfirmError}
        onClose={() => setWaitlistConfirmError(null)}
      />
      <ErrorMessageDialog
        errorMessage={cancelError || ''}
        open={!!cancelError}
        onClose={() => setCancelError(null)}
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
