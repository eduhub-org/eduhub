import { FC, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MdOpenInNew, MdPublic } from 'react-icons/md';

import { useDisplayDate } from '../../../helpers/dateTimeHelpers';
import { useManageMutation } from '../../../hooks/authedMutation';
import { useIsAdmin } from '../../../hooks/authentication';
import { useOrgAdminCapabilities } from '../../../hooks/orgAdminCapabilities';
import { UPDATE_COURSE_PROPERTY } from '../../../queries/mutateCourse';
import { ManagedCourse_Course_by_pk } from '../../../queries/__generated__/ManagedCourse';
import { UpdateCourseByPk, UpdateCourseByPkVariables } from '../../../queries/__generated__/UpdateCourseByPk';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';

const BUTTON =
  'inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-[1.5px] border-white px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50';

/**
 * Shown on an event that was created from a course session: where it comes
 * from, what is synced from there, and - while it is still a draft - the way to
 * review the public page and publish it.
 */
export const PublicEventNotice: FC<{ course: ManagedCourse_Course_by_pk }> = ({ course }) => {
  const t = useTranslations('manageCourse.public_event_notice');
  const displayDate = useDisplayDate();
  const isAdmin = useIsAdmin();
  const { canManageEvents } = useOrgAdminCapabilities();
  const [updateCourse, { loading }] = useManageMutation<UpdateCourseByPk, UpdateCourseByPkVariables>(
    UPDATE_COURSE_PROPERTY,
    { refetchQueries: ['ManagedCourse'], awaitRefetchQueries: true }
  );
  const [error, setError] = useState<string | null>(null);

  const source = course.SourceSession;
  if (course.sourceSessionId == null || !source) return null;

  const setPublished = async (published: boolean) => {
    try {
      await updateCourse({ variables: { id: course.id, changes: { published } } });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-xl border border-white/30 bg-white/5 p-4 text-white md:p-6">
      <p className="flex items-start gap-2">
        <MdPublic aria-hidden className="mt-1 shrink-0" />
        <span>
          {t('origin', {
            session: source.title || t('untitled_session'),
            date: displayDate(source.startDateTime),
            course: source.Course?.title ?? '',
          })}{' '}
          {t('synced')}
          {source.Course && (
            <>
              {' '}
              <Link href={`/manage/course/${source.Course.id}`} className="underline">
                {t('to_course')}
              </Link>
            </>
          )}
        </span>
      </p>
      <p className="text-sm text-white/80">{course.published ? t('published') : t('draft')}</p>
      <div className="flex flex-wrap gap-3">
        <Link href={`/course/${course.id}`} target="_blank" rel="noopener noreferrer" className={BUTTON}>
          <MdOpenInNew aria-hidden />
          {course.published ? t('view_page') : t('preview_page')}
        </Link>
        {(isAdmin || canManageEvents) && (
          <button type="button" className={BUTTON} disabled={loading} onClick={() => setPublished(!course.published)}>
            {course.published ? t('unpublish') : t('publish')}
          </button>
        )}
      </div>
      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={() => setError(null)} />}
    </div>
  );
};
