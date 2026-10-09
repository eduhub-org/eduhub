import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import { DatesSetArg, EventClickArg, EventContentArg, EventInput } from '@fullcalendar/core';

import { Page } from '../../layout/Page';
import CommonPageHeader from '../../common/CommonPageHeader';
import DropDownSelector from '../../inputs/DropDownSelector';
import { useIsAdmin } from '../../../hooks/authentication';
import { useLazyRoleQuery, useManageQuery } from '../../../hooks/authedQuery';
import { useManageProgramWhere } from '../../../hooks/manageScope';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { CALENDAR_SESSIONS } from '../../../queries/calendarSessions';
import { CalendarSessions, CalendarSessions_Session } from '../../../queries/__generated__/CalendarSessions';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../../queries/programList';
import { Programs } from '../../../queries/__generated__/Programs';
import { getLocationColor } from '../../../helpers/calendarColors';
import { generateICalString, downloadICalFile } from '../../../helpers/icalExport';

import CalendarFilters from './CalendarFilters';
import SessionDetailPopover from './SessionDetailPopover';
import {
  ALL_PROGRAMS,
  CalendarRange,
  SessionKind,
  buildSessionWhere,
  coursesOfSessions,
  filterSessions,
  isOutsideLecturePeriod,
  resolveAddress,
  resolveLocation,
  scopedProgramIds,
  sessionKind,
  sessionProgram,
} from './calendarSessions';

interface SessionDetail {
  id: number;
  title: string;
  courseTitle: string;
  programTitle?: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  location?: string;
  address?: string;
  speakers: { firstName: string; lastName: string }[];
}

const sessionHeadline = (session: CalendarSessions_Session) => session.Course?.title || session.title;
const sessionSubline = (session: CalendarSessions_Session) => (session.Course ? session.title : '');

const renderEventContent = (arg: EventContentArg) => {
  const { subline, address } = arg.event.extendedProps;
  return (
    <div className="eduhub-calendar-event">
      {arg.timeText && <span className="eduhub-calendar-event-time">{arg.timeText}</span>}
      <span className="eduhub-calendar-event-title">{arg.event.title}</span>
      {subline && <span className="eduhub-calendar-event-sub">{subline}</span>}
      {address && arg.view.type !== 'dayGridMonth' && <span className="eduhub-calendar-event-sub">{address}</span>}
    </div>
  );
};

