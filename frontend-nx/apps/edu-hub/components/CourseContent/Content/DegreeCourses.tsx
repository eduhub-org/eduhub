import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import Link from 'next/link';
import {
    Course_Course_by_pk_DegreeCourses,
} from '../../../queries/__generated__/Course';
import {
    CourseWithEnrollment_Course_by_pk_DegreeCourses,
} from '../../../queries/__generated__/CourseWithEnrollment';

interface DegreeCoursesProps {
    degreeCourses: Course_Course_by_pk_DegreeCourses[] |CourseWithEnrollment_Course_by_pk_DegreeCourses[];
}

export const DegreeCourses: FC<DegreeCoursesProps> = ({ degreeCourses }) => {
    const { t } = useTranslation('course-page');

    return (
        <>
            <span className="text-3xl font-semibold mb-9">
                {t('degree_course_list_title')}
            </span>
            {degreeCourses && degreeCourses.length > 0 ? (
                <ul className="list-disc pb-12">
                    {degreeCourses.map((degreeCourse) => (
                        <li key={degreeCourse.Course?.id}>
                            <Link href={`/course/${degreeCourse.Course?.id}`}>
                                {degreeCourse.Course?.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>{t('no_degree_elements_available')}</p>
            )}
        </>
    );
};