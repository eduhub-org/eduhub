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
import { getFilteredProgramsAndDateMap, formatChartDate } from './utils';

interface ChartDataPoint {
  date: string;
  [key: string]: any;
}

export const CertificateStatistics: FC = () => {
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
    if (!filteredPrograms?.length) return [] as ChartDataPoint[];

    const sortedDates = Array.from(dateMap.keys()).sort();

    return sortedDates.map((date) => {
      const certificateCounts = filteredPrograms.reduce(
        (sum, program) => {
          const programStartMonth = program?.lectureStart
            ? new Date(program.lectureStart).toISOString().slice(0, 7)
            : null;

          if (programStartMonth === date) {
            const courseCertificates = program.Courses?.reduce(
              (courseSum, course) => {
                const enrollments = course?.CourseEnrollments || [];
                return {
                  attendance: courseSum.attendance + enrollments.filter((e) => e.attendanceCertificateURL).length,
                  achievement: courseSum.achievement + enrollments.filter((e) => e.achievementCertificateURL).length,
                };
              },
              { attendance: 0, achievement: 0 }
            ) || { attendance: 0, achievement: 0 };
            return {
              attendance: sum.attendance + courseCertificates.attendance,
              achievement: sum.achievement + courseCertificates.achievement,
            };
          }
          return sum;
        },
        { attendance: 0, achievement: 0 }
      );

      return {
        date: formatChartDate(date, dateMap),
        attendanceCertificates: certificateCounts.attendance,
        achievementCertificates: certificateCounts.achievement,
      };
    });
  }, [programData, selectedTypes]);

  // Cumulative chart data
  const cumulativeChartData = useMemo(() => {
    const { filteredPrograms, dateMap } = getFilteredProgramsAndDateMap(programData, selectedTypes);
    if (!filteredPrograms?.length) return [] as ChartDataPoint[];

    const sortedDates = Array.from(dateMap.keys()).sort();
    let cumulativeAttendance = 0;
    let cumulativeAchievement = 0;

    return sortedDates.map((date) => {
      const certificateCounts = filteredPrograms.reduce(
        (sum, program) => {
          const programStartMonth = program?.lectureStart
            ? new Date(program.lectureStart).toISOString().slice(0, 7)
            : null;

          if (programStartMonth && programStartMonth <= date) {
            const courseCertificates = program.Courses?.reduce(
              (courseSum, course) => {
                const enrollments = course?.CourseEnrollments || [];
                return {
                  attendance: courseSum.attendance + enrollments.filter((e) => e.attendanceCertificateURL).length,
                  achievement: courseSum.achievement + enrollments.filter((e) => e.achievementCertificateURL).length,
                };
              },
              { attendance: 0, achievement: 0 }
            ) || { attendance: 0, achievement: 0 };
            return {
              attendance: sum.attendance + courseCertificates.attendance,
              achievement: sum.achievement + courseCertificates.achievement,
            };
          }
          return sum;
        },
        { attendance: 0, achievement: 0 }
      );

      cumulativeAttendance = certificateCounts.attendance;
      cumulativeAchievement = certificateCounts.achievement;

      return {
        date: formatChartDate(date, dateMap),
        attendanceCertificates: cumulativeAttendance,
        achievementCertificates: cumulativeAchievement,
      };
    });
  }, [programData, selectedTypes]);

  const series = useMemo(() => {
    return [
      {
        key: 'attendanceCertificates',
        label: t('certificate_statistics.attendance_certificates'),
      },
      {
        key: 'achievementCertificates',
        label: t('certificate_statistics.achievement_certificates'),
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
        <TimeSeriesLineChart
          data={cumulativeChartData}
          series={series}
          title={t('certificate_statistics.cumulative')}
        />
        <TimeSeriesLineChart
          data={programBasedChartData}
          series={series}
          title={t('certificate_statistics.by_program')}
        />
      </div>
    </div>
  );
};
