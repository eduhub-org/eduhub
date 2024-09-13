import React, { FC, useState, useMemo, useEffect } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { Page } from '../../layout/Page';
import { MULTI_PROGRAM_ENROLLMENTS } from '../../../queries/multiProgramEnrollments';
import { MultiProgramEnrollments } from '../../../queries/__generated__/MultiProgramEnrollments';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TagSelector from '../../forms/TagSelector';
import { PROGRAM_LIST } from '../../../queries/programList';
import { ProgramList } from '../../../queries/__generated__/ProgramList';
import Loading from '../../common/Loading';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useRoleQuery } from '../../../hooks/authedQuery';

const StatisticsContent: FC = () => {
  const { t } = useTranslation('statistics');
  const [selectedPrograms, setSelectedPrograms] = useState<{ id: number; name: string }[]>([]);

  const { data: programsData, loading: programsLoading } = useRoleQuery<ProgramList>(PROGRAM_LIST);

  const { data, loading, error } = useRoleQuery<MultiProgramEnrollments>(MULTI_PROGRAM_ENROLLMENTS, {
    variables: { programIds: selectedPrograms.map((program) => program.id) },
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    const allDates = new Set<string>();
    data.Program.forEach((program) => {
      program.Courses.forEach((course) => {
        course.CourseEnrollments.forEach((enrollment) => {
          allDates.add(new Date(enrollment.created_at).toISOString().split('T')[0]);
        });
      });
    });

    return Array.from(allDates)
      .sort()
      .map((date) => {
        const dataPoint: { [key: string]: any } = { date };
        data.Program.forEach((program) => {
          const count = program.Courses.reduce((total, course) => {
            return (
              total +
              course.CourseEnrollments.filter(
                (enrollment) => new Date(enrollment.created_at).toISOString().split('T')[0] === date
              ).length
            );
          }, 0);
          dataPoint[program.title] = count;
        });
        return dataPoint;
      });
  }, [data]);

  const cumulativeChartData = useMemo(() => {
    if (!chartData.length) return [];
    const cumulativeData = chartData.map((dataPoint, index) => {
      const cumulativePoint: { [key: string]: any } = { date: dataPoint.date };
      Object.keys(dataPoint).forEach((key) => {
        if (key !== 'date') {
          cumulativePoint[key] = dataPoint[key] + (index > 0 ? cumulativeChartData[index - 1][key] : 0);
        }
      });
      return cumulativePoint;
    });
    return cumulativeData;
  }, [chartData]);

  const handleProgramChange = (selectedTags: { id: number; name: string }[]) => {
    setSelectedPrograms(selectedTags);
  };

  const programOptions = useMemo(() => {
    if (!programsData?.Program) return [];
    
    return programsData.Program
      .map((program) => ({
        id: program.id,
        name: program.title,
        applicationStart: new Date(program.applicationStart),
      }))
      .sort((a, b) => b.applicationStart.getTime() - a.applicationStart.getTime())
      .map(({ id, name }) => ({ id, name }));
  }, [programsData]);

  useEffect(() => {
    if (programOptions.length > 0 && selectedPrograms.length === 0) {
      setSelectedPrograms([programOptions[0]]);
    }
  }, [programOptions, selectedPrograms]);

  return (
    <Page>
      <div className="max-w-screen-xl mx-auto mt-20 text-gray-200">
        {loading && <Loading />}
        {error && <div className="text-red-400">Es ist ein Fehler aufgetreten: {error.message}</div>}
        {!loading && !error && (
          <div>
            <CommonPageHeader headline={t('enrollment_statistics')} />

            <div className="bg-white p-4 rounded-lg mb-6">
              <TagSelector
                label={t('select_programs.label')}
                placeholder={t('select_programs.placeholder')}
                itemId={0}
                currentTags={selectedPrograms}
                tagOptions={programOptions}
                onSelectedTagsChange={handleProgramChange}
                refetchQueries={[]}
                className="text-gray-800"
              />
            </div>

            {selectedPrograms.length > 0 ? (
              <div className="space-y-8">
                <div className="bg-white p-4 rounded-lg">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('cumulative_enrollments')}</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={cumulativeChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="date" stroke="#333" />
                      <YAxis stroke="#333" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                        labelStyle={{ color: '#333' }}
                      />
                      <Legend wrapperStyle={{ color: '#333' }} />
                      {data?.Program.map((program, index) => (
                        <Line
                          key={program.id}
                          type="monotone"
                          dataKey={program.title}
                          stroke={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('daily_enrollments')}</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="date" stroke="#333" />
                      <YAxis stroke="#333" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                        labelStyle={{ color: '#333' }}
                      />
                      <Legend wrapperStyle={{ color: '#333' }} />
                      {data?.Program.map((program, index) => (
                        <Line
                          key={program.id}
                          type="monotone"
                          dataKey={program.title}
                          stroke={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

              </div>
            ) : (
              <div className="mt-4 text-gray-300">{t('select_programs.placeholder')}</div>
            )}
          </div>
        )}
      </div>
    </Page>
  );
};

export default StatisticsContent;
