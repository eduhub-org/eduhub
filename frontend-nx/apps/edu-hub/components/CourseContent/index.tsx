import { FC, useState, useEffect, Dispatch, SetStateAction } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { CircularProgress } from '@material-ui/core';

import InvitationModal from './InvitationModal';
import { useLazyRoleQuery } from '../../hooks/authedQuery';
import { useUserId } from '../../hooks/user';
import { CourseWithEnrollment } from '../../queries/__generated__/CourseWithEnrollment';
import { COURSE_WITH_ENROLLMENT } from '../../queries/courseWithEnrollment';
import { CourseEnrollmentStatus_enum } from '../../__generated__/globalTypes';
import { useIsLoggedIn } from '../../hooks/authentication';
import { COURSE } from '../../queries/course';
import { Course, CourseVariables } from '../../queries/__generated__/Course';
import { getCourseEnrollment } from '../../helpers/util';
import { ContentRow } from '../common/ContentRow';
import { PageBlock } from '../common/PageBlock';
import { DescriptionFields } from './DescriptionFields';
import { TimeLocationLanguageInstructors } from './TimeLocationLanguageInstructors';
import { ApplicationButtonOrStatusMessageOrLinks } from './ApplicationButtonOrStatusMessageOrLinks';
import { AttendancesAndAchievements } from './AttendancesAndAchievements';
import { useIsCourseWithEnrollment } from '../../hooks/course';
import { getWeekdayStartAndEndString } from '../../helpers/dateHelpers';
import { LearningGoals } from './LearningGoals';
import { Sessions } from './Sessions';
import { DegreeCourses } from './DegreeCourses';

// State and Effect Hooks
const CourseContent: FC<{ id: number }> = ({ id }) => {
    const { t } = useTranslation();
    const isLoggedIn = useIsLoggedIn();
    const userId = useUserId();
    const [modalOpen, setModalOpen] = useState(false);
    const [resetValues, setResetValues] = useState(null);

    const [
        getCoursesAuthorized,
        {
            data: authorizedCourseData,
            refetch: refetchCourse,
            loading: getCoursesAuthorizedLoading,
        },
    ] = useLazyRoleQuery<CourseWithEnrollment>(COURSE_WITH_ENROLLMENT, {
        variables: {
            id,
            userId,
        },
        async onCompleted(data) {
            const courseEnrollment = getCourseEnrollment(data?.Course_by_pk, userId);
            const enrollmentStatus = courseEnrollment?.status;
            if (
                enrollmentStatus === CourseEnrollmentStatus_enum.INVITED &&
                courseEnrollment?.invitationExpirationDate.setHours(0, 0, 0, 0) >=
                    new Date().setHours(0, 0, 0, 0)
            ) {
                setResetValues(true);
            }
        },
    });

    const [
        getCoursesUnauthorized,
        { data: unauthorizedCourseData, loading: getCoursesUnauthorizedLoading },
    ] = useLazyRoleQuery<Course, CourseVariables>(COURSE, {
        variables: {
            id,
        },
    });

    useEffect(() => {
        if (isLoggedIn) {
            getCoursesAuthorized();
        } else {
            getCoursesUnauthorized();
        }
    }, [isLoggedIn, getCoursesAuthorized, getCoursesUnauthorized]);

    const course =
        authorizedCourseData?.Course_by_pk || unauthorizedCourseData?.Course_by_pk;
    const isCourseWithEnrollment = useIsCourseWithEnrollment(course);
    const enrollmentId = getCourseEnrollment(
        authorizedCourseData?.Course_by_pk,
        userId
    )?.id;

    // Ensure course is defined before extracting its properties
    if (!course) {
        return (
            <div className="flex justify-center max-w-screen-xl mx-auto w-full pt-32">
                <div className="text-white">{t('course-page:courseNotAvailable')}</div>
            </div>
        );
    }
    const { title, coverImage } = course;
    const bgUrl = course?.coverImage ?? 'https://picsum.photos/1280/620';

    // Local Component Definitions
    const Tagline: FC<{ course: typeof course }> = ({ course }) => {
        const { t, lang } = useTranslation();
        return (
            <div className="flex flex-1 flex-col text-white mb-20">
                {course.weekDay !== 'NONE' ? (
                    <span className="text-xs">
                        {getWeekdayStartAndEndString(course, lang, t)}
                    </span>
                ) : null}
                <span className="text-2xl mt-2">{course.tagline}</span>
            </div>
        );
    };

    // Main Component Definition and Rendering
    if (!course) {
        return (
            <div className="flex justify-center max-w-screen-xl mx-auto w-full pt-32">
                <div className="text-white">{t('course-page:courseNotAvailable')}</div>
            </div>
        );
    }

    return (
        <div>
            {getCoursesAuthorizedLoading || getCoursesUnauthorizedLoading ? (
                <CircularProgress />
            ) : (
                <div className="flex flex-col space-y-24">
                    <div className="flex flex-col space-y-24">
                        <div
                            className="h-96 p-3 text-3xl text-white flex justify-start items-end bg-cover bg-center bg-no-repeat bg-[image:var(--bg-small-url)]"
                            style={{
                                '--bg-small-url': `linear-gradient(51.32deg, rgba(0, 0, 0, 0.7) 17.57%, rgba(0, 0, 0, 0) 85.36%), url(${bgUrl})`,
                            } as React.CSSProperties}
                        >
                            <div className="max-w-screen-xl mx-auto w-full">{title}</div>
                        </div>
                        <div className="max-w-screen-xl mx-auto w-full">
                            <PageBlock>
                                <ContentRow className="items-center">
                                    <Tagline course={course} />
                                    <ApplicationButtonOrStatusMessageOrLinks
                                        course={course}
                                        setInvitationModalOpen={setModalOpen}
                                    />
                                </ContentRow>
                            </PageBlock>
                            {isCourseWithEnrollment && (
                                <AttendancesAndAchievements course={course} />
                            )}
                            <ContentRow className="flex">
                                <PageBlock classname="flex-1 text-white space-y-6">
                                    <LearningGoals learningGoals={course.learningGoals} />
                                    <Sessions sessions={course.Sessions} />
                                    <DegreeCourses degreeCourses={course.DegreeCourses} />
                                </PageBlock>
                                <div className="pr-0 lg:pr-6 xl:pr-0">
                                    <TimeLocationLanguageInstructors course={course} />
                                </div>
                            </ContentRow>
                            <DescriptionFields course={course} />
                        </div>
                    </div>
                    {isLoggedIn && (
                        <InvitationModal
                            course={course}
                            enrollmentId={enrollmentId}
                            open={modalOpen}
                            resetValues={resetValues}
                            setModalOpen={setModalOpen}
                            refetchCourse={refetchCourse}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default CourseContent;
