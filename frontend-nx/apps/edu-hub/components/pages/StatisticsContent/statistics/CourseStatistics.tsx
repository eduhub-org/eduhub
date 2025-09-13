import React, { FC, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { TimeSeriesLineChart } from '../../../common/charts/TimeSeriesLineChart';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { PROGRAM_STATISTICS } from '../../../../queries/programList';
import { ProgramStatistics } from '../../../../queries/__generated__/ProgramStatistics';
import Loading from '../../../common/Loading';
import { PROGRAM_TYPES } from '../../../../queries/programList';
import { ProgramTypesList } from '../../../../queries/__generated__/ProgramTypesList';
import TagSelector from '../../../inputs/TagSelector';
import { getFilteredProgramsAndDateMap, formatChartDate, getSortedPrograms } from './utils';

interface ChartDataPoint {
  date: string;
  [key: string]: any;
}

export const CourseStatistics: FC = () => {
  const t = useTranslations('statistics');
  const [selectedTypes, setSelectedTypes] = useState<{ id: number; name: string }[]>([]);

  const { data: typeData } = useRoleQuery<ProgramTypesList>(PROGRAM_TYPES);
  const { data: programData, loading, error } = useRoleQuery<ProgramStatistics>(PROGRAM_STATISTICS);

  const typeOptions = useMemo(
    () =>
      typeData?.ProgramType.map((type, index) => ({
        id: index,
        name: type.value,
      })) || [],
    [typeData]
  );

  // Program-based chart data
  const programBasedChartData = useMemo(() => {
    const { filteredPrograms, dateMap } = getFilteredProgramsAndDateMap(programData, selectedTypes);
    if (filteredPrograms.length === 0) return [] as ChartDataPoint[];

    const sortedDates = Array.from(dateMap.keys()).sort();

    return sortedDates.map((date) => {
      const totalCourses = filteredPrograms.reduce((sum, program) => {
        const programStartMonth = program.lectureStart
          ? new Date(program.lectureStart).toISOString().slice(0, 7)
          : null;
        return (
          sum + (programStartMonth === date ? program.Courses?.filter((course) => course.published)?.length || 0 : 0)
        );
      }, 0);

      return {
        date: formatChartDate(date, dateMap),
        courses: totalCourses,
      };
    });
  }, [programData, selectedTypes]);

  // Cumulative chart data
  const cumulativeChartData = useMemo(() => {
    const { filteredPrograms, dateMap } = getFilteredProgramsAndDateMap(programData, selectedTypes);
    if (!filteredPrograms?.length) return [] as ChartDataPoint[];

    const cumulativeMap = new Map<string, number>();
    let cumulativeTotal = 0;

    getSortedPrograms(filteredPrograms).forEach((program) => {
      if (program?.lectureStart) {
        const date = new Date(program.lectureStart).toISOString().slice(0, 7);
        cumulativeTotal += program.Courses?.filter((course) => course.published)?.length ?? 0;
        cumulativeMap.set(date, cumulativeTotal);
      }
    });

    return Array.from(cumulativeMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({
        date: formatChartDate(date, dateMap),
        courses: total,
      }));
  }, [programData, selectedTypes]);

  const series = useMemo(() => {
    return [
      {
        key: 'courses',
        label: t('course_statistics.courses'),
      },
    ];
  }, [t]);

  if (loading) return <Loading />;
  if (error) return <div className="text-red-400">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg">
        <TagSelector
          variant="material"
          label={t('select_program_types.label')}
          placeholder={t('select_program_types.placeholder')}
          itemId={0}
          values={selectedTypes}
          options={typeOptions}
          onValueUpdated={setSelectedTypes}
          refetchQueries={[]}
          className="text-gray-800"
        />
      </div>

      <div className="space-y-8">
        <TimeSeriesLineChart data={cumulativeChartData} series={series} title={t('course_statistics.cumulative')} />
        <TimeSeriesLineChart data={programBasedChartData} series={series} title={t('course_statistics.by_program')} />
      </div>
    </div>
  );
};