const CalendarContent: FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const isAdmin = useIsAdmin();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const calendarRef = useRef<FullCalendar>(null);

  const [programSelection, setProgramSelection] = useState<string>(ALL_PROGRAMS);
  const [range, setRange] = useState<CalendarRange | null>(null);
  const [viewType, setViewType] = useState('dayGridMonth');
  const [kinds, setKinds] = useState<SessionKind[]>(['COURSES', 'EVENTS']);
  const [locations, setLocations] = useState<string[]>([]);
  const [courseIds, setCourseIds] = useState<number[]>([]);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);

  // Super-admins see every program, org admins only the programs they manage.
  const programWhere = useManageProgramWhere();
  const programsQuery = useManageQuery<Programs>(PROGRAMS_WITH_MINIMUM_PROPERTIES, {
    variables: { where: programWhere },
  });
  const programs = useMemo(() => programsQuery.data?.Program ?? [], [programsQuery.data]);

  // An admin of a single program gets that program's calendar without a selector.
  const showProgramSelector = programs.length > 1;
  const effectiveSelection = programs.length === 1 ? String(programs[0].id) : programSelection;
  const selectedProgram = programs.find((program) => String(program.id) === effectiveSelection);

  const programOptions = useMemo(() => {
    const multipleOrganizations = new Set(programs.map((program) => program.organizationId)).size > 1;
    return [
      { value: ALL_PROGRAMS, label: t('calendar.program_all') },
      ...programs.map((program) => ({
        value: String(program.id),
        label: multipleOrganizations ? `${program.title} · ${program.Organization.name}` : program.title,
      })),
    ];
  }, [programs, t]);

  const programIds = useMemo(
    () => scopedProgramIds(effectiveSelection, programs, isAdmin),
    [effectiveSelection, programs, isAdmin]
  );

  const sessionsQuery = useManageQuery<CalendarSessions>(CALENDAR_SESSIONS, {
    variables: { where: buildSessionWhere(programIds, range) },
    skip: !range || programsQuery.loading || (programIds !== null && programIds.length === 0),
  });
  const [loadAllSessions, exportQuery] = useLazyRoleQuery<CalendarSessions>(CALENDAR_SESSIONS);

  const sessions = useMemo(() => sessionsQuery.data?.Session ?? [], [sessionsQuery.data]);
  // The type filter only applies across programs; a single program has a single type.
  const showKindFilter = effectiveSelection === ALL_PROGRAMS;
  const filters = useMemo(
    () => ({ kinds: showKindFilter ? kinds : (['COURSES', 'EVENTS'] as SessionKind[]), locations, courseIds }),
    [showKindFilter, kinds, locations, courseIds]
  );
  const visibleSessions = useMemo(() => filterSessions(sessions, filters), [sessions, filters]);

  // Course chips come from the loaded range; selected courses stay listed when they have no
  // sessions in it, so they can still be switched off.
  const courseTitles = useRef(new Map<number, string>());
  const courses = useMemo(() => {
    const inRange = coursesOfSessions(sessions);
    inRange.forEach((course) => courseTitles.current.set(course.id, course.title));
    const missing = courseIds
      .filter((id) => !inRange.some((course) => course.id === id) && courseTitles.current.has(id))
      .map((id) => ({ id, title: courseTitles.current.get(id) as string }));
    return [...inRange, ...missing].sort((a, b) => a.title.localeCompare(b.title));
  }, [sessions, courseIds]);

  const events: EventInput[] = useMemo(
    () =>
      visibleSessions.map((session) => {
        const location = resolveLocation(session);
        const colors = getLocationColor(location);
        const program = sessionProgram(session);
        return {
          id: String(session.id),
          title: sessionHeadline(session),
          start: session.startDateTime,
          end: session.endDateTime,
          backgroundColor: colors.background,
          borderColor: colors.border,
          textColor: colors.text,
          classNames: sessionKind(session) === 'EVENTS' ? ['fc-event-event-type'] : [],
          extendedProps: {
            sessionId: session.id,
            subline: sessionSubline(session),
            programTitle: program?.shortTitle || program?.title || '',
            description: session.description || '',
            location,
            address: resolveAddress(session),
            speakers: session.SessionSpeakers.map((speaker) => ({
              firstName: speaker.User?.firstName || '',
              lastName: speaker.User?.lastName || '',
            })),
          },
        };
      }),
    [visibleSessions]
  );

  // Keep the view fitting the screen: an agenda list on phones, the month grid elsewhere.
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (isMobile && api.view.type !== 'listWeek' && api.view.type !== 'timeGridDay') {
      api.changeView('listWeek');
    } else if (!isMobile && api.view.type === 'listWeek') {
      api.changeView('dayGridMonth');
    }
  }, [isMobile]);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setViewType(arg.view.type);
    setRange((prev) =>
      prev && prev.start.getTime() === arg.start.getTime() && prev.end.getTime() === arg.end.getTime()
        ? prev
        : { start: arg.start, end: arg.end }
    );
  }, []);

  const handleProgramChange = useCallback(
    (value: string) => {
      setProgramSelection(value);
      setCourseIds([]);
      // Land on the program's lecture period rather than on an empty month.
      const program = programs.find((p) => String(p.id) === value);
      const api = calendarRef.current?.getApi();
      if (program && api && isOutsideLecturePeriod(program, api.getDate())) {
        api.gotoDate(program.lectureStart);
      }
    },
    [programs]
  );

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const handleEventClick = useCallback((info: EventClickArg) => {
    const props = info.event.extendedProps;
    setSelectedSession({
      id: props.sessionId,
      title: props.subline,
      courseTitle: info.event.title,
      programTitle: props.programTitle,
      startDateTime: info.event.startStr,
      endDateTime: info.event.endStr,
      description: props.description,
      location: props.location,
      address: props.address,
      speakers: props.speakers,
    });
    setPopoverAnchor(info.el);
  }, []);

  const handleClosePopover = useCallback(() => {
    setPopoverAnchor(null);
    setSelectedSession(null);
  }, []);

  // The export covers every session of the selected program(s) that matches the filters, not just
  // the visible range.
  const handleExportICal = useCallback(async () => {
    const { data } = await loadAllSessions({ variables: { where: buildSessionWhere(programIds, null) } });
    const icalEvents = filterSessions(data?.Session ?? [], filters).map((session) => {
      const location = resolveLocation(session);
      const address = resolveAddress(session);
      const subline = sessionSubline(session);
      return {
        uid: `session-${session.id}@eduhub`,
        title: sessionHeadline(session) + (subline ? ` – ${subline}` : ''),
        startDateTime: session.startDateTime,
        endDateTime: session.endDateTime,
        description: session.description || undefined,
        location: [location, address].filter(Boolean).join(' – ') || undefined,
      };
    });
    if (icalEvents.length === 0) return;
    downloadICalFile(generateICalString(icalEvents, selectedProgram?.title ?? 'EduHub Calendar'));
  }, [loadAllSessions, programIds, filters, selectedProgram]);

  const error = programsQuery.error || sessionsQuery.error;
  const noPrograms = !programsQuery.loading && programs.length === 0;

  return (
    <Page>
      <div className="mx-auto mt-20 max-w-screen-xl px-3 text-label-primary sm:px-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <CommonPageHeader headline={t('calendar.title')} />
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            {!showProgramSelector && selectedProgram && (
              <span className="self-start rounded-full bg-bg-secondary px-4 py-2 text-sm text-label-secondary sm:self-auto">
                {selectedProgram.title}
              </span>
            )}
            {showProgramSelector && (
              <div className="w-full sm:w-72">
                <DropDownSelector
                  variant="eduhub"
                  label={t('calendar.program')}
                  value={effectiveSelection}
                  options={programOptions}
                  onValueUpdated={handleProgramChange}
                />
              </div>
            )}
            <button
              type="button"
              onClick={handleExportICal}
              disabled={noPrograms || exportQuery.loading}
              className="self-start whitespace-nowrap rounded-full border-2 border-label-primary px-4 py-2 text-sm
                text-label-primary transition-colors hover:border-brand disabled:cursor-not-allowed
                disabled:opacity-40 sm:self-auto"
            >
              {t('calendar.export_ical')}
            </button>
          </div>
        </div>

        {noPrograms ? (
          <div className="rounded-xl border border-border-primary bg-bg-card py-16 text-center text-label-secondary">
            {t('calendar.no_programs')}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <CalendarFilters
              showKindFilter={showKindFilter}
              kinds={kinds}
              onToggleKind={(kind) => setKinds((prev) => toggle(prev, kind))}
              locations={locations}
              onToggleLocation={(location) => setLocations((prev) => toggle(prev, location))}
              onClearLocations={() => setLocations([])}
              courses={courses}
              courseIds={courseIds}
              onToggleCourse={(id) => setCourseIds((prev) => toggle(prev, id))}
              onClearCourses={() => setCourseIds([])}
            />

            {error && (
              <div className="rounded-xl border border-error px-4 py-3 text-sm text-error">
                {t('calendar.error_loading')}: {error.message}
              </div>
            )}

            {/* The calendar stays mounted while loading so navigating does not reset its date. */}
            <div className="light eduhub-calendar relative rounded-2xl border border-border-primary bg-fill-primary p-2 shadow-lg sm:p-4">
              {sessionsQuery.loading && (
                <div className="absolute right-4 top-4 z-10 rounded-full bg-bg-secondary px-3 py-1 text-xs text-label-secondary sm:top-auto sm:bottom-4">
                  {t('common.loading')}
                </div>
              )}
              {!sessionsQuery.loading && !error && range && viewType !== 'listWeek' && visibleSessions.length === 0 && (
                <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex justify-center">
                  <span className="rounded-full bg-bg-secondary px-4 py-2 text-sm text-label-secondary shadow">
                    {t('calendar.no_sessions_in_range')}
                  </span>
                </div>
              )}
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={
                  isMobile
                    ? { left: 'prev,next', center: 'title', right: 'today' }
                    : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' }
                }
                footerToolbar={isMobile ? { center: 'listWeek,timeGridDay,dayGridMonth' } : undefined}
                locales={[deLocale]}
                locale={locale}
                firstDay={1}
                events={events}
                eventContent={renderEventContent}
                eventClick={handleEventClick}
                datesSet={handleDatesSet}
                height="auto"
                eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                slotMinTime="07:00:00"
                slotMaxTime="23:00:00"
                dayMaxEvents={3}
                nowIndicator
                eventDisplay="block"
                eventClassNames="cursor-pointer"
                noEventsContent={t('calendar.no_sessions_in_range')}
              />
            </div>
          </div>
        )}

        <SessionDetailPopover session={selectedSession} anchorEl={popoverAnchor} onClose={handleClosePopover} />
      </div>
    </Page>
  );
};

export default CalendarContent;
