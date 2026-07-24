import { FC, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventInput } from '@fullcalendar/core';

import { Page } from '../../layout/Page';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { CALENDAR_SESSIONS, CALENDAR_COURSES } from '../../../queries/calendarSessions';
import { getLocationColor } from '../../../helpers/calendarColors';
import { generateICalString, downloadICalFile } from '../../../helpers/icalExport';
import { LocationOption_enum } from '../../../__generated__/globalTypes';

import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';

import CalendarLegend from './CalendarLegend';
import SessionDetailPopover from './SessionDetailPopover';

interface CourseListItem {
  id: number;
  title: string;
}

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

function resolveLocation(session: any): string | undefined {
  if (session.SessionAddresses?.length > 0) {
    const addr = session.SessionAddresses[0];
    return addr.CourseLocation?.locationOption ?? undefined;
  }
  if (session.Course?.CourseLocations?.length > 0) {
    return session.Course.CourseLocations[0].locationOption;
  }
  return undefined;
}

function resolveAddress(session: any): string | undefined {
  if (session.SessionAddresses?.length === 0) return undefined;
  const addr = session.SessionAddresses[0];
  const direct = addr.address?.trim();
  if (direct) return direct;
  const fromLocation =
    addr.LocationAddress?.address?.trim() || addr.LocationAddress?.shortLabel?.trim();
  if (fromLocation) return fromLocation;
  return addr.CourseLocation?.defaultSessionAddress?.trim() || undefined;
}

const LOCATIONS = [LocationOption_enum.KIEL, LocationOption_enum.HEIDE, LocationOption_enum.ONLINE];

function BulkToggleCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={checked}
          indeterminate={indeterminate}
          onChange={onChange}
          size="small"
          sx={{
            color: 'var(--eduhub-label-secondary)',
            '&.Mui-checked': { color: 'var(--eduhub-brand)' },
            '&.MuiCheckbox-indeterminate': { color: 'var(--eduhub-brand)' },
          }}
        />
      }
      label={label}
      className="text-label-secondary m-0"
      sx={{ '& .MuiFormControlLabel-label': { color: 'var(--eduhub-label-primary)' } }}
    />
  );
}

