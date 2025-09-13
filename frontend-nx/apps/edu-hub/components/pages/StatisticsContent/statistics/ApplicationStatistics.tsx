import React, { FC, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
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

  // Query for program list (for selector)
  const { data: programListData } = useRoleQuery<ProgramStatistics>(PROGRAM_LIST);

  // Query for enrollment data
  const { data, loading, error } = useRoleQuery<MultiProgramEnrollments>(MULTI_PROGRAM_ENROLLMENTS, {
    variables: {
      programIds: selectedPrograms.map((p) => p.id),
    },
    skip: selectedPrograms.length === 0,
  });

  // Transform programs data for tag selector
  const programOptions = useMemo(
    () =>
      programListData?.Program.map((program) => ({
        id: program.id,
        name: program.title,
      })) || [],
    [programListData]
  );

  // Process data for cumulative chart
  const cumulativeChartData = useMemo(() => {
    if (!data?.Program.length) return [];

    // Sort all enrollments by date first
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

    // Process enrollments in chronological order
    allEnrollments.forEach(({ date, program }) => {
      // Initialize or increment program count
      programCounts.set(program, (programCounts.get(program) || 0) + 1);

      // Create or update date entry
      if (!dateMap.has(date)) {
        dateMap.set(date, {});
      }

      // Copy all current cumulative counts to this date
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
  }, [data]);

  // Process data for daily chart
  const dailyChartData = useMemo(() => {
    if (!data?.Program.length) return [];

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
  }, [data]);

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
      <div className="bg-white p-4 rounded´´-lg">
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
