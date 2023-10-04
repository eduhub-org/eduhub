import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import NextLink from 'next/link';
import MuiLink from '@material-ui/core/Link';
import { useUser } from '../../../edu-hub/hooks/user';
import { COMPLETED_DEGREE_ENROLLMENTS } from '../../queries/courseDegree';
import { CompletedDegreeEnrollments, CompletedDegreeEnrollmentsVariables } from '../../queries/__generated__/CompletedDegreeEnrollments';
import { useRoleQuery } from '../../hooks/authedQuery';
import { Course_Course_by_pk_DegreeCourses } from '../../queries/__generated__/Course';

const isPublished = (degreeCourse) => degreeCourse?.Course?.published && degreeCourse?.Course?.Program?.published;

export const CurrentDegreeCourses: FC<{ degreeCourses: Course_Course_by_pk_DegreeCourses[] }> = ({ degreeCourses }) => {
    const { t } = useTranslation('course');
    const currentDegreeCourses = degreeCourses.filter(isPublished);

    return currentDegreeCourses.length > 0 ? (
<>
  <span className="text-3xl font-semibold mb-4">{t('current_degree_elements')}</span>
  <ul className="list-disc pb-12">
    {currentDegreeCourses.map((degreeCourse) => (
      <li className="dot-before" key={degreeCourse?.Course?.id}>
        <NextLink href={`/course/${degreeCourse?.Course?.id}`} passHref>
          <MuiLink style={{ color: '#9CA3AF' }}>{degreeCourse?.Course?.title}</MuiLink>
        </NextLink>
      </li>
    ))}
  </ul>
</>
    ) : null;
};

export const CompletedDegreeCourses: FC<{ degreeCourseId: number }> = ({ degreeCourseId }) => {
    const { t } = useTranslation('course');
    const { id: userId } = useUser();
    const { data } = useRoleQuery<CompletedDegreeEnrollments, CompletedDegreeEnrollmentsVariables>(COMPLETED_DEGREE_ENROLLMENTS, {
        variables: { degreeCourseId, userId },
    });

    const completedDegreeEnrollments = data?.CourseEnrollment || [];

    return (
        <div className=" text-edu-black bg-white px-8 py-8">
            <span className="text-3xl font-semibold mb-4">{t('completed_degree_elements')}</span>
            {completedDegreeEnrollments.length > 0 ? (
                <ul className="list-disc pb-12">
                    {completedDegreeEnrollments.map((degreeEnrollment) => (
                        <li key={degreeEnrollment?.Course?.id}>
                            <NextLink href={`/course/${degreeEnrollment?.Course?.id}`} passHref>
                              <MuiLink style={{ color: '#9CA3AF' }}>
                              {degreeEnrollment?.Course?.title} - {degreeEnrollment?.Course?.Program?.shortTitle !== 'EVENTS' ? ` ${t(degreeEnrollment?.Course?.Program?.title)} (${t(degreeEnrollment?.Course?.ects)} ECTS)` : `${t(degreeEnrollment?.Course?.Program?.shortTitle)}`}
                              </MuiLink>
                            </NextLink>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>{t('no_degree_elements_completed')}</p>
            )}
        </div>
    );
};