const CalendarContent: FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const calendarRef = useRef<FullCalendar>(null);

  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [showCourses, setShowCourses] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  const coursesWhere = useMemo(() => {
    if (!showCourses && !showEvents) {
      return { id: { _eq: -1 } }; // no courses when neither selected
    }
    if (showCourses && !showEvents) {
      return { Program: { type: { _neq: 'EVENTS' } } };
    }
    if (!showCourses && showEvents) {
      return { Program: { type: { _eq: 'EVENTS' } } };
    }
    return {};
  }, [showCourses, showEvents]);

  const { data: coursesData, error: coursesError } = useAdminQuery(CALENDAR_COURSES, {
    variables: { where: coursesWhere },
  });

  const courseList = useMemo<CourseListItem[]>(
    () => (coursesData?.Course ?? []).map((c: { id: number; title: string }) => ({ id: c.id, title: c.title })),
    [coursesData?.Course]
  );

  const validCourseIds = useMemo(
    () => selectedCourseIds.filter((id) => courseList.some((c) => c.id === id)),
    [selectedCourseIds, courseList]
  );

  const where = useMemo(() => {
    const conditions: unknown[] = [];
    if (validCourseIds.length > 0) {
      conditions.push({ courseId: { _in: validCourseIds } });
    }
    if (selectedLocations.length > 0) {
      const locs = selectedLocations as LocationOption_enum[];
      conditions.push({
        _or: [
          { SessionAddresses: { CourseLocation: { locationOption: { _in: locs } } } },
          { Course: { CourseLocations: { locationOption: { _in: locs } } } },
        ],
      });
    }
    // Filter by type: Kurse (non-EVENTS programs) vs Events (EVENTS program)
    if (!showCourses && !showEvents) {
      conditions.push({ courseId: { _eq: -1 } }); // show nothing
    } else if (showCourses && !showEvents) {
      conditions.push({ Course: { Program: { type: { _neq: 'EVENTS' } } } });
    } else if (!showCourses && showEvents) {
      conditions.push({ Course: { Program: { type: { _eq: 'EVENTS' } } } });
    }
    if (conditions.length === 0) return {};
    if (conditions.length === 1) return conditions[0];
    return { _and: conditions };
  }, [validCourseIds, selectedLocations, showCourses, showEvents]);

  const { data, loading, error } = useAdminQuery(CALENDAR_SESSIONS, {
    variables: { where },
    skip: validCourseIds.length > 0 && courseList.length === 0,
  });

  const handleLocationToggle = useCallback((location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location]
    );
  }, []);

  const handleCourseToggle = useCallback((courseId: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  }, []);

  const allTypesSelected = showCourses && showEvents;
  const handleSelectAllTypes = useCallback(() => {
    setShowCourses(true);
    setShowEvents(true);
  }, []);
  const handleDeselectAllTypes = useCallback(() => {
    setShowCourses(false);
    setShowEvents(false);
  }, []);

  const allLocationsSelected = LOCATIONS.every((loc) => selectedLocations.includes(loc));
  const handleSelectAllLocations = useCallback(() => {
    setSelectedLocations([...LOCATIONS]);
  }, []);
  const handleDeselectAllLocations = useCallback(() => {
    setSelectedLocations([]);
  }, []);

  const allCoursesSelected =
    courseList.length > 0 && courseList.every((c) => selectedCourseIds.includes(c.id));
  const handleSelectAllCourses = useCallback(() => {
    setSelectedCourseIds(courseList.map((c) => c.id));
  }, [courseList]);
  const handleDeselectAllCourses = useCallback(() => {
    setSelectedCourseIds([]);
  }, []);

  const events: EventInput[] = useMemo(() => {
    if (!data?.Session) return [];

    return data.Session.map((session: any) => {
      const location = resolveLocation(session);
      const colors = getLocationColor(location);
      const courseTitle = session.Course?.title || '';
      // Classify by Program.type (shortTitle is a free-text label); keep shortTitle for display only.
      const isEvent = session.Course?.Program?.type === 'EVENTS';
      const address = resolveAddress(session);

      const titleLine = courseTitle + (session.title ? ` – ${session.title}` : '');
      const displayTitle = address ? `${titleLine}\n${address}` : titleLine;

      return {
        id: String(session.id),
        title: displayTitle,
        start: session.startDateTime,
        end: session.endDateTime,
        backgroundColor: colors.background,
        borderColor: colors.border,
        textColor: colors.text,
        classNames: isEvent ? ['fc-event-event-type'] : [],
        extendedProps: {
          sessionId: session.id,
          sessionTitle: session.title || '',
          courseTitle,
          programTitle: session.Course?.Program?.shortTitle || session.Course?.Program?.title || '',
          isEvent,
          description: session.description || '',
          location,
          address,
          speakers:
            session.SessionSpeakers?.map((sp: any) => ({
              firstName: sp.User?.firstName || '',
              lastName: sp.User?.lastName || '',
            })) || [],
        },
      };
    });
  }, [data]);

  const handleEventClick = useCallback((info: EventClickArg) => {
    const props = info.event.extendedProps;
    setSelectedSession({
      id: props.sessionId,
      title: props.sessionTitle,
      courseTitle: props.courseTitle,
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

  const handleExportICal = useCallback(() => {
    if (!data?.Session) return;

    const icalEvents = data.Session.map((session: any) => {
      const courseTitle = session.Course?.title || '';
      const location = resolveLocation(session);
      const address = resolveAddress(session);

      return {
        uid: `session-${session.id}@eduhub`,
        title: courseTitle + (session.title ? ` – ${session.title}` : ''),
        startDateTime: session.startDateTime,
        endDateTime: session.endDateTime,
        description: session.description || undefined,
        location: [location, address].filter(Boolean).join(' – ') || undefined,
      };
    });

    const icalString = generateICalString(icalEvents, 'EduHub Calendar');
    downloadICalFile(icalString);
  }, [data]);

  return (
    <Page>
      <div className="max-w-screen-xl mx-auto mt-20 text-label-primary">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CommonPageHeader headline={t('calendar.title')} />
          <button
            onClick={handleExportICal}
            disabled={!data?.Session?.length}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary hover:bg-border-primary 
              text-sm text-label-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed
              self-start sm:self-auto mt-0 sm:mt-6 border border-border-primary"
          >
            {t('calendar.export_ical')}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <div>
              <p className="text-sm font-medium text-label-secondary mb-2">{t('calendar.filter_type')}</p>
              <FormGroup row className="gap-x-4 mb-4">
                <BulkToggleCheckbox
                  checked={allTypesSelected}
                  indeterminate={!allTypesSelected && (showCourses || showEvents)}
                  onChange={() => (allTypesSelected ? handleDeselectAllTypes() : handleSelectAllTypes())}
                  label={t('calendar.filter_type_all')}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showCourses}
                      onChange={() => setShowCourses((v) => !v)}
                      size="small"
                      sx={{
                        color: 'var(--eduhub-label-secondary)',
                        '&.Mui-checked': { color: 'var(--eduhub-brand)' },
                      }}
                    />
                  }
                  label={t('calendar.filter_courses')}
                  className="text-label-secondary m-0"
                  sx={{ '& .MuiFormControlLabel-label': { color: 'var(--eduhub-label-primary)' } }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showEvents}
                      onChange={() => setShowEvents((v) => !v)}
                      size="small"
                      sx={{
                        color: 'var(--eduhub-label-secondary)',
                        '&.Mui-checked': { color: 'var(--eduhub-brand)' },
                      }}
                    />
                  }
                  label={t('calendar.filter_events')}
                  className="text-label-secondary m-0"
                  sx={{ '& .MuiFormControlLabel-label': { color: 'var(--eduhub-label-primary)' } }}
                />
              </FormGroup>
            </div>
            <div>
              <p className="text-sm font-medium text-label-secondary mb-2">{t('calendar.filter_location')}</p>
              <FormGroup row className="gap-x-4">
                <BulkToggleCheckbox
                  checked={allLocationsSelected}
                  indeterminate={selectedLocations.length > 0 && !allLocationsSelected}
                  onChange={() =>
                    allLocationsSelected ? handleDeselectAllLocations() : handleSelectAllLocations()
                  }
                  label={t('calendar.filter_location_all')}
                />
                {LOCATIONS.map(
                  (loc) => (
                    <FormControlLabel
                      key={loc}
                      control={
                        <Checkbox
                          checked={selectedLocations.includes(loc)}
                          onChange={() => handleLocationToggle(loc)}
                          size="small"
                          sx={{
                            color: 'var(--eduhub-label-secondary)',
                            '&.Mui-checked': { color: 'var(--eduhub-brand)' },
                          }}
                        />
                      }
                      label={t(`common.location.${loc}`)}
                      className="text-label-secondary m-0"
                      sx={{ '& .MuiFormControlLabel-label': { color: 'var(--eduhub-label-primary)' } }}
                    />
                  )
                )}
              </FormGroup>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-label-secondary mb-2">{t('calendar.filter_course')}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0 max-h-28 overflow-y-auto overflow-x-hidden pr-2">
                {courseList.length > 0 && (
                  <BulkToggleCheckbox
                    checked={allCoursesSelected}
                    indeterminate={selectedCourseIds.length > 0 && !allCoursesSelected}
                    onChange={() =>
                      allCoursesSelected ? handleDeselectAllCourses() : handleSelectAllCourses()
                    }
                    label={t('calendar.filter_course_all')}
                  />
                )}
                {courseList.map((c) => (
                  <FormControlLabel
                    key={c.id}
                    control={
                      <Checkbox
                        checked={selectedCourseIds.includes(c.id)}
                        onChange={() => handleCourseToggle(c.id)}
                        size="small"
                        sx={{
                          color: 'var(--eduhub-label-secondary)',
                          '&.Mui-checked': { color: 'var(--eduhub-brand)' },
                        }}
                      />
                    }
                    label={c.title}
                    className="text-label-secondary m-0"
                    sx={{ '& .MuiFormControlLabel-label': { color: 'var(--eduhub-label-primary)' } }}
                  />
                ))}
              </div>
            </div>
          </div>
          <CalendarLegend />
        </div>

        {error || coursesError ? (
          <div className="text-center py-20 text-red-600">
            {t('calendar.error_loading')}: {(error || coursesError)?.message}
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-label-secondary">
            {t('common.loading')}
          </div>
        ) : (
          <div className="light eduhub-calendar bg-fill-primary rounded-xl p-2 sm:p-4 shadow-lg border border-border-primary">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              locale={locale}
              events={events}
              eventClick={handleEventClick}
              height="auto"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              dayMaxEvents={3}
              nowIndicator
              eventDisplay="block"
              eventClassNames="cursor-pointer rounded text-xs"
            />
          </div>
        )}

        <SessionDetailPopover
          session={selectedSession}
          anchorEl={popoverAnchor}
          onClose={handleClosePopover}
        />
      </div>
    </Page>
  );
};

export default CalendarContent;
