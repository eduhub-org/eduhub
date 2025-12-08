import { QueryResult } from '@apollo/client';
import { FC, useCallback, useMemo, useState } from 'react';
import {
  ManagedCourse_Course_by_pk,
  ManagedCourse_Course_by_pk_CourseEnrollments,
} from '../../../../queries/__generated__/ManagedCourse';
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
import { UPDATE_ENROLLMENT_STATUS, UPDATE_ENROLLMENT_RATING } from '../../../../queries/insertEnrollment';
import { Button as OldButton } from '../../../common/Button';
import { Dialog, DialogTitle, Tooltip } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { MdClose } from 'react-icons/md';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  UpdateEnrollmentStatus,
  UpdateEnrollmentStatusVariables,
} from '../../../../queries/__generated__/UpdateEnrollmentStatus';
import { useTranslations, useLocale } from 'next-intl';
import Modal from '../../../common/Modal';
import AddParticipantsForm from './AddParticipantsForm';
import TableGrid from '../../../common/TableGrid';
import { ColumnDef } from '@tanstack/react-table';
import { GoDotFill } from 'react-icons/go';
import { IoIosCheckmarkCircle, IoIosCloseCircle } from 'react-icons/io';
import { MotivationRating_enum, CourseEnrollmentStatus_enum } from '../../../../__generated__/globalTypes';
import { useDisplayDate } from '../../../../helpers/dateTimeHelpers';
import { BulkAction } from '../../../common/TableGrid/types';
import { ApolloError } from '@apollo/client';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';

interface IProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

