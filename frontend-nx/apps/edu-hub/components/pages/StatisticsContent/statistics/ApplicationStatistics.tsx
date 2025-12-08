import React, { FC, useMemo, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Checkbox, FormControlLabel } from '@mui/material';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { MULTI_PROGRAM_ENROLLMENTS } from '../../../../queries/multiProgramEnrollments';
import { MultiProgramEnrollments } from '../../../../queries/__generated__/MultiProgramEnrollments';
import { TimeSeriesLineChart } from '../../../common/charts/TimeSeriesLineChart';
import TagSelector from '../../../inputs/TagSelector';
import { PROGRAM_LIST } from '../../../../queries/programList';
import { ProgramStatistics } from '../../../../queries/__generated__/ProgramStatistics';
import Loading from '../../../common/Loading';

export const ApplicationStatistics: FC = () => {
  const t = useTranslations('statistics');
  const [selectedPrograms, setSelectedPrograms] = useState<{ id: number; name: string }[]>([]);
  const [useActualDates, setUseActualDates] = useState(false);

  // Query for program list (for selector)
  const { data: programListData } = useRoleQuery<ProgramStatistics>(PROGRAM_LIST);

  // Query for enrollment data
  const { data, loading, error } = useRoleQuery<MultiProgramEnrollments>(MULTI_PROGRAM_ENROLLMENTS, {
    variables: {
      programIds: selectedPrograms.map((p) => p.id),
    },
    skip: selectedPrograms.length === 0,
  });

  // Transform programs data for tag selector, sorted by application start date (future/upcoming first)
  const programOptions = useMemo(
    () =>
      (programListData?.Program ?? [])
        .slice() // Create a copy to avoid mutating the original array
        .sort((a, b) => {
          // Sort by applicationStart in descending order (most recent/future first)
          // Programs without applicationStart go to the end
          if (!a.applicationStart && !b.applicationStart) return 0;
          if (!a.applicationStart) return 1;
          if (!b.applicationStart) return -1;
          
          const dateA = new Date(a.applicationStart).getTime();
          const dateB = new Date(b.applicationStart).getTime();
          return dateB - dateA; // Descending order: future/recent dates first
        })
        .map((program) => ({
          id: program.id,
          name: program.title,
        })),
    [programListData]
  );

  // Helper function to calculate days until application end
  const calculateDaysUntilEnd = useCallback((enrollmentDate: string, applicationEndDate: string | null): number => {
    if (!applicationEndDate) return 0;
    
    const enrollment = new Date(enrollmentDate);
    const applicationEnd = new Date(applicationEndDate);
    const diffTime = applicationEnd.getTime() - enrollment.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, []);

  // Process data for cumulative chart
  const cumulativeChartData = useMemo(() => {
    if (!data?.Program.length) return [];

    // Get list of all programs for filling in zeros
    const allPrograms = data.Program.map((p) => p.title);

    if (useActualDates) {
      // Process by actual dates - chronological order
      const allEnrollments = data.Program.flatMap((program) =>
        program.Courses.flatMap((course) =>
          course.CourseEnrollments.map((enrollment) => ({
            date: new Date(enrollment.created_at).toISOString().split('T')[0],
            program: program.title,
          }))
        )
      ).sort((a, b) => a.date.localeCompare(b.date));

      const dateMap = new Map<string, { [key: string]: number }>();
      const programCounts = new Map<string, number>();

      // Initialize all programs with 0
      allPrograms.forEach((program) => {
        programCounts.set(program, 0);
      });

      // Process enrollments in chronological order
      allEnrollments.forEach(({ date, program }) => {
        programCounts.set(program, (programCounts.get(program) || 0) + 1);

        if (!dateMap.has(date)) {
          dateMap.set(date, {});
        }

        const dateEntry = dateMap.get(date);
        if (dateEntry) {
          programCounts.forEach((count, programTitle) => {
            dateEntry[programTitle] = count;
          });
        }
      });

      return Array.from(dateMap.entries())
        .map(([date, values]) => ({
          date,
          ...values,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
      // Process by days until end
      // First, group enrollments by days until end and count them
      const daysMap = new Map<number, { [key: string]: number }>();

      data.Program.forEach((program) => {
        program.Courses.forEach((course) => {
          course.CourseEnrollments.forEach((enrollment) => {
            const date = new Date(enrollment.created_at).toISOString().split('T')[0];
            const daysUntilEnd = calculateDaysUntilEnd(date, program.defaultApplicationEnd);

            if (!daysMap.has(daysUntilEnd)) {
              daysMap.set(daysUntilEnd, {});
            }

            const dayEntry = daysMap.get(daysUntilEnd);
            if (dayEntry) {
              dayEntry[program.title] = (dayEntry[program.title] || 0) + 1;
            }
          });
        });
      });

      // Find the range of days (max to 0)
      const allDays = Array.from(daysMap.keys());
      if (allDays.length === 0) return [];
      
      const maxDays = Math.max(...allDays);
      const minDays = Math.min(...allDays, 0);

      // Build cumulative counts from max days down to min days
      const programCumulativeCounts = new Map<string, number>();
      const result: Array<{ date: string; [key: string]: any }> = [];

      // Initialize all programs with 0
      allPrograms.forEach((program) => {
        programCumulativeCounts.set(program, 0);
      });

      // Iterate from max days down to min days
      for (let days = maxDays; days >= minDays; days--) {
        // Add counts for this day if they exist
        if (daysMap.has(days)) {
          const counts = daysMap.get(days);
          if (counts) {
            Object.entries(counts).forEach(([program, count]) => {
              programCumulativeCounts.set(program, (programCumulativeCounts.get(program) || 0) + count);
            });
          }
        }

        // Create entry with all cumulative counts (even if no change for this day)
        const entry: { date: string; [key: string]: any } = { date: days.toString() };
        programCumulativeCounts.forEach((count, program) => {
          entry[program] = count;
        });

        result.push(entry);
      }

      return result;
    }
  }, [data, useActualDates, calculateDaysUntilEnd]);

  // Process data for daily chart
  const dailyChartData = useMemo(() => {
    if (!data?.Program.length) return [];

    // Get list of all programs for filling in zeros
    const allPrograms = data.Program.map((p) => p.title);

    if (useActualDates) {
      // Process by actual dates
      const dateMap = new Map<string, { [key: string]: number }>();

      data.Program.forEach((program) => {
        program.Courses.forEach((course) => {
          course.CourseEnrollments.forEach((enrollment) => {
            const date = new Date(enrollment.created_at).toISOString().split('T')[0];

            if (!dateMap.has(date)) {
              dateMap.set(date, {});
            }

            const dateEntry = dateMap.get(date);
            if (dateEntry) {
              dateEntry[program.title] = (dateEntry[program.title] || 0) + 1;
            }
          });
        });
      });

      return Array.from(dateMap.entries())
        .map(([date, values]) => ({
          date,
          ...values,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
      // Process by days until end
      const daysMap = new Map<number, { [key: string]: number }>();

      data.Program.forEach((program) => {
        program.Courses.forEach((course) => {
          course.CourseEnrollments.forEach((enrollment) => {
            const date = new Date(enrollment.created_at).toISOString().split('T')[0];
            const daysUntilEnd = calculateDaysUntilEnd(date, program.defaultApplicationEnd);

            if (!daysMap.has(daysUntilEnd)) {
              daysMap.set(daysUntilEnd, {});
            }

            const dayEntry = daysMap.get(daysUntilEnd);
            if (dayEntry) {
              dayEntry[program.title] = (dayEntry[program.title] || 0) + 1;
            }
          });
        });
      });

      // Find the range of days (max to 0)
      const allDays = Array.from(daysMap.keys());
      if (allDays.length === 0) return [];
      
      const maxDays = Math.max(...allDays);
      const minDays = Math.min(...allDays, 0);

      // Build result with all days from max to min, filling zeros where needed
      const result: Array<{ date: string; [key: string]: any }> = [];

      for (let days = maxDays; days >= minDays; days--) {
        const entry: { date: string; [key: string]: any } = { date: days.toString() };
        
        // Fill in counts for each program (0 if no enrollments for this day)
        allPrograms.forEach((program) => {
          const counts = daysMap.get(days);
          entry[program] = counts?.[program] || 0;
        });

        result.push(entry);
      }

      return result;
    }
  }, [data, useActualDates, calculateDaysUntilEnd]);

  // Create series configuration for charts
  const series = useMemo(
    () =>
      data?.Program.map((program) => ({
        key: program.title,
        label: program.title,
      })) || [],
    [data]
  );

  const handleProgramChange = (programs: { id: number; name: string }[]) => {
    setSelectedPrograms(programs);
  };

  if (error) {
    return <div className="text-red-400">Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg space-y-4">
        <TagSelector
          variant="material"
          label={t('application_statistics.select_programs.label')}
          placeholder={t('application_statistics.select_programs.placeholder')}
          itemId={0}
          values={selectedPrograms}
          options={programOptions}
          onValueUpdated={handleProgramChange}
          refetchQueries={[]}
          className="text-gray-800"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={useActualDates}
              onChange={(e) => setUseActualDates(e.target.checked)}
              color="primary"
            />
          }
          label={t('application_statistics.use_actual_dates')}
          className="text-gray-800"
        />
      </div>

      {loading && <Loading />}

      {!loading && selectedPrograms.length === 0 && (
        <div className="text-gray-300">{t('application_statistics.no_data_available')}</div>
      )}

      {!loading && selectedPrograms.length > 0 && (
        <div className="space-y-8">
          <TimeSeriesLineChart
            data={cumulativeChartData}
            series={series}
            title={t('application_statistics.cumulative')}
          />

          <TimeSeriesLineChart data={dailyChartData} series={series} title={t('application_statistics.daily')} />
        </div>
      )}
    </div>
  );
};
