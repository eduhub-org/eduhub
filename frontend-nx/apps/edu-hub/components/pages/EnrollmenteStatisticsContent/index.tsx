import { FC, useState, useMemo } from 'react';
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

const EnrollmentStatisticsContent: FC = () => {
  const { t } = useTranslation('enrollmentStatistics');
  const [selectedPrograms, setSelectedPrograms] = useState<{ id: number; name: string }[]>([]);
  
  const { data: programsData, loading: programsLoading } = useRoleQuery<ProgramList>(PROGRAM_LIST);
  
  const { data, loading, error } = useRoleQuery<MultiProgramEnrollments>(MULTI_PROGRAM_ENROLLMENTS, {
    variables: { programIds: selectedPrograms.map(program => program.id) },
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    const allDates = new Set<string>();
    data.Program.forEach(program => {
      program.Courses.forEach(course => {
        course.CourseEnrollments.forEach(enrollment => {
          allDates.add(new Date(enrollment.created_at).toISOString().split('T')[0]);
        });
      });
    });

    return Array.from(allDates).sort().map(date => {
      const dataPoint: { [key: string]: any } = { date };
      data.Program.forEach(program => {
        const count = program.Courses.reduce((total, course) => {
          return total + course.CourseEnrollments.filter(enrollment => 
            new Date(enrollment.created_at).toISOString().split('T')[0] === date
          ).length;
        }, 0);
        dataPoint[program.title] = count;
      });
      return dataPoint;
    });
  }, [data]);

  const handleProgramChange = (selectedTags: { id: number; name: string }[]) => {
    setSelectedPrograms(selectedTags);
  };

  const programOptions = programsData?.Program.map(program => ({
    id: program.id,
    name: program.title
  })) || [];

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
              <div className="bg-white p-4 rounded-lg">
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
                        stroke={`hsl(${index * 137.5 % 360}, 70%, 50%)`}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
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

export default EnrollmentStatisticsContent;