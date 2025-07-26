/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FC, useCallback, useMemo, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { useRoleQuery } from '../../../hooks/authedQuery';

import { QUERY_LIMIT } from '../../../pages/manage/courses';
import { AdminCourseListVariables, AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';
import { Programs_Program } from '../../../queries/__generated__/Programs';
import {
  UPDATE_COURSE_ACHIEVEMENT_CERTIFICATE_POSSIBLE,
  UPDATE_COURSE_ATTENDANCE_CERTIFICATE_POSSIBLE,
} from '../../../queries/course';
import {
  UpdateCourseAttendanceCertificatePossible,
  UpdateCourseAttendanceCertificatePossibleVariables,
} from '../../../queries/__generated__/UpdateCourseAttendanceCertificatePossible';
import {
  UpdateCourseAchievementCertificatePossible,
  UpdateCourseAchievementCertificatePossibleVariables,
} from '../../../queries/__generated__/UpdateCourseAchievementCertificatePossible';
import { DEGREE_COURSES } from '../../../queries/courseDegree';
import { DegreeCourses } from '../../../queries/__generated__/DegreeCourses';
import { DELETE_A_COURSE } from '../../../queries/mutateCourse';

import { Translate } from 'next-translate';
import TableGrid from '../../common/TableGrid';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { ADMIN_COURSE_LIST } from '../../../queries/courseList';
import ExpandableCourseRow from './ExpandableCourseRow';
import { CourseEnrollmentStatus_enum } from '../../../__generated__/globalTypes';
import useTranslation from 'next-translate/useTranslation';
import draftPie from '../../../public/images/course/status/draft.svg';
import readyForPublicationPie from '../../../public/images/course/status/ready-for-publication.svg';
import readyForApplicationPie from '../../../public/images/course/status/ready-for-application.svg';
import applicantsInvitedPie from '../../../public/images/course/status/applicants-invited.svg';
import participantsRatedPie from '../../../public/images/course/status/participants-rated.svg';
import { CourseStatus_enum } from '../../../__generated__/globalTypes';
import { useRouter } from 'next/router';
import InputField from '../../inputs/InputField';
import { UPDATE_COURSE_PROPERTY } from '../../../queries/mutateCourse';
import { UpdateCourseByPk, UpdateCourseByPkVariables } from '../../../queries/__generated__/UpdateCourseByPk';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { SelectProgramDialog } from './SelectProgramDialog';
import { COPY_COURSES_TO_PROGRAM } from '../../../queries/copyCourse';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';

interface IProps {
  t: Translate;
  programs: Programs_Program[];
  updateFilter: (newState: AdminCourseListVariables) => void;
  currentFilter: AdminCourseListVariables;
}

const ManageCoursesContent: FC<IProps> = ({ programs, t, updateFilter, currentFilter }) => {
  const { t: translate, lang } = useTranslation('course-page');
  const router = useRouter();

  // Dialog state for program selection
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  const [coursesToCopy, setCoursesToCopy] = useState<AdminCourseList_Course[]>([]);

  // Notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Use TableGrid hook for data management
  const { data, loading, error, searchFilter, pageIndex, setSearchFilter, setPageIndex } = useTableGrid({
    queryHook: useAdminQuery,
    query: ADMIN_COURSE_LIST,
    queryVariables: currentFilter,
    pageSize: QUERY_LIMIT,
    refetchFilter: (searchFilter) => ({
      where: {
        ...currentFilter.where,
        ...(searchFilter ? { title: { _ilike: `%${searchFilter}%` } } : {}),
      },
    }),
  });

  const courses: AdminCourseList_Course[] = data?.Course || [];
  const totalCount = data?.Course_aggregate?.aggregate?.count || 0;

  const [updateAttendanceCertificatePossible] = useAdminMutation<
    UpdateCourseAttendanceCertificatePossible,
    UpdateCourseAttendanceCertificatePossibleVariables
  >(UPDATE_COURSE_ATTENDANCE_CERTIFICATE_POSSIBLE);

  const [updateAchievementCertificatePossible] = useAdminMutation<
    UpdateCourseAchievementCertificatePossible,
    UpdateCourseAchievementCertificatePossibleVariables
  >(UPDATE_COURSE_ACHIEVEMENT_CERTIFICATE_POSSIBLE);

  const [updateCourse] = useAdminMutation<UpdateCourseByPk, UpdateCourseByPkVariables>(UPDATE_COURSE_PROPERTY);

  const [copyCourses] = useAdminMutation(COPY_COURSES_TO_PROGRAM);

  // Bulk action handlers
  const handleBulkAction = useCallback(
    async (action: string, selectedCourses: AdminCourseList_Course[]) => {
      const courseIds = selectedCourses.map((course) => course.id);

      if (action === 'publish') {
        // Update all selected courses to published
        await Promise.all(
          courseIds.map((id) =>
            updateCourse({
              variables: {
                id,
                changes: { published: true },
              },
            })
          )
        );
      } else if (action === 'unpublish') {
        // Update all selected courses to unpublished
        await Promise.all(
          courseIds.map((id) =>
            updateCourse({
              variables: {
                id,
                changes: { published: false },
              },
            })
          )
        );
      } else if (action === 'copy') {
        // Open program selection dialog
        setCoursesToCopy(selectedCourses);
        setShowProgramDialog(true);
      }
    },
    [updateCourse]
  );

  const bulkActions = [
    { value: 'publish', label: translate('course-page:bulk_action_publish') },
    { value: 'unpublish', label: translate('course-page:bulk_action_unpublish') },
    { value: 'copy', label: translate('course-page:bulk_action_copy') },
  ];

  const courseGroupOptions = useMemo(() => {
    if (data && !loading && !error) {
      return (
        data.CourseGroupOption?.map((option) => ({
          id: option.id,
          name: t(option.title),
        })) || []
      );
    } else {
      return [];
    }
  }, [t, data, loading, error]);

  const degreeCoursesQuery = useRoleQuery<DegreeCourses>(DEGREE_COURSES);
  const degreeCourses = useMemo(() => {
    if (degreeCoursesQuery.data && !degreeCoursesQuery.loading && !degreeCoursesQuery.error) {
      return degreeCoursesQuery.data.Course.map((course) => ({
        id: course.id,
        name: course.title,
      }));
    } else {
      return [];
    }
  }, [degreeCoursesQuery.data, degreeCoursesQuery.loading, degreeCoursesQuery.error]);

  const handleAttendanceCertificatePossible = useCallback(
    async (c: AdminCourseList_Course, isPossible: boolean) => {
      await updateAttendanceCertificatePossible({
        variables: {
          courseId: c.id,
          isPossible,
        },
      });
    },
    [updateAttendanceCertificatePossible]
  );

  const handleAchievementCertificatePossible = useCallback(
    async (c: AdminCourseList_Course, isPossible: boolean) => {
      await updateAchievementCertificatePossible({
        variables: {
          courseId: c.id,
          isPossible,
        },
      });
    },
    [updateAchievementCertificatePossible]
  );

  const handleApplicationEndChange = useCallback(
    (course: AdminCourseList_Course) => async (applicationEnd: Date | null) => {
      await updateCourse({
        variables: {
          id: course.id,
          changes: {
            applicationEnd: applicationEnd ? applicationEnd.toISOString().split('T')[0] : null,
          },
        },
      });
    },
    [updateCourse]
  );

  const handleProgramDialogClose = useCallback(
    async (confirmed: boolean, targetProgram: Programs_Program | null) => {
      setShowProgramDialog(false);

      if (confirmed && targetProgram && coursesToCopy.length > 0) {
        try {
          // Prepare course data for copying
          const coursesToInsert = coursesToCopy.map((course) => ({
            title: `${course.title} (Copy)`,
            tagline: course.tagline || '',
            language: course.language || 'DE',
            applicationEnd: course.applicationEnd || new Date().toISOString().split('T')[0], // Required field
            cost: course.cost,
            ects: course.ects,
            maxMissedSessions: course.maxMissedSessions || 0,
            maxParticipants: course.maxParticipants,
            learningGoals: course.learningGoals,
            headingDescriptionField1: course.headingDescriptionField1,
            contentDescriptionField1: course.contentDescriptionField1,
            headingDescriptionField2: course.headingDescriptionField2,
            contentDescriptionField2: course.contentDescriptionField2,
            achievementCertificatePossible: course.achievementCertificatePossible,
            attendanceCertificatePossible: course.attendanceCertificatePossible,
            weekDay: course.weekDay || 'NONE',
            startTime: course.startTime,
            endTime: course.endTime,
            registrationType: course.registrationType,
            externalRegistrationLink: course.externalRegistrationLink,
            programId: targetProgram.id,
            published: false, // Always start as unpublished
            // Note: We don't copy sessions, enrollments, or other related data
          }));

          await copyCourses({
            variables: {
              courses: coursesToInsert,
            },
            refetchQueries: ['AdminCourseList'],
          });

          setSuccessMessage(`Successfully copied ${coursesToCopy.length} courses to ${targetProgram.title}`);
          setShowSuccessNotification(true);
        } catch (error) {
          console.error('Error copying courses:', error);
        }
      }

      setCoursesToCopy([]);
    },
    [coursesToCopy, copyCourses]
  );

  const courseStatus = (status: string) => {
    switch (status) {
      case CourseStatus_enum.DRAFT:
        return (
          <span title="draft">
            <img src={draftPie} alt="draft" />
          </span>
        );
      case CourseStatus_enum.READY_FOR_PUBLICATION:
        return (
          <span title="ready for publication">
            <img src={readyForPublicationPie} alt="ready for publication" />
          </span>
        );
      case CourseStatus_enum.READY_FOR_APPLICATION:
        return (
          <span title="ready for application">
            <img src={readyForApplicationPie} alt="ready for application" />
          </span>
        );
      case CourseStatus_enum.APPLICANTS_INVITED:
        return (
          <span title="applicants invited">
            <img src={applicantsInvitedPie} alt="applicants invited" />
          </span>
        );
      case CourseStatus_enum.PARTICIPANTS_RATED:
        return (
          <span title="participants rated">
            <img src={participantsRatedPie} alt="participants rated" />
          </span>
        );
      default:
        return (
          <span title="default">
            <img src={draftPie} alt="default" />
          </span>
        );
    }
  };

  const getStatusCounts = (course: AdminCourseList_Course) => {
    const statusRecordsWithSum: { [key: string]: number } = {};
    course.CourseEnrollments.forEach((courseEn) => {
      statusRecordsWithSum[courseEn.CourseEnrollmentStatus.value] = statusRecordsWithSum[
        courseEn.CourseEnrollmentStatus.value
      ]
        ? statusRecordsWithSum[courseEn.CourseEnrollmentStatus.value] + 1
        : 1;
    });
    return statusRecordsWithSum;
  };

  const getApplicationsCount = (course: AdminCourseList_Course) => {
    const statusCounts = getStatusCounts(course);
    return Object.keys(statusCounts).reduce((sum, key) => sum + statusCounts[key], 0);
  };

  const getConfirmedCount = (course: AdminCourseList_Course) => {
    const statusCounts = getStatusCounts(course);
    return statusCounts[CourseEnrollmentStatus_enum.CONFIRMED] ?? 0;
  };

  const getUnratedAndRatedButNotInformed = (course: AdminCourseList_Course) => {
    const statusCounts = getStatusCounts(course);
    const unrated = statusCounts[CourseEnrollmentStatus_enum.APPLIED] ?? 0;
    const ratedButNotInformed = statusCounts[CourseEnrollmentStatus_enum.COMPLETED] ?? 0;
    return `${unrated} / ${ratedButNotInformed}`;
  };

  const columns = useMemo<ColumnDef<AdminCourseList_Course>[]>(
    () => [
      {
        header: t('table-header-published'),
        accessorKey: 'published',
        size: 70,
        meta: { className: 'text-center' },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <div
              className={`w-3 h-3 rounded-full ${row.original.published ? 'bg-green-500' : 'bg-red-500'}`}
              title={row.original.published ? t('course-page:published') : t('course-page:not_published')}
            />
          </div>
        ),
      },
      {
        header: t('table-header-title'),
        accessorKey: 'title',
        size: 320,
        minSize: 250,
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <InputField
                variant="material"
                type="input"
                placeholder={translate('course-page:default-course-title')}
                itemId={row.original.id}
                value={row.original.title || ''}
                updateValueMutation={UPDATE_COURSE_PROPERTY}
                refetchQueries={['AdminCourseList']}
              />
            </div>
            <a
              href={`course/${row.original.id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium underline whitespace-nowrap"
              title={t('course-page:view_course')}
            >
              {t('course-page:view')}
            </a>
          </div>
        ),
      },
      {
        header: t('table-header-applications'),
        accessorKey: 'applications',
        size: 100,
        meta: { className: 'text-center' },
        cell: ({ row }) => <div className="text-center">{getApplicationsCount(row.original)}</div>,
      },
      {
        header: t('course-page:confirmed'),
        accessorKey: 'confirmed',
        size: 100,
        meta: { className: 'text-center' },
        cell: ({ row }) => <div className="text-center">{getConfirmedCount(row.original)}</div>,
      },
      {
        header: t('course-page:unrated_rated_not_informed'),
        accessorKey: 'unratedRatedNotInformed',
        size: 140,
        meta: { className: 'text-center' },
        cell: ({ row }) => <div className="text-center">{getUnratedAndRatedButNotInformed(row.original)}</div>,
      },
      {
        header: t('course-page:application-end'),
        accessorKey: 'applicationEnd',
        size: 110,
        meta: { className: 'text-center' },
        cell: ({ row }) => {
          const endDate = row.original.applicationEnd ? new Date(row.original.applicationEnd) : null;
          return (
            <div className="text-center">
              {/* @ts-ignore: https://github.com/Hacker0x01/react-datepicker/issues/3784 */}
              <DatePicker
                className="w-full text-center bg-transparent text-sm p-1 rounded"
                dateFormat={lang === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'}
                selected={endDate}
                onChange={handleApplicationEndChange(row.original)}
                locale={lang}
                placeholderText="-"
              />
            </div>
          );
        },
      },
      {
        header: t('table-header-status'),
        accessorKey: 'status',
        size: 80,
        meta: { className: 'text-center' },
        cell: ({ row }) => <div className="text-center">{courseStatus(row.original.status)}</div>,
      },
    ],
    [
      t,
      translate,
      handleApplicationEndChange,
      lang,
      getApplicationsCount,
      getConfirmedCount,
      getUnratedAndRatedButNotInformed,
    ]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      // Update the filter with new page size
      updateFilter({
        ...currentFilter,
        limit: newPageSize,
        offset: 0,
      });
      setPageIndex(0);
    },
    [currentFilter, updateFilter, setPageIndex]
  );

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <>
      <TableGrid<AdminCourseList_Course>
        columns={columns}
        data={courses}
        loading={loading}
        error={error}
        enablePagination={true}
        totalCount={totalCount}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        pageSize={QUERY_LIMIT}
        onPageSizeChange={handlePageSizeChange}
        searchFilter={searchFilter}
        onSearchFilterChange={setSearchFilter}
        refetchQueries={['AdminCourseList']}
        bulkActions={bulkActions}
        onBulkAction={handleBulkAction}
        expandableRowComponent={(props) => (
          <ExpandableCourseRow
            course={props.row}
            courseGroupOptions={courseGroupOptions}
            degreeCourses={degreeCourses}
            onSetAttendanceCertificatePossible={handleAttendanceCertificatePossible}
            onSetAchievementCertificatePossible={handleAchievementCertificatePossible}
          />
        )}
        deleteMutation={DELETE_A_COURSE}
        deleteIdType="number"
        generateDeletionConfirmationQuestion={(row) =>
          t('manageCourses:delete_button.delete_course_confirmation', {
            title: row.title || t('manageCourses:delete_button.untitled_course'),
          })
        }
      />

      <SelectProgramDialog
        open={showProgramDialog}
        programs={programs}
        onClose={handleProgramDialogClose}
        title={translate('course-page:copy_courses_to_program')}
      />

      <NotificationSnackbar
        open={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        message={successMessage}
        duration={4000}
      />
    </>
  );
};

export default ManageCoursesContent;
