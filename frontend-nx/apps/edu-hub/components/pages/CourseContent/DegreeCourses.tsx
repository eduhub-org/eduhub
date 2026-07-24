import { FC } from 'react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import MuiLink from '@mui/material/Link';
import { useUser } from '../../../../edu-hub/hooks/user';
import { COMPLETED_DEGREE_ENROLLMENTS } from '../../../queries/courseDegree';
import {
  CompletedDegreeEnrollments,
  CompletedDegreeEnrollmentsVariables,
} from '../../../queries/__generated__/CompletedDegreeEnrollments';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { Course_Course_by_pk_DegreeCourses } from '../../../queries/__generated__/Course';

const isPublished = (degreeCourse: Course_Course_by_pk_DegreeCourses) => degreeCourse?.Course?.published && degreeCourse?.Course?.Program?.published;

export const CurrentDegreeCourses: FC<{
  degreeCourses: Course_Course_by_pk_DegreeCourses[];
}> = ({ degreeCourses }) => {
  const t = useTranslations('course');
  const currentDegreeCourses = degreeCourses.filter(isPublished);

  return (
    <>
      <div className="flex flex-col">
        <span className="text-3xl font-semibold mb-4">{t('degree_elements.current_degree_elements')}</span>
        {currentDegreeCourses.length > 0 ? (
          <ul className="list-disc pb-12">
            {currentDegreeCourses.map((degreeCourse) => (
              <li className="dot-before" key={degreeCourse?.Course?.id}>
                <NextLink href={`/course/${degreeCourse?.Course?.id}`} passHref>
                  <MuiLink className="text-label-secondary">{degreeCourse?.Course?.title}</MuiLink>
                </NextLink>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t('degree_elements.no_degree_elements_available')}</p>
        )}
      </div>
    </>
  );
};

export const CompletedDegreeCourses: FC<{ degreeCourseId: number }> = ({ degreeCourseId }) => {
  const t = useTranslations('course');
  const user = useUser();
  const userId = user?.id ?? '';
  const { data } = useRoleQuery<CompletedDegreeEnrollments, CompletedDegreeEnrollmentsVariables>(
    COMPLETED_DEGREE_ENROLLMENTS,
    {
      variables: { degreeCourseId, userId },
    }
  );

  const completedDegreeEnrollments = data?.CourseEnrollment || [];

  // Get ECTS translations object to handle keys with dots/commas
  const ectsTranslations = t.raw('ects') as Record<string, string>;

  return (
    <div className="text-label-primary flex flex-col w-full">
      <div className="flex flex-col">
        <span className="text-3xl font-semibold mb-4">{t('degree_elements.completed_degree_elements')}</span>
        {completedDegreeEnrollments.length > 0 ? (
          <ul className="list-disc pb-12">
            {completedDegreeEnrollments.map((degreeEnrollment) => (
              <li key={degreeEnrollment?.Course?.id}>
                <NextLink href={`/course/${degreeEnrollment?.Course?.id}`} passHref>
                  <MuiLink className="text-label-secondary">
                    {degreeEnrollment?.Course?.title} -{' '}
                    {degreeEnrollment?.Course?.Program?.type !== 'EVENTS'
                      ? ` ${t(degreeEnrollment?.Course?.Program?.title)} (${ectsTranslations[degreeEnrollment?.Course?.ects] || degreeEnrollment?.Course?.ects} ECTS)`
                      : `${t(degreeEnrollment?.Course?.Program?.type)}`}
                  </MuiLink>
                </NextLink>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t('degree_elements.no_degree_elements_completed')}</p>
        )}
      </div>
    </div>
  );
};
