import { FC, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import BannerSettingsSection from '../ManageAppSettingsContent/BannerSettingsSection';
import CourseGroupOptionsManager from '../ManageAppSettingsContent/CourseGroupOptionsManager';
import DefaultCertificateTemplatesSection from '../ManageAppSettingsContent/DefaultCertificateTemplatesSection';
import FaqSettingsSection from '../ManageAppSettingsContent/FaqSettingsSection';
import OnboardingTextsSection from '../ManageAppSettingsContent/OnboardingTextsSection';
import ProjectDocumentationInstructionsSection from '../ManageAppSettingsContent/ProjectDocumentationInstructionsSection';
import TimeZoneSection from '../ManageAppSettingsContent/TimeZoneSection';

import SettingsGroupAccordion from './SettingsGroupAccordion';
import { SETTINGS_GROUPS, SettingsGroupId } from './config';

/**
 * Which settings sections render inside each group. Bodies only mount when a
 * group is expanded (see SettingsGroupAccordion), so their queries fire lazily.
 * Groups without an entry either navigate to a sub-page (emails) or are
 * locked placeholders (access).
 */
const GROUP_CONTENT: Partial<Record<SettingsGroupId, ReactNode>> = {
  appearance: <BannerSettingsSection />,
  homepage: (
    <>
      <CourseGroupOptionsManager />
      <FaqSettingsSection />
    </>
  ),
  programDefaults: (
    <>
      <DefaultCertificateTemplatesSection />
      <ProjectDocumentationInstructionsSection />
      <OnboardingTextsSection />
    </>
  ),
  system: <TimeZoneSection />,
};

const ManageSettingsContent: FC = () => {
  const t = useTranslations('manageSettings');

  return (
    <div className="px-3 mt-32 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-sm text-gray-400 mt-1 mb-10">{t('subtitle')}</p>

      <div className="space-y-4">
        {SETTINGS_GROUPS.map((group) => (
          <SettingsGroupAccordion key={group.id} group={group}>
            {GROUP_CONTENT[group.id]}
          </SettingsGroupAccordion>
        ))}
      </div>
    </div>
  );
};

export default ManageSettingsContent;
