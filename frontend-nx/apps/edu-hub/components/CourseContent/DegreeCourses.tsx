import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import NextLink from 'next/link'; // Renamed to avoid naming collision
import MuiLink from '@material-ui/core/Link';
import {
    Course_Course_by_pk_DegreeCourses,
} from '../../queries/__generated__/Course';
import {
    CourseWithEnrollment_Course_by_pk_DegreeCourses,
} from '../../queries/__generated__/CourseWithEnrollment';

interface DegreeCoursesProps {
    degreeCourses: Course_Course_by_pk_DegreeCourses[] | CourseWithEnrollment_Course_by_pk_DegreeCourses[];
}

function isPublished(degreeCourse: Course_Course_by_pk_DegreeCourses | CourseWithEnrollment_Course_by_pk_DegreeCourses) {
  return degreeCourse.Course?.published && degreeCourse.Course?.Program?.published;
}

export const DegreeCourses: FC<DegreeCoursesProps> = ({ degreeCourses }) => {
    const { t } = useTranslation('course');

    const currentDegreeCourses = degreeCourses.filter(isPublished);

    return (
        <>
        {degreeCourses && degreeCourses.length > 0 && (
        <>
            <span className="text-3xl font-semibold mb-9">
                {t('degree_course_list_title')}
            </span>
            {currentDegreeCourses.length > 0 ? (
                <ul className="list-disc pb-12">
                    {currentDegreeCourses.map((degreeCourse) => (
                        <li key={degreeCourse.Course?.id}>
                            <NextLink href={`/course/${degreeCourse.Course?.id}`} passHref>
                                <MuiLink style={{ color: '#9CA3AF' }}>{degreeCourse.Course?.title}</MuiLink>
                            </NextLink>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>{t('no_degree_elements_available')}</p>
            )}
        </>
         )}
        </>
    );
};