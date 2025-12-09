import React, { FC, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { TimeSeriesLineChart } from '../../../common/charts/TimeSeriesLineChart';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { PROGRAM_STATISTICS } from '../../../../queries/programList';
import { PROGRAM_TYPES } from '../../../../queries/programList';
import { ProgramStatistics } from '../../../../queries/__generated__/ProgramStatistics';
import { ProgramTypesList } from '../../../../queries/__generated__/ProgramTypesList';
import Loading from '../../../common/Loading';
import TagSelector from '../../../inputs/TagSelector';
import { getFilteredProgramsAndDateMap, formatChartDate } from './utils';
import { AttendanceStatus_enum } from '../../../../__generated__/globalTypes';

interface ChartDataPoint {
  date: string;
  [key: string]: any;
}

export const AttendanceStatistics: FC = () => {
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

  // Calculate attendances for a program's sessions
  const calculateAttendances = (program: any) => {
    return (
      program.Courses?.reduce((courseSum: number, course: any) => {
        return (
          courseSum +
          (course.Sessions?.reduce((sessionSum: number, session: any) => {
            // Group attendances by userId and get the most recent one for each user
            const latestAttendances = session.Attendances?.reduce((acc: any, attendance: any) => {
              const existingAttendance = acc[attendance.userId];
              if (!existingAttendance || existingAttendance.id < attendance.id) {
                acc[attendance.userId] = attendance;
              }
              return acc;
            }, {});

            // Count only ATTENDED status from the latest attendances
            const attendedCount = Object.values(latestAttendances || {}).filter(
              (attendance: any) => attendance.status === AttendanceStatus_enum.ATTENDED
            ).length;

            return sessionSum + attendedCount;
          }, 0) || 0)
        );
      }, 0) || 0
    );
  };

  // Program-based chart data
  const programBasedChartData = useMemo(() => {
    const { filteredPrograms, dateMap } = getFilteredProgramsAndDateMap(programData, selectedTypes);
    if (!filteredPrograms?.length) return [] as ChartDataPoint[];

    const sortedDates = Array.from(dateMap.keys()).sort();

    return sortedDates.map((date) => {
      const totalAttendances = filteredPrograms.reduce((sum, program) => {
        const programStartMonth = program?.lectureStart
          ? new Date(program.lectureStart).toISOString().slice(0, 7)
          : null;

        return sum + (programStartMonth === date ? calculateAttendances(program) : 0);
      }, 0);

      return {
        date: formatChartDate(date, dateMap),
        attendances: totalAttendances,
      };
    });
  }, [programData, selectedTypes]);

  // Cumulative chart data
  const cumulativeChartData = useMemo(() => {
    const { filteredPrograms, dateMap } = getFilteredProgramsAndDateMap(programData, selectedTypes);
    if (filteredPrograms.length === 0) return [] as ChartDataPoint[];

    const sortedDates = Array.from(dateMap.keys()).sort();
    let cumulativeTotal = 0;

    return sortedDates.map((date) => {
      const totalAttendances = filteredPrograms.reduce((sum, program) => {
        const programStartMonth = program.lectureStart
          ? new Date(program.lectureStart).toISOString().slice(0, 7)
          : null;

        if (programStartMonth && programStartMonth <= date) {
          return sum + calculateAttendances(program);
        }
        return sum;
      }, 0);

      cumulativeTotal = totalAttendances;
      return {
        date: formatChartDate(date, dateMap),
        attendances: cumulativeTotal,
      };
    });
  }, [programData, selectedTypes]);

  const series = useMemo(() => {
    return [
      {
        key: 'attendances',
        label: t('attendance_statistics.attendances'),
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
        <TimeSeriesLineChart data={cumulativeChartData} series={series} title={t('attendance_statistics.cumulative')} />

        <TimeSeriesLineChart
          data={programBasedChartData}
          series={series}
          title={t('attendance_statistics.by_program')}
        />
      </div>
    </div>
  );
};
