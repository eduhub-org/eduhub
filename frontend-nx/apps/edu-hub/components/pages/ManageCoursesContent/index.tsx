/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FC, useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useManageMutation } from '../../../hooks/authedMutation';
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
import { isKnownCourseGroupOptionTitle } from '../../../helpers/courseGroupOptions';
import { DEGREE_COURSES } from '../../../queries/courseDegree';
import { DegreeCourses } from '../../../queries/__generated__/DegreeCourses';
import { DELETE_A_COURSE } from '../../../queries/mutateCourse';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import { useManageQuery } from '../../../hooks/authedQuery';
import { useManageRole } from '../../../hooks/authentication';
import { useManageCourseWhere } from '../../../hooks/manageScope';
import { ADMIN_COURSE_LIST } from '../../../queries/courseList';
import { GET_COURSE_TEMPLATES_COUNT } from '../../../queries/emailTemplates';
import ExpandableCourseRow from './ExpandableCourseRow';
import { useParallelQueries } from '../../../hooks/useParallelQueries';
import { CourseEnrollmentStatus_enum, order_by } from '../../../__generated__/globalTypes';
import { useTranslations, useLocale } from 'next-intl';
import { CourseStatus_enum, LocationOption_enum } from '../../../__generated__/globalTypes';
import InputField from '../../inputs/InputField';
import { UPDATE_COURSE_PROPERTY, INSERT_COURSE } from '../../../queries/mutateCourse';
import { UPDATE_COURSE_TITLE } from '../../../queries/course';
import { UpdateCourseByPk, UpdateCourseByPkVariables } from '../../../queries/__generated__/UpdateCourseByPk';
import {
  InsertCourseWithLocation,
  InsertCourseWithLocationVariables,
} from '../../../queries/__generated__/InsertCourseWithLocation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { SelectProgramDialog } from './SelectProgramDialog';
import { COPY_COURSES_TO_PROGRAM } from '../../../queries/copyCourse';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { MdMarkEmailRead } from 'react-icons/md';

// Header imports
import CommonPageHeader from '../../common/CommonPageHeader';
import { ProgramsMenubar } from '../../layout/ProgramsMenubar';
import type { StaticComponentProperty } from '../../../types/UIComponents';
import { ProgramType } from '../../../types/enums';

interface IProps {
  programs: Programs_Program[];
  /** Scopes the list (including the "All" tab) to a single Program.type. */
  programType: ProgramType;
}

