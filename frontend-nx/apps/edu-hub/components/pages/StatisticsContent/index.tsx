import React, { FC, useState, ErrorInfo, ReactNode } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Page } from '../../layout/Page';
import CommonPageHeader from '../../common/CommonPageHeader';
import { ApplicationStatistics } from './statistics/ApplicationStatistics';
import { CourseStatistics } from './statistics/CourseStatistics';
import { SessionStatistics } from './statistics/SessionStatistics';
import { AttendanceStatistics } from './statistics/AttendanceStatistics';
import { CertificateStatistics } from './statistics/CertificateStatistics';
import DropDownSelector from '../../inputs/DropDownSelector';

class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
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

type StatisticType = 'APPLICATIONS' | 'COURSES' | 'SESSIONS' | 'ATTENDANCES' | 'CERTIFICATES';

const StatisticsContent: FC = () => {
  const t = useTranslations('statistics');
  const [selectedStatistic, setSelectedStatistic] = useState<StatisticType>('APPLICATIONS');

  const STATISTIC_TYPES: { value: StatisticType; label: string }[] = [
    { value: 'APPLICATIONS', label: t('select_statistics.options.APPLICATIONS') },
    { value: 'COURSES', label: t('select_statistics.options.COURSES') },
    { value: 'SESSIONS', label: t('select_statistics.options.SESSIONS') },
    { value: 'ATTENDANCES', label: t('select_statistics.options.ATTENDANCES') },
    { value: 'CERTIFICATES', label: t('select_statistics.options.CERTIFICATES') },
  ];

  const renderContent = () => {
    switch (selectedStatistic) {
      case 'APPLICATIONS':
        return <ApplicationStatistics />;
      case 'COURSES':
        return <CourseStatistics />;
      case 'SESSIONS':
        return <SessionStatistics />;
      case 'ATTENDANCES':
        return <AttendanceStatistics />;
      case 'CERTIFICATES':
        return <CertificateStatistics />;
    }
  };

  return (
    <Page>
      <div className="max-w-screen-xl mx-auto mt-20 text-gray-200">
        <CommonPageHeader headline={t('statistics')} />
        <div className="rounded-lg mb-6 pb-4">
          <DropDownSelector
            variant="eduhub"
            label={t('select_statistics.label')}
            value={selectedStatistic}
            options={STATISTIC_TYPES}
            onValueUpdated={(value) => setSelectedStatistic(value as StatisticType)}
            className="text-gray-200"
          />
        </div>
        {renderContent()}
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
