import React, { FC, useState, useMemo, useEffect, ErrorInfo, ReactNode } from 'react';
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
import { useCallback } from 'react';

interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please try again later.</h1>;
    }

    return this.props.children;
  }
}

const StatisticsContent: FC = () => {
  const { t } = useTranslation('statistics');
  const [selectedPrograms, setSelectedPrograms] = useState<{ id: number; name: string }[]>([]);
  const [key, setKey] = useState(0);

  const { data: programsData, loading: programsLoading } = useRoleQuery<ProgramList>(PROGRAM_LIST);

  const { data, loading, error } = useRoleQuery<MultiProgramEnrollments>(MULTI_PROGRAM_ENROLLMENTS, {
    variables: { programIds: selectedPrograms.map((program) => program.id) },
  });

  const chartData = useMemo(() => {
    try {
      if (!data) return [];
      console.log('Processing chart data');
      const allDates = new Set<string>();
      data.Program.forEach((program) => {
        console.log('Processing program:', program.title);
        program.Courses.forEach((course) => {
          console.log('Processing course:', course.title);
          course.CourseEnrollments.forEach((enrollment) => {
            allDates.add(new Date(enrollment.created_at).toISOString().split('T')[0]);
          });
        });
      });

      const processedData = Array.from(allDates)
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
      console.log('Processed chart data:', processedData);
      return processedData;
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  }, [data]);

  const cumulativeChartData = useMemo(() => {
    if (!chartData.length) return [];
    console.log('Processing cumulative chart data');
    
    const cumulativeData = chartData.reduce((acc, dataPoint, index) => {
      const cumulativePoint: { [key: string]: any } = { date: dataPoint.date };
      
      Object.keys(dataPoint).forEach((key) => {
        if (key !== 'date') {
          cumulativePoint[key] = dataPoint[key] + (index > 0 ? acc[index - 1][key] : 0);
        }
      });
      
      acc.push(cumulativePoint);
      return acc;
    }, [] as { [key: string]: any }[]);

    console.log('Processed cumulative chart data:', cumulativeData);
    return cumulativeData;
  }, [chartData]);

  const programOptions = useMemo(() => {
    if (!programsData?.Program) return [];
    
    const options = programsData.Program
      .map((program) => ({
        id: program.id,
        name: program.title,
        applicationStart: new Date(program.applicationStart),
      }))
      .sort((a, b) => b.applicationStart.getTime() - a.applicationStart.getTime())
      .map(({ id, name }) => ({ id, name }));
    console.log('Program options:', options);
    return options;
  }, [programsData]);

  const handleProgramChange = useCallback((selectedTags: { id: number; name: string }[]) => {
    console.log('Selected programs changed:', selectedTags);
    setSelectedPrograms(selectedTags);
  }, []);

  // Move rendering logic here
  const renderCharts = () => {
    if (selectedPrograms.length > 0 && chartData.length > 0 && cumulativeChartData.length > 0) {
      return (
        <div className="space-y-8">
          {/* Cumulative Enrollments Chart */}
          <div className="bg-white p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('cumulative_enrollments')}</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={cumulativeChartData as ChartDataPoint[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#333"
                  allowDataOverflow={false}
                  allowDecimals={true}
                  allowDuplicatedCategory={true}
                  hide={false}
                  mirror={false}
                  reversed={false}
                  tickCount={5}
                  xAxisId={0}
                />
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
          {/* Daily Enrollments Chart */}
          <div className="bg-white p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('daily_enrollments')}</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData as ChartDataPoint[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#333"
                  allowDataOverflow={false}
                  allowDecimals={true}
                  allowDuplicatedCategory={true}
                  hide={false}
                  mirror={false}
                  reversed={false}
                  tickCount={5}
                  xAxisId={0}
                />
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
      );
    }
    return <div className="mt-4 text-gray-300">{t('no_data_available')}</div>;
  };

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
                key={key}
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
            {renderCharts()}
          </div>
        )}
      </div>
    </Page>
  );
};

const WrappedStatisticsContent: FC = () => (
  <ErrorBoundary>
    <StatisticsContent />
  </ErrorBoundary>
);

export default WrappedStatisticsContent;
