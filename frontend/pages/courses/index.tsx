import Head from 'next/head';
import { FC, useState } from 'react';
import AuthorizedCoursePage from '../../components/course/AuthorizedCoursePage';
import UnauthorizedCoursePage from '../../components/course/UnauthorizedCoursePage';
import CourseListContainer from '../../components/courses/CousrseListContainer';
import { Page } from '../../components/Page';
import { useAuthedQuery } from '../../hooks/authedQuery';
import { useIsLoggedIn } from '../../hooks/authentication';
import { COURSE_LIST } from '../../queries/courseList';
import { COURSE_LIST_WITH_ENROLLMENT } from '../../queries/courseListWithEnrollment';
import { CourseList } from '../../queries/__generated__/CourseList';
import { CourseListWithEnrollments } from '../../queries/__generated__/CourseListWithEnrollments';


const Courses: FC = () => {
    const router = useState();
    const isLoggedIn = useIsLoggedIn();
    const query = isLoggedIn ? COURSE_LIST_WITH_ENROLLMENT : COURSE_LIST;
    const { data: courses, loading, error } = useAuthedQuery<
    CourseList | CourseListWithEnrollments
  >(query);

    return (
        <div>
            <Head>
                <title>List of courses</title>
            </Head>
            <Page>
                {
                    <CourseListContainer courses={courses?.Course ?? []}></CourseListContainer>
                }
            </Page>
        </div>

    );
}

export default Courses;