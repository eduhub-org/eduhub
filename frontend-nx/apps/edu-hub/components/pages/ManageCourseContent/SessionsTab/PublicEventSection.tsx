import { FC, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';
import { MdOpenInNew, MdPublic } from 'react-icons/md';

import { useManageMutation } from '../../../../hooks/authedMutation';
import { useManageQuery } from '../../../../hooks/authedQuery';
import { useIsAdmin } from '../../../../hooks/authentication';
import { useOrgAdminCapabilities } from '../../../../hooks/orgAdminCapabilities';
import { useAppSettings } from '../../../../contexts/AppSettingsContext';
import { buildEventFromSession } from '../../../../helpers/publicSessionEvent';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../../../queries/programList';
import { CREATE_EVENT_FROM_SESSION } from '../../../../queries/publicSessionEvent';
import { Programs, Programs_Program, ProgramsVariables } from '../../../../queries/__generated__/Programs';
import {
  CreateEventFromSession,
  CreateEventFromSessionVariables,
} from '../../../../queries/__generated__/CreateEventFromSession';
import {
  ManagedCourse_Course_by_pk,
  ManagedCourse_Course_by_pk_Sessions,
} from '../../../../queries/__generated__/ManagedCourse';
import { ProgramType } from '../../../../types/enums';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import { SelectProgramDialog } from '../../ManageCoursesContent/SelectProgramDialog';

const OUTLINE_BUTTON =
  'inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-[1.5px] border-label-primary px-4 text-sm font-semibold text-label-primary hover:bg-bg-secondary disabled:border-border-primary disabled:text-label-disabled disabled:cursor-not-allowed disabled:hover:bg-transparent';

interface Props {
  course: ManagedCourse_Course_by_pk;
  session: ManagedCourse_Course_by_pk_Sessions;
}

/**
 * Opens a single course session to the public as an event. Creating it only
 * makes an unpublished draft and takes the admin to it, so the generated texts
 * can be reviewed and the event published from its own page.
 */
const PublicEventSection: FC<Props> = ({ course, session }) => {
  const t = useTranslations('manageCourse.SessionsTab.public_event');
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { canManageEvents } = useOrgAdminCapabilities();
  const { timeZone } = useAppSettings();
  // Hasura and the database still check that the admin may manage events of
  // this course's organization; this only decides whether to offer it.
  const canCreate = (isAdmin || canManageEvents) && course.Program?.type !== ProgramType.EVENTS;
  const event = session.PublicEvent;

  const organizationId = course.Program?.organizationId;
  const { data: programData, loading: programsLoading } = useManageQuery<Programs, ProgramsVariables>(
    PROGRAMS_WITH_MINIMUM_PROPERTIES,
    {
      variables: { where: { type: { _eq: ProgramType.EVENTS }, organizationId: { _eq: organizationId } } },
      skip: !canCreate || !!event || organizationId == null,
    }
  );
  const eventPrograms = useMemo(() => programData?.Program ?? [], [programData]);

  const [createEvent, { loading: creating }] = useManageMutation<CreateEventFromSession, CreateEventFromSessionVariables>(
    CREATE_EVENT_FROM_SESSION
  );
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const create = useCallback(
    async (program: Programs_Program) => {
      try {
        const { data } = await createEvent({
          variables: {
            event: buildEventFromSession(course, session, program.id, {
              tagline: t('prefill.tagline', { course: course.title }),
              aboutSessionHeading: t('prefill.about_session'),
              aboutCourseHeading: t('prefill.about_course', { course: course.title }),
            }, timeZone),
          },
        });
        const eventId = data?.insert_Course_one?.id;
        if (!eventId) throw new Error(t('create_failed'));
        await router.push(`/manage/course/${eventId}`);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('create_failed'));
      }
    },
    [createEvent, course, session, t, router, timeZone]
  );

  const handleCreateClick = useCallback(() => {
    if (eventPrograms.length === 1) {
      create(eventPrograms[0]);
    } else {
      setProgramDialogOpen(true);
    }
  }, [eventPrograms, create]);

  const handleProgramSelected = useCallback(
    (confirmed: boolean, program: Programs_Program | null) => {
      setProgramDialogOpen(false);
      if (confirmed && program) create(program);
    },
    [create]
  );

  if (!event && !canCreate) return null;

  return (
    <section className="border-t border-table-divider pt-4">
      <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-label-secondary">{t('label')}</h4>
      {event ? (
        <div className="flex flex-col gap-3">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <MdPublic aria-hidden className="text-label-secondary" />
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                event.published ? 'bg-brand/15 text-label-primary' : 'bg-bg-secondary text-label-secondary'
              }`}
            >
              {event.published ? t('status.published') : t('status.draft')}
            </span>
            <span className="text-label-secondary">
              {t('registrations', { count: Number(event.publicParticipantCount ?? 0) })}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/manage/course/${event.id}`} className={OUTLINE_BUTTON}>
              {t('open_event')}
            </Link>
            <Link href={`/course/${event.id}`} className={OUTLINE_BUTTON} target="_blank" rel="noopener noreferrer">
              <MdOpenInNew aria-hidden />
              {t('view_page')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-label-secondary">
            {!programsLoading && eventPrograms.length === 0 ? t('no_events_program') : t('description')}
          </p>
          <div>
            <button
              type="button"
              onClick={handleCreateClick}
              disabled={creating || programsLoading || eventPrograms.length === 0}
              className={OUTLINE_BUTTON}
            >
              <MdPublic aria-hidden />
              {creating ? t('creating') : t('create')}
            </button>
          </div>
        </div>
      )}

      <SelectProgramDialog
        open={programDialogOpen}
        programs={eventPrograms}
        onClose={handleProgramSelected}
        programType={ProgramType.EVENTS}
        texts={{
          title: t('program_dialog.title'),
          description: t('program_dialog.description'),
          button: t('program_dialog.button'),
        }}
      />
      {errorMessage && (
        <ErrorMessageDialog errorMessage={errorMessage} open={!!errorMessage} onClose={() => setErrorMessage(null)} />
      )}
    </section>
  );
};

export default PublicEventSection;
