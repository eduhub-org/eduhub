import { FC } from 'react';

import BannerSettingsSection from './BannerSettingsSection';
import CourseGroupOptionsManager from './CourseGroupOptionsManager';
import DefaultCertificateTemplatesSection from './DefaultCertificateTemplatesSection';
import FaqSettingsSection from './FaqSettingsSection';
import OnboardingTextsSection from './OnboardingTextsSection';
import ProjectDocumentationInstructionsSection from './ProjectDocumentationInstructionsSection';
import TimeZoneSection from './TimeZoneSection';

const ManageAppSettingsContent: FC = () => (
  <div className="px-3 mt-32 max-w-screen-xl mx-auto">
    <BannerSettingsSection />
    <CourseGroupOptionsManager />
    <TimeZoneSection />
    <FaqSettingsSection />
    <DefaultCertificateTemplatesSection />
    <ProjectDocumentationInstructionsSection />
    <OnboardingTextsSection />
  </div>
);

export default ManageAppSettingsContent;