const ManageCoursesContent: FC<IProps> = ({ programs, programType }) => {
  const t = useTranslations('manageCourses');
  const tCommon = useTranslations('common');
  const tCoursePage = useTranslations('coursePage');
  const locale = useLocale();

  // Management role (admin for super-admins, org_admin otherwise) and the organization scope that
  // restricts org admins to courses of programs in their own organizations (empty for super-admins).
  const manageRole = useManageRole();
  const orgCourseWhere = useManageCourseWhere();

  const programTypeWhere = useMemo(
    () => ({ Program: { type: { _eq: programType } } }),
    [programType]
  );

  const headline = useMemo(() => {
    switch (programType) {
      case ProgramType.EVENTS:
        return tCoursePage('eventsHeadline');
      case ProgramType.DEGREES:
        return tCoursePage('degreesHeadline');
      default:
        return tCoursePage('coursesHeadline');
    }
  }, [programType, tCoursePage]);

  // Calculate default program
  const sortedPrograms = useMemo(() => {
    return [...programs].sort((a, b) => {
      // Assign specific indices for 'EVENTS' and 'DEGREES'
      const indexA = a.shortTitle === 'EVENTS' ? -2 : a.shortTitle === 'DEGREES' ? -1 : programs.indexOf(a);
      const indexB = b.shortTitle === 'EVENTS' ? -2 : b.shortTitle === 'DEGREES' ? -1 : programs.indexOf(b);
      // Sort based on these indices
      return indexA - indexB;
    });
  }, [programs]);

  const defaultProgramId = useMemo(() => {
    if (sortedPrograms.length === 0) {
      return undefined;
    }
    const preferredRegularProgram = sortedPrograms.find(
      (program) => program.shortTitle !== 'EVENTS' && program.shortTitle !== 'DEGREES'
    );
    return (preferredRegularProgram ?? sortedPrograms[0]).id;
  }, [sortedPrograms]);

  // Filter state management (single source of truth)
  const [filter, setFilter] = useState<AdminCourseListVariables>({
    limit: 100,
    where: {
      ...programTypeWhere,
      programId: { _eq: defaultProgramId },
    },
    order_by: [{ id: order_by.desc }],
  });

  // Menubar configuration
  const allTabId = -1;
  const maxOtherPrograms = 6;

  // Create programs list for menubar: EVENTS + DEGREES + 6 most recent others + All
  const menubarPrograms: Programs_Program[] = useMemo(() => {
    const programs: Programs_Program[] = [];

    // First, add EVENTS and DEGREES if they exist (maintain their priority)
    const eventsProgram = sortedPrograms.find((p) => p.shortTitle === 'EVENTS');
    const degreesProgram = sortedPrograms.find((p) => p.shortTitle === 'DEGREES');

    if (eventsProgram) programs.push(eventsProgram);
    if (degreesProgram) programs.push(degreesProgram);

    // Then, get other programs (excluding EVENTS and DEGREES)
    const otherPrograms = sortedPrograms.filter((p) => p.shortTitle !== 'EVENTS' && p.shortTitle !== 'DEGREES');

    // Take the most recent other programs (they should already be sorted by recency)
    const recentOtherPrograms = otherPrograms.slice(0, maxOtherPrograms);
    programs.push(...recentOtherPrograms);

    // Add "All" option as a pseudo-program
    programs.push({
      id: allTabId,
      shortTitle: t('all_programs'),
      title: t('all_programs'),
      __typename: 'Program',
    } as Programs_Program);

    return programs;
  }, [sortedPrograms, allTabId, maxOtherPrograms, t]);

  // Derive current program ID from filter (single source of truth)
  const currentProgramId = filter.where?.programId?._eq ?? allTabId;

  // Efficient filter update function
  const updateFilter = useCallback((newState: AdminCourseListVariables) => {
    setFilter(newState);
  }, []);

  // Use TableGrid hook with proper refetchFilter for search debouncing
  const { data, loading, error, searchFilter, pageIndex, sorting, setSearchFilter, setPageIndex, setSorting } = useTableGrid({
    queryHook: useManageQuery,
    query: ADMIN_COURSE_LIST,
    queryVariables: filter,
    pageSize: filter.limit || QUERY_LIMIT, // Use actual page size for offset calculations
    debounceMs: 1000, // Increased debounce time for search
    sortColumnMapper: (columnId) => {
      // Map table column IDs to GraphQL field names
      switch (columnId) {
        case 'title':
          return 'title';
        case 'applications':
          // Return nested structure for aggregate field sorting
          return { CourseEnrollments_aggregate: { count: null } };
        case 'confirmed':
          // Note: This sorts by total enrollments, not filtered confirmed count
          // For filtered aggregate sorting, a computed field would be needed in Hasura
          return { CourseEnrollments_aggregate: { count: null } };
        case 'applicationEnd':
          return 'applicationEnd';
        default:
          return null;
      }
    },
    refetchFilter: useCallback(
      (searchTerm: string) => {
        // Return the complete queryVariables including search
        const searchCondition = createMultiWordSearchCondition(searchTerm, ['title']);
        const baseWhere = {
          ...filter.where, // Include current program filter
          ...searchCondition, // Add multi-word search filter
        };
        const hasOrgScope = Object.keys(orgCourseWhere).length > 0;
        // Org admins are additionally restricted to their own organizations' courses (covers the
        // "All" tab, where no program filter is applied).
        return {
          where: hasOrgScope ? { _and: [orgCourseWhere, baseWhere] } : baseWhere,
        };
      },
      [filter.where, orgCourseWhere] // Update when program filter or org scope changes
    ),
  });

  const courses: AdminCourseList_Course[] = useMemo(() => data?.Course || [], [data?.Course]);
  const totalCount = data?.Course_aggregate?.aggregate?.count || 0;

  // Fetch template counts for visible courses using parallel queries hook
  const courseIds = useMemo(() => courses.map((course) => course.id), [courses]);
  const getTemplateVariables = useCallback((courseId: number) => ({ courseId }), []);
  const extractTemplateCount = useCallback(
    (result: any) => result.data?.MailTemplate_aggregate?.aggregate?.count || 0,
    []
  );
  const courseTemplateCounts = useParallelQueries(
    GET_COURSE_TEMPLATES_COUNT,
    courseIds,
    getTemplateVariables,
    extractTemplateCount,
    manageRole
  );

  // Handle program tab clicks (moved after useTableGrid to access setPageIndex)
  const handleTabClick = useCallback(
    (property: StaticComponentProperty) => {
      // Update the base filter with the new program selection. Keep program-type scope so the
      // "All" tab never leaks courses of other types.
      updateFilter({
        ...filter,
        where:
          property.key === allTabId
            ? { ...programTypeWhere }
            : { ...programTypeWhere, programId: { _eq: property.key } },
      });
      // Reset pagination state when switching programs
      setPageIndex(0);
      // Keep search term when switching programs
    },
    [filter, updateFilter, allTabId, setPageIndex, programTypeWhere]
  );

  // Dialog state for program selection
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  const [coursesToCopy, setCoursesToCopy] = useState<AdminCourseList_Course[]>([]);

  // Notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [updateAttendanceCertificatePossible] = useManageMutation<
    UpdateCourseAttendanceCertificatePossible,
    UpdateCourseAttendanceCertificatePossibleVariables
  >(UPDATE_COURSE_ATTENDANCE_CERTIFICATE_POSSIBLE, {
    refetchQueries: ['AdminCourseList'],
  });

  const [updateAchievementCertificatePossible] = useManageMutation<
    UpdateCourseAchievementCertificatePossible,
    UpdateCourseAchievementCertificatePossibleVariables
  >(UPDATE_COURSE_ACHIEVEMENT_CERTIFICATE_POSSIBLE, {
    refetchQueries: ['AdminCourseList'],
  });

  const [updateCourse] = useManageMutation<UpdateCourseByPk, UpdateCourseByPkVariables>(UPDATE_COURSE_PROPERTY);

  const [insertCourse] = useManageMutation<InsertCourseWithLocation, InsertCourseWithLocationVariables>(INSERT_COURSE);

  const [copyCourses] = useManageMutation(COPY_COURSES_TO_PROGRAM);

  // Add course handler
  const handleAddCourse = useCallback(async () => {
    const selectedProgramId = filter.where.programId?._eq;
    const selectedProgram = sortedPrograms.find((program) => program.id === selectedProgramId);

    try {
      await insertCourse({
        variables: {
          title: t('default_course_title'),
          applicationEnd:
            selectedProgram?.defaultApplicationEnd && new Date(selectedProgram.defaultApplicationEnd) > new Date()
              ? selectedProgram.defaultApplicationEnd
              : new Date(),
          maxMissedSessions: 2,
          programId: selectedProgramId ?? 0,
          locationOption: LocationOption_enum.ONLINE,
        },
        refetchQueries: ['AdminCourseList'],
      });

      setSuccessMessage(t('notifications.course_added_success'));
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Error adding course:', error);
      setErrorMessage(t('notifications.course_add_failed'));
      setShowErrorNotification(true);
    }
  }, [filter.where.programId?._eq, sortedPrograms, insertCourse, t]);

  // Bulk action handlers
  const handleBulkAction = useCallback(
    async (action: string, selectedCourses: AdminCourseList_Course[]) => {
      const courseIds = selectedCourses.map((course) => course.id);

      try {
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
          setSuccessMessage(
            t(
              selectedCourses.length === 1
                ? 'notifications.courses_published_success_singular'
                : 'notifications.courses_published_success_plural',
              {
                count: selectedCourses.length,
              }
            )
          );
          setShowSuccessNotification(true);
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
          setSuccessMessage(
            t(
              selectedCourses.length === 1
                ? 'notifications.courses_unpublished_success_singular'
                : 'notifications.courses_unpublished_success_plural',
              {
                count: selectedCourses.length,
              }
            )
          );
          setShowSuccessNotification(true);
        } else if (action === 'copy') {
          // Open program selection dialog
          setCoursesToCopy(selectedCourses);
          setShowProgramDialog(true);
        }
      } catch (error) {
        console.error(`Error during bulk ${action} action:`, error);
        setErrorMessage(t('notifications.bulk_action_failed', { action }));
        setShowErrorNotification(true);
      }
    },
    [updateCourse, t]
  );

  const bulkActions = [
    { value: 'publish', label: t('bulk_action.publish') },
    { value: 'unpublish', label: t('bulk_action.unpublish') },
    { value: 'copy', label: t('bulk_action.copy') },
  ];

  const courseGroupOptions = useMemo(() => {
    if (data && !loading && !error) {
      return (
        data.CourseGroupOption
          // Program-type based groups (Courses, Events, Degrees) are assigned
          // automatically via the program type, so they must not be manually
          // selectable here.
          ?.filter((option: { programType: string | null }) => option.programType == null)
          .map((option: { id: number; title: string | null }) => ({
            id: option.id,
            name: isKnownCourseGroupOptionTitle(option.title)
              ? tCommon(`course_group_options.${option.title}`)
              : option.title ?? '—',
          })) || []
      );
    } else {
      return [];
    }
  }, [tCommon, data, loading, error]);

  const sliderCourseGroupIds = useMemo(() => {
    if (data && !loading && !error) {
      return (
        data.CourseGroupOption?.filter((option: { sliderGroup: boolean }) => option.sliderGroup).map(
          (option: { id: number }) => option.id
        ) || []
      );
    } else {
      return [];
    }
  }, [data, loading, error]);

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
      try {
        await updateAttendanceCertificatePossible({
          variables: {
            courseId: c.id,
            isPossible,
          },
        });
      } catch (error) {
        console.error('Error updating attendance certificate setting:', error);
        setErrorMessage(t('notifications.attendance_certificate_update_failed'));
        setShowErrorNotification(true);
      }
    },
    [updateAttendanceCertificatePossible, t]
  );

  const handleAchievementCertificatePossible = useCallback(
    async (c: AdminCourseList_Course, isPossible: boolean) => {
      try {
        await updateAchievementCertificatePossible({
          variables: {
            courseId: c.id,
            isPossible,
          },
        });
      } catch (error) {
        console.error('Error updating achievement certificate setting:', error);
        setErrorMessage(t('notifications.achievement_certificate_update_failed'));
        setShowErrorNotification(true);
      }
    },
    [updateAchievementCertificatePossible, t]
  );

  const handleApplicationEndChange = useCallback(
    (course: AdminCourseList_Course) => async (applicationEnd: Date | null) => {
      try {
        await updateCourse({
          variables: {
            id: course.id,
            changes: {
              applicationEnd: applicationEnd ? applicationEnd.toISOString().split('T')[0] : null,
            },
          },
          refetchQueries: ['AdminCourseList'],
        });
      } catch (error) {
        console.error('Error updating application end date:', error);
        setErrorMessage(t('notifications.application_end_update_failed'));
        setShowErrorNotification(true);
      }
    },
    [updateCourse, t]
  );

  const handleProgramDialogClose = useCallback(
    async (confirmed: boolean, targetProgram: Programs_Program | null) => {
      setShowProgramDialog(false);

      if (confirmed && targetProgram && coursesToCopy.length > 0) {
        try {
          // Prepare course data for copying
          const coursesToInsert = coursesToCopy.map((course) => {
            // Use target program's default application deadline if available, otherwise use current date
            const defaultApplicationEnd = targetProgram.defaultApplicationEnd
              ? targetProgram.defaultApplicationEnd
              : new Date().toISOString().split('T')[0];

            // Copy tile slider groups (CourseGroups)
            const courseGroups =
              course.CourseGroups?.map((cg) => ({
                groupOptionId: cg.groupOptionId,
              })) || [];

            // Copy degree relationships (CourseDegrees)
            const courseDegrees =
              course.CourseDegrees?.map((cd) => ({
                degreeCourseId: cd.degreeCourseId,
              })) || [];

            return {
              title: course.title,
              tagline: course.tagline || '',
              language: course.language || 'DE',
              applicationEnd: defaultApplicationEnd,
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
              // Copy tile slider groups
              CourseGroups: courseGroups.length > 0 ? { data: courseGroups } : undefined,
              // Copy degree relationships
              CourseDegrees: courseDegrees.length > 0 ? { data: courseDegrees } : undefined,
              // Note: We don't copy sessions, enrollments, or other related data
            };
          });

          await copyCourses({
            variables: {
              courses: coursesToInsert,
            },
            refetchQueries: ['AdminCourseList'],
          });

          setSuccessMessage(
            t(
              coursesToCopy.length === 1
                ? 'notifications.courses_copied_success_singular'
                : 'notifications.courses_copied_success_plural',
              {
                count: coursesToCopy.length,
                programTitle: targetProgram.title,
              }
            )
          );
          setShowSuccessNotification(true);
        } catch (error) {
          console.error('Error copying courses:', error);
        }
      }

      setCoursesToCopy([]);
    },
    [coursesToCopy, copyCourses, t]
  );

  const courseStatus = (status: string) => {
    switch (status) {
      case CourseStatus_enum.DRAFT:
        return (
          <span title="draft">
            <img src="/images/course/status/draft.svg" alt="draft" />
          </span>
        );
      case CourseStatus_enum.READY_FOR_PUBLICATION:
        return (
          <span title="ready for publication">
            <img src="/images/course/status/ready-for-publication.svg" alt="ready for publication" />
          </span>
        );
      case CourseStatus_enum.READY_FOR_APPLICATION:
        return (
          <span title="ready for application">
            <img src="/images/course/status/ready-for-application.svg" alt="ready for application" />
          </span>
        );
      case CourseStatus_enum.APPLICANTS_INVITED:
        return (
          <span title="applicants invited">
            <img src="/images/course/status/applicants-invited.svg" alt="applicants invited" />
          </span>
        );
      case CourseStatus_enum.PARTICIPANTS_RATED:
        return (
          <span title="participants rated">
            <img src="/images/course/status/participants-rated.svg" alt="participants rated" />
          </span>
        );
      default:
        return (
          <span title="default">
            <img src="/images/course/status/draft.svg" alt="default" />
          </span>
        );
    }
  };

  const getStatusCounts = useCallback((course: AdminCourseList_Course) => {
    const statusRecordsWithSum: { [key: string]: number } = {};
    course.CourseEnrollments.forEach((courseEn) => {
      statusRecordsWithSum[courseEn.CourseEnrollmentStatus.value] = statusRecordsWithSum[
        courseEn.CourseEnrollmentStatus.value
      ]
        ? statusRecordsWithSum[courseEn.CourseEnrollmentStatus.value] + 1
        : 1;
    });
    return statusRecordsWithSum;
  }, []);

  const getApplicationsCount = useCallback(
    (course: AdminCourseList_Course) => {
      const statusCounts = getStatusCounts(course);
      return Object.keys(statusCounts).reduce((sum, key) => sum + statusCounts[key], 0);
    },
    [getStatusCounts]
  );

  const getConfirmedCount = useCallback(
    (course: AdminCourseList_Course) => {
      const statusCounts = getStatusCounts(course);
      return statusCounts[CourseEnrollmentStatus_enum.CONFIRMED] ?? 0;
    },
    [getStatusCounts]
  );

  const getUnratedAndRatedButNotInformed = useCallback(
    (course: AdminCourseList_Course) => {
      const statusCounts = getStatusCounts(course);
      const unrated = statusCounts[CourseEnrollmentStatus_enum.APPLIED] ?? 0;
      const ratedButNotInformed = statusCounts[CourseEnrollmentStatus_enum.COMPLETED] ?? 0;
      return `${unrated} / ${ratedButNotInformed}`;
    },
    [getStatusCounts]
  );

  const columns = useMemo<ColumnDef<AdminCourseList_Course>[]>(
    () => [
      {
        header: t('table_header.published'),
        accessorKey: 'published',
        size: 70,
        meta: { className: 'text-center' },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <div
              className={`w-3 h-3 rounded-full ${row.original.published ? 'bg-green-500' : 'bg-red-500'}`}
              title={row.original.published ? t('table_header.published') : t('not_published')}
            />
          </div>
        ),
      },
      {
        header: t('table_header.title'),
        accessorKey: 'title',
        size: 320,
        minSize: 250,
        enableSorting: true,
        cell: ({ row }) => {
          const defaultTitle = t('default_course_title');

          return (
            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 pr-3">
              <div className="min-w-0">
                <InputField
                  variant="material"
                  type="input"
                  placeholder={defaultTitle}
                  itemId={row.original.id}
                  value={row.original.title || ''}
                  updateValueMutation={UPDATE_COURSE_TITLE}
                  refetchQueries={['AdminCourseList']}
                />
              </div>
              <a
                href={`course/${row.original.id}`}
                className="shrink-0 whitespace-nowrap text-sm font-medium text-blue-600 underline hover:text-blue-800"
                title={t('view_course')}
              >
                {t('view')}
              </a>
            </div>
          );
        },
      },
      {
        header: t('table_header.applications'),
        accessorKey: 'applications',
        size: 130,
        enableSorting: true,
        meta: { className: 'justify-center' },
        cell: ({ row }) => <div className="text-center w-full">{getApplicationsCount(row.original)}</div>,
      },
      {
        header: t('table_header.confirmed'),
        accessorKey: 'confirmed',
        size: 120,
        enableSorting: true,
        meta: { className: 'justify-center' },
        cell: ({ row }) => <div className="text-center w-full">{getConfirmedCount(row.original)}</div>,
      },
      {
        header: t('table_header.unrated_rated_not_informed'),
        accessorKey: 'unratedRatedNotInformed',
        size: 140,
        meta: { className: 'justify-center' },
        cell: ({ row }) => <div className="text-center w-full">{getUnratedAndRatedButNotInformed(row.original)}</div>,
      },
      {
        header: t('table_header.application_end'),
        accessorKey: 'applicationEnd',
        size: 110,
        enableSorting: true,
        meta: { className: 'text-center' },
        cell: ({ row }) => {
          const endDate = row.original.applicationEnd ? new Date(row.original.applicationEnd) : null;
          return (
            <div className="text-center">
              {/* @ts-ignore: https://github.com/Hacker0x01/react-datepicker/issues/3784 */}
              <DatePicker
                className="w-full text-center bg-transparent text-sm p-1 rounded"
                dateFormat={locale === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'}
                selected={endDate}
                onChange={handleApplicationEndChange(row.original)}
                locale={locale}
                placeholderText="-"
              />
            </div>
          );
        },
      },
      {
        header: t('table_header.status'),
        accessorKey: 'status',
        size: 80,
        meta: { className: 'text-center' },
        cell: ({ row }) => {
          const templateCount = courseTemplateCounts.get(row.original.id) || 0;
          const hasCustomTemplates = templateCount > 0;

          return (
            <div className="flex items-center justify-center gap-1 w-full">
              <div className="text-center">{courseStatus(row.original.status)}</div>
              {hasCustomTemplates && (
                <MdMarkEmailRead
                  className="w-4 h-4 text-blue-600 ml-1"
                  title={t('table_header.has_custom_templates')}
                />
              )}
            </div>
          );
        },
      },
    ],
    [
      t,
      handleApplicationEndChange,
      locale,
      getApplicationsCount,
      getConfirmedCount,
      getUnratedAndRatedButNotInformed,
      courseTemplateCounts,
    ]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      // Update the filter with new page size (useTableGrid handles offset)
      updateFilter({
        ...filter,
        limit: newPageSize,
      });
      setPageIndex(0);
    },
    [filter, updateFilter, setPageIndex]
  );

  return (
    <>
      <CommonPageHeader headline={headline} />
      {/* Only show the program tab select when there is more than one program to switch between. */}
      {programs.length > 1 && (
        <div className="flex justify-start mb-5 text-white">
          <ProgramsMenubar
            programs={menubarPrograms}
            defaultProgramId={defaultProgramId ?? 0}
            currentSelectedId={currentProgramId}
            onTabClicked={handleTabClick}
          />
        </div>
      )}

      {loading ? (
        <div className="pb-12 pt-16">
          <Loading />
        </div>
      ) : (
        <TableGrid<AdminCourseList_Course>
          columns={columns}
          data={courses}
          loading={loading}
          error={error}
          enablePagination={true}
          totalCount={totalCount}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={filter.limit ?? QUERY_LIMIT}
          onPageSizeChange={handlePageSizeChange}
          searchFilter={searchFilter}
          onSearchFilterChange={setSearchFilter}
          sorting={sorting}
          onSortingChange={setSorting}
          refetchQueries={['AdminCourseList']}
          bulkActions={bulkActions}
          onBulkAction={handleBulkAction}
          onAddButtonClick={handleAddCourse}
          addButtonText={t('add_course_button')}
          expandableRowComponent={(props) => (
            <ExpandableCourseRow
              course={props.row}
              courseGroupOptions={courseGroupOptions}
              sliderCourseGroupIds={sliderCourseGroupIds}
              degreeCourses={degreeCourses}
              onSetAttendanceCertificatePossible={handleAttendanceCertificatePossible}
              onSetAchievementCertificatePossible={handleAchievementCertificatePossible}
            />
          )}
          deleteMutation={DELETE_A_COURSE}
          deleteIdType="number"
          role={manageRole}
          generateDeletionConfirmationQuestion={(row) =>
            t('delete_button.delete_course_confirmation', {
              title: row.title || t('delete_button.untitled_course'),
            })
          }
        />
      )}

      <SelectProgramDialog
        open={showProgramDialog}
        programs={sortedPrograms}
        onClose={handleProgramDialogClose}
        title={t('copy_courses_to_program_dialog.title')}
      />

      <NotificationSnackbar
        open={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        message={successMessage}
        duration={4000}
      />

      <NotificationSnackbar
        open={showErrorNotification}
        onClose={() => setShowErrorNotification(false)}
        message={errorMessage}
        duration={6000}
      />
    </>
  );
};

export default ManageCoursesContent;