const isExpired = (enrollment: ManagedCourse_Course_by_pk_CourseEnrollments) => {
  if (enrollment.invitationExpirationDate == null) {
    return false;
  }
  return new Date(enrollment.invitationExpirationDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
};

export const ApplicationsTab: FC<IProps> = ({ course, qResult }) => {
  const t = useTranslations('manageCourse');
  const locale = useLocale();
  const displayDate = useDisplayDate();
  const isInstructor = useIsInstructor();
  const isAdmin = useIsAdmin();
  const theme = useTheme();

  const applicationStats = useMemo(() => {
    const totalApplications = course.CourseEnrollments.length;
    const approvedApplications = course.CourseEnrollments.filter(
      (enrollment) => enrollment.motivationRating === 'INVITE'
    ).length;
    const invitedApplicants = course.CourseEnrollments.filter(
      (enrollment) => enrollment.status === 'INVITED' || enrollment.status === 'CONFIRMED'
    ).length;
    const confirmedApplicants = course.CourseEnrollments.filter(
      (enrollment) => enrollment.status === 'CONFIRMED'
    ).length;
    return { totalApplications, approvedApplications, invitedApplicants, confirmedApplicants };
  }, [course.CourseEnrollments]);

  const infoDots = (
    <div className="text-gray-400 text-sm">
      <div className="mb-1">{t('coursePage.application-rating')}</div>
      <div className="flex gap-4 text-gray-400">
        <div className="flex items-center gap-1">
          <Dot color="lightgreen" /> <span>{t('coursePage.invite')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Dot color="orange" /> <span>{t('coursePage.unclear')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Dot color="red" /> <span>{t('coursePage.reject')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Dot color="grey" /> <span>{t('coursePage.not-rated')}</span>
        </div>
      </div>
    </div>
  );

  const [updateEnrollmentStatus] = useRoleMutation<UpdateEnrollmentStatus, UpdateEnrollmentStatusVariables>(
    UPDATE_ENROLLMENT_STATUS
  );

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
    enrollmentsToSend: ManagedCourse_Course_by_pk_CourseEnrollments[];
    selectedCount?: number;
    identifiedCount: number;
    actionType: 'selected' | 'all';
  } | null>(null);

  const handleOpenInviteDialog = useCallback(
    (enrollmentsToSend: ManagedCourse_Course_by_pk_CourseEnrollments[], selectedCount: number | undefined, identifiedCount: number, actionType: 'selected' | 'all') => {
      setInviteDialogData({ enrollmentsToSend, selectedCount, identifiedCount, actionType });
      setInviteExpireDate(getDefaultInviteExpireDate());
      setIsInviteDialogOpen(true);
    },
    [getDefaultInviteExpireDate]
  );

  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleCloseInviteDialog = useCallback(() => {
    setIsInviteDialogOpen(false);
    setInviteDialogData(null);
    setInviteError(null);
  }, []);

  const handleSendInvitations = useCallback(async () => {
    if (!inviteDialogData) return;

    try {
      for (const enrollment of inviteDialogData.enrollmentsToSend) {
        await updateEnrollmentStatus({
          variables: {
            enrollmentId: enrollment.id,
            expire: inviteExpireDate,
            status: CourseEnrollmentStatus_enum.INVITED,
          },
        });
      }
      // Only refetch and close on success
      qResult.refetch();
      handleCloseInviteDialog();
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
    }
  }, [inviteDialogData, inviteExpireDate, updateEnrollmentStatus, qResult, handleCloseInviteDialog, t]);

  // Dialog state for rejections
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [rejectionDialogData, setRejectionDialogData] = useState<{
    enrollmentsToSend: ManagedCourse_Course_by_pk_CourseEnrollments[];
    selectedCount?: number;
    identifiedCount: number;
    actionType: 'selected' | 'all';
  } | null>(null);

  const handleOpenRejectionDialog = useCallback(
    (enrollmentsToSend: ManagedCourse_Course_by_pk_CourseEnrollments[], selectedCount: number | undefined, identifiedCount: number, actionType: 'selected' | 'all') => {
      setRejectionDialogData({ enrollmentsToSend, selectedCount, identifiedCount, actionType });
      setIsRejectionDialogOpen(true);
    },
    []
  );

  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const handleCloseRejectionDialog = useCallback(() => {
    setIsRejectionDialogOpen(false);
    setRejectionDialogData(null);
    setRejectionError(null);
  }, []);

  const handleSendRejections = useCallback(async () => {
    if (!rejectionDialogData) return;

    try {
      for (const enrollment of rejectionDialogData.enrollmentsToSend) {
        await updateEnrollmentStatus({
          variables: {
            enrollmentId: enrollment.id,
            expire: null,
            status: CourseEnrollmentStatus_enum.REJECTED,
          },
        });
      }
      // Only refetch and close on success
      qResult.refetch();
      handleCloseRejectionDialog();
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
    }
  }, [rejectionDialogData, updateEnrollmentStatus, qResult, handleCloseRejectionDialog, t]);

  // Dialog state for "no selection" warning
  const [isNoSelectionDialogOpen, setIsNoSelectionDialogOpen] = useState(false);
  const handleCloseNoSelectionDialog = useCallback(() => {
    setIsNoSelectionDialogOpen(false);
  }, []);

  const setEnrollmentRating = useUpdateCallback2<UpdateEnrollmentRating, UpdateEnrollmentRatingVariables>(
    UPDATE_ENROLLMENT_RATING,
    'enrollmentId',
    'rating',
    pickIdPkMapper,
    identityEventMapper,
    qResult
  );

  const courseEnrollments = useMemo(() => {
    const result = [...course.CourseEnrollments];
    result.sort((a, b) => a.id - b.id);
    return result;
  }, [course]);

  const [isAddParticipantsModalOpen, setAddParticipantsModalOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchFilter, setSearchFilter] = useState('');

  const openAddParticipantsModal = () => setAddParticipantsModalOpen(true);
  const closeAddParticipantsModal = () => setAddParticipantsModalOpen(false);

  // Filter enrollments (TableGrid will handle sorting and pagination)
  const filteredEnrollments = useMemo(() => {
    let filtered = courseEnrollments;
    
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      filtered = filtered.filter((enrollment) => {
        return (
          enrollment.User.firstName.toLowerCase().includes(searchLower) ||
          enrollment.User.lastName.toLowerCase().includes(searchLower) ||
          enrollment.User.email.toLowerCase().includes(searchLower) ||
          (enrollment.motivationLetter || '').toLowerCase().includes(searchLower)
        );
      });
    }
    
    return filtered;
  }, [courseEnrollments, searchFilter]);

  // Bulk actions handler
  const handleBulkEmailAction = useCallback(
    (action: string, selectedRows: ManagedCourse_Course_by_pk_CourseEnrollments[]) => {
      let targetEnrollments: ManagedCourse_Course_by_pk_CourseEnrollments[] = [];

      // Handle invitation actions
      if (action === 'send_invitations_selected') {
        if (selectedRows.length === 0) {
          setIsNoSelectionDialogOpen(true);
          return;
        }
        const enrollmentsToSend = selectedRows.filter(
          (e) => e.motivationRating === 'INVITE' && ['APPLIED', 'INVITED', 'REJECTED'].includes(e.status)
        );
        if (enrollmentsToSend.length > 0) {
          handleOpenInviteDialog(enrollmentsToSend, selectedRows.length, enrollmentsToSend.length, 'selected');
        }
        return;
      } else if (action === 'send_invitations_all') {
        const enrollmentsToSend = courseEnrollments.filter(
          (e) => e.motivationRating === 'INVITE' && ['APPLIED', 'INVITED', 'REJECTED'].includes(e.status)
        );
        if (enrollmentsToSend.length > 0) {
          handleOpenInviteDialog(enrollmentsToSend, undefined, enrollmentsToSend.length, 'all');
        }
        return;
      }

      // Handle rejection actions
      if (action === 'send_rejections_selected') {
        if (selectedRows.length === 0) {
          setIsNoSelectionDialogOpen(true);
          return;
        }
        const enrollmentsToSend = selectedRows.filter(
          (e) => e.motivationRating === 'DECLINE' && ['APPLIED', 'INVITED', 'REJECTED'].includes(e.status)
        );
        if (enrollmentsToSend.length > 0) {
          handleOpenRejectionDialog(enrollmentsToSend, selectedRows.length, enrollmentsToSend.length, 'selected');
        }
        return;
      } else if (action === 'send_rejections_all') {
        const enrollmentsToSend = courseEnrollments.filter(
          (e) => e.motivationRating === 'DECLINE' && ['APPLIED', 'INVITED', 'REJECTED'].includes(e.status)
        );
        if (enrollmentsToSend.length > 0) {
          handleOpenRejectionDialog(enrollmentsToSend, undefined, enrollmentsToSend.length, 'all');
        }
        return;
      }

      // Handle email actions (existing)
      if (action === 'email_selected') {
        targetEnrollments = selectedRows;
      } else if (action.startsWith('email_status_')) {
        const status = action.replace('email_status_', '') as CourseEnrollmentStatus_enum;
        targetEnrollments = courseEnrollments.filter((e) => e.status === status);
      } else if (action.startsWith('email_rating_')) {
        const rating = action.replace('email_rating_', '') as MotivationRating_enum;
        targetEnrollments = courseEnrollments.filter((e) => e.motivationRating === rating);
      }

      if (targetEnrollments.length === 0) {
        return;
      }

      const emails = targetEnrollments.map((e) => e.User.email).filter(Boolean).join(',');
      if (emails) {
        window.location.href = `mailto:?bcc=${emails}`;
      }
    },
    [courseEnrollments, handleOpenInviteDialog, handleOpenRejectionDialog, setIsNoSelectionDialogOpen]
  );

  const bulkActions: BulkAction[] = useMemo(() => {
    const actions: BulkAction[] = [
      { value: 'email_selected', label: t('bulk_actions.email_selected') },
    ];

    // Invitation actions - only for instructors
    if (isInstructor && courseEnrollments.some((e) => e.motivationRating === 'INVITE')) {
      actions.push({
        value: 'send_invitations_selected',
        label: t('bulk_actions.send_invitations_selected'),
        group: t('bulk_actions.send_invitations'),
      });
      actions.push({
        value: 'send_invitations_all',
        label: t('bulk_actions.send_invitations_all'),
        group: t('bulk_actions.send_invitations'),
      });
    }

    // Rejection actions - only for instructors
    if (isInstructor && courseEnrollments.some((e) => e.motivationRating === 'DECLINE')) {
      actions.push({
        value: 'send_rejections_selected',
        label: t('bulk_actions.send_rejections_selected'),
        group: t('bulk_actions.send_rejections'),
      });
      actions.push({
        value: 'send_rejections_all',
        label: t('bulk_actions.send_rejections_all'),
        group: t('bulk_actions.send_rejections'),
      });
    }

    // Email by status
    if (courseEnrollments.some((e) => e.status === 'CONFIRMED')) {
      actions.push({
        value: 'email_status_CONFIRMED',
        label: t('bulk_actions.email_all_confirmed'),
        group: t('bulk_actions.email_all_by_status'),
      });
    }
    if (courseEnrollments.some((e) => e.status === 'INVITED')) {
      actions.push({
        value: 'email_status_INVITED',
        label: t('bulk_actions.email_all_invited'),
        group: t('bulk_actions.email_all_by_status'),
      });
    }
    if (courseEnrollments.some((e) => e.status === 'APPLIED')) {
      actions.push({
        value: 'email_status_APPLIED',
        label: t('bulk_actions.email_all_applied'),
        group: t('bulk_actions.email_all_by_status'),
      });
    }
    if (courseEnrollments.some((e) => e.status === 'REJECTED')) {
      actions.push({
        value: 'email_status_REJECTED',
        label: t('bulk_actions.email_all_rejected'),
        group: t('bulk_actions.email_all_by_status'),
      });
    }

    // Email by rating
    if (courseEnrollments.some((e) => e.motivationRating === 'INVITE')) {
      actions.push({
        value: 'email_rating_INVITE',
        label: t('bulk_actions.email_all_invite_rating'),
        group: t('bulk_actions.email_all_by_rating'),
      });
    }
    if (courseEnrollments.some((e) => e.motivationRating === 'DECLINE')) {
      actions.push({
        value: 'email_rating_DECLINE',
        label: t('bulk_actions.email_all_decline_rating'),
        group: t('bulk_actions.email_all_by_rating'),
      });
    }
    if (courseEnrollments.some((e) => e.motivationRating === 'REVIEW')) {
      actions.push({
        value: 'email_rating_REVIEW',
        label: t('bulk_actions.email_all_review_rating'),
        group: t('bulk_actions.email_all_by_rating'),
      });
    }

    return actions;
  }, [courseEnrollments, t, isInstructor]);

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
    };
    return order[a] - order[b];
  }, []);

  // Columns definition
  const columns = useMemo<ColumnDef<ManagedCourse_Course_by_pk_CourseEnrollments>[]>(
    () => [
      {
        header: t('first_name'),
        accessorKey: 'User.firstName',
        size: 200,
        enableSorting: true,
        cell: ({ row }) => row.original.User.firstName,
      },
      {
        header: t('last_name'),
        accessorKey: 'User.lastName',
        size: 200,
        enableSorting: true,
        cell: ({ row }) => row.original.User.lastName,
      },
      {
        header: t('organization'),
        accessorKey: 'User.Organization.name',
        size: 300,
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
      {
        header: t('coursePage.evaluation'),
        accessorKey: 'motivationRating',
        size: 100,
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          return ratingSortFn(
            rowA.original.motivationRating,
            rowB.original.motivationRating
          );
        },
        cell: ({ row }) => {
          const rating = row.original.motivationRating;
          return (
            <div className="text-center">
              {rating === 'UNRATED' && <Dot color="grey" />}
              {rating === 'INVITE' && <Dot color="lightgreen" />}
              {rating === 'REVIEW' && <Dot color="orange" />}
              {rating === 'DECLINE' && <Dot color="red" />}
            </div>
          );
        },
      },
      {
        header: t('status'),
        accessorKey: 'status',
        size: 100,
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          return statusSortFn(rowA.original.status, rowB.original.status);
        },
        cell: ({ row }) => {
          const enrollment = row.original;
          const expired = isExpired(enrollment);
          return (
            <div className="text-center">
              {!expired && enrollment.status === 'APPLIED' && (
                <GoDotFill className="inline" title={t('coursePage.applied')} color="grey" size="2.5em" />
              )}
              {!expired && enrollment.status === 'INVITED' && (
                <IoIosCheckmarkCircle className="inline" title={t('coursePage.invited')} color="grey" size="1.5em" />
              )}
              {(enrollment.status === 'CONFIRMED' || enrollment.status === 'COMPLETED') && (
                <IoIosCheckmarkCircle
                  className="inline"
                  title={t('coursePage.invitation-confirmed')}
                  color="lightgreen"
                  size="1.5em"
                />
              )}
              {enrollment.status === 'ABORTED' && (
                <IoIosCheckmarkCircle title={t('coursePage.aborted')} color="red" size="1.5em" className="inline" />
              )}
              {enrollment.status === 'REJECTED' && (
                <IoIosCloseCircle title={t('coursePage.rejected')} color="red" size="1.5em" className="inline" />
              )}
              {enrollment.status === 'CANCELLED' && (
                <IoIosCloseCircle title={t('coursePage.cancelled')} color="red" size="1.5em" className="inline" />
              )}
              {expired && (enrollment.status === 'APPLIED' || enrollment.status === 'INVITED') && (
                <IoIosCloseCircle
                  className="inline"
                  title={t('coursePage.invitation-expired')}
                  color="grey"
                  size="1.5em"
                />
              )}
            </div>
          );
        },
        meta: {
          className: 'ml-auto',
        },
      },
    ],
    [t, ratingSortFn, statusSortFn]
  );

  // Expandable row component
  const ExpandableApplicationRow = ({ row: enrollment }: { row: ManagedCourse_Course_by_pk_CourseEnrollments }) => {
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

    return (
      <div className="pt-5 pb-5">
        <div className="flex items-start gap-3 pl-3">
          {/* Email and Application History - aligned with firstName/lastName columns (400px total) */}
          <div style={{ width: '400px', flexShrink: 0 }}>
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-1">{t('email')}</div>
              <div className="text-gray-900 break-words font-medium pl-4" title={enrollment.User.email}>
                {enrollment.User.email}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">{t('application_history')}</div>
              <div className="space-y-1">
                {enrollment.User.CourseEnrollments.length > 0 && enrollment.User.CourseEnrollments.filter(e => e.courseId !== enrollment.courseId).length === 0 ? (
                  <div className="text-sm text-gray-500 italic pl-4">{t('coursePage.no-applications-present')}</div>
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
                        {orgName ? ` - ${orgName}` : ''} - {t(pastEnrollment.status)}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Motivation Letter - calculated width to fit remaining space */}
          {/* Total available: 960px (mainRowContentWidth), minus: 400px (email) + 100px (rating) + 24px (2 gaps) + 12px (padding) = 424px */}
          <div style={{ width: '424px', flexShrink: 0 }}>
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-1">{t('coursePage.application')}</div>
              <div className="text-gray-900 whitespace-pre-wrap break-words pl-4">{enrollment.motivationLetter || '-'}</div>
            </div>
          </div>

          {/* Rating Controls - aligned with motivationRating column (100px) */}
          <div style={{ width: '100px', flexShrink: 0 }}>
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                {t('coursePage.evaluation')}
                <Tooltip title={t('application_status_tooltip')} placement="top">
                  <HelpOutline style={{ cursor: 'pointer', color: theme.palette.text.disabled }} />
                </Tooltip>
              </div>
              <div className="flex gap-2 pl-4">
                <button
                  onClick={setUnrated}
                  className="cursor-pointer hover:opacity-80 hover:scale-110 transition-all duration-200 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  title={t('coursePage.not-rated')}
                  aria-label={t('coursePage.not-rated')}
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
                  title={t('coursePage.invite')}
                  aria-label={t('coursePage.invite')}
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
                  title={t('coursePage.unclear')}
                  aria-label={t('coursePage.unclear')}
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
                  title={t('coursePage.reject')}
                  aria-label={t('coursePage.reject')}
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
                  {t('coursePage.invitation-deadline')}
                  <Tooltip title={t('application_deadline_tooltip')} placement="top">
                    <HelpOutline style={{ cursor: 'pointer', color: theme.palette.text.disabled }} />
                  </Tooltip>
                </div>
                <div className="text-gray-900 font-medium pl-4">{displayDate(enrollment.invitationExpirationDate)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0);
  }, []);

  return (
    <>
      {/* Add Participants Modal - accessible to all, but button only shown to admins */}
      <Modal
        isOpen={isAddParticipantsModalOpen}
        onClose={closeAddParticipantsModal}
        title={t('manageCourse.add_participants')}
      >
        <AddParticipantsForm courseId={course.id} onSubmit={closeAddParticipantsModal} />
      </Modal>

      {/* Statistics Cards */}
      {courseEnrollments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-edu-light-gray p-4 rounded-lg">
            <div className="text-gray-600 text-sm mb-1">{t('statistics_applications_total')}</div>
            <div className="text-gray-900 text-2xl font-semibold">{applicationStats.totalApplications}</div>
          </div>
          <div className="bg-edu-light-gray p-4 rounded-lg">
            <div className="text-gray-600 text-sm mb-1">{t('statistics_applications_accepted')}</div>
            <div className="text-gray-900 text-2xl font-semibold">{applicationStats.approvedApplications}</div>
          </div>
          <div className="bg-edu-light-gray p-4 rounded-lg">
            <div className="text-gray-600 text-sm mb-1">{t('statistics_invitations_total')}</div>
            <div className="text-gray-900 text-2xl font-semibold">{applicationStats.invitedApplicants}</div>
          </div>
          <div className="bg-edu-light-gray p-4 rounded-lg">
            <div className="text-gray-600 text-sm mb-1">{t('statistics_invitations_confirmed')}</div>
            <div className="text-gray-900 text-2xl font-semibold">{applicationStats.confirmedApplicants}</div>
          </div>
        </div>
      )}

      <div>
        {courseEnrollments.length > 0 ? (
          <>
            <OnlyInstructor>
              <TableGrid<ManagedCourse_Course_by_pk_CourseEnrollments>
                columns={columns}
                data={filteredEnrollments}
                loading={false}
                error={null as ApolloError}
                expandableRowComponent={ExpandableApplicationRow}
                bulkActions={bulkActions}
                onBulkAction={handleBulkEmailAction}
                enablePagination={true}
                totalCount={filteredEnrollments.length}
                pageIndex={pageIndex}
                onPageChange={setPageIndex}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                searchFilter={searchFilter}
                onSearchFilterChange={setSearchFilter}
                refetchQueries={[]}
                {...(isAdmin && {
                  addButtonText: t('add_participants'),
                  onAddButtonClick: openAddParticipantsModal,
                })}
              />
            </OnlyInstructor>

            <div className="-mt-8 mb-3">{infoDots}</div>
          </>
        ) : (
          <p className="m-auto text-center mb-14 text-gray-400">{t('coursePage.no-applications-present')}</p>
        )}
      </div>

      {/* Invitation Dialog */}
      <Dialog open={isInviteDialogOpen} onClose={handleCloseInviteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold">{t('bulk_actions.send_invitations_dialog_title')}</div>
            <div className="cursor-pointer" onClick={handleCloseInviteDialog}>
              <MdClose className="w-6 h-6" />
            </div>
          </div>
        </DialogTitle>
        <div className="px-6 pb-6">
          {inviteDialogData && (
            <>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
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
                  <label className="text-sm font-medium text-gray-700">
                    {t('coursePage.invitation-deadline')}
                  </label>
                  <DatePicker
                    dateFormat={locale === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'}
                    selected={inviteExpireDate}
                    onChange={handleSetInviteExpireDate}
                    minDate={new Date()}
                    locale={locale}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <OldButton onClick={handleCloseInviteDialog} inverted>
                  {t('common.cancel')}
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
      <Dialog open={isRejectionDialogOpen} onClose={handleCloseRejectionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold">{t('bulk_actions.send_rejections_dialog_title')}</div>
            <div className="cursor-pointer" onClick={handleCloseRejectionDialog}>
              <MdClose className="w-6 h-6" />
            </div>
          </div>
        </DialogTitle>
        <div className="px-6 pb-6">
          {rejectionDialogData && (
            <>
              <div className="mb-6">
                <p className="text-gray-700">
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
                  {t('common.cancel')}
                </OldButton>
                <OldButton onClick={handleSendRejections} filled>
                  {t('bulk_actions.send_rejections_confirm')}
                </OldButton>
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* No Selection Dialog */}
      <Dialog open={isNoSelectionDialogOpen} onClose={handleCloseNoSelectionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold">{t('bulk_actions.no_selection_dialog_title')}</div>
            <div className="cursor-pointer" onClick={handleCloseNoSelectionDialog}>
              <MdClose className="w-6 h-6" />
            </div>
          </div>
        </DialogTitle>
        <div className="px-6 pb-6">
          <div className="mb-6">
            <p className="text-gray-700">{t('select_applicants_first')}</p>
          </div>
          <div className="flex justify-end gap-3">
            <OldButton onClick={handleCloseNoSelectionDialog} filled>
              {t('common.confirm')}
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
    </>
  );
};
