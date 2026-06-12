import { FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import InputField from '../../inputs/InputField';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { ONBOARDING_TEXTS, UPDATE_ONBOARDING_TEXT } from '../../../queries/onboardingText';

type OnboardingTextRow = {
  id: number;
  programType: string;
  lang: string;
  text: string;
};

type OnboardingTexts = {
  OnboardingText: OnboardingTextRow[];
};

const PROGRAM_TYPES = ['COURSES', 'EVENTS', 'DEGREES'] as const;

const titleKeyFor = (programType: (typeof PROGRAM_TYPES)[number]) => {
  if (programType === 'COURSES') return 'onboarding.courses_label';
  if (programType === 'EVENTS') return 'onboarding.events_label';
  return 'onboarding.degrees_label';
};

const OnboardingTextsSection: FC = () => {
  const t = useTranslations('manageAppSettings');
  const tCourse = useTranslations('course');
  const tProfile = useTranslations('profile');
  const [previewProgramType, setPreviewProgramType] = useState<string>('COURSES');
  const [previewLanguage, setPreviewLanguage] = useState<string>('DE');

  const { data: onboardingTextsData } = useAdminQuery<OnboardingTexts>(ONBOARDING_TEXTS);

  const getRow = (programType: string, lang: string) =>
    onboardingTextsData?.OnboardingText.find(
      (row) => row.programType === programType && row.lang === lang
    );

  const previewText = getRow(previewProgramType, previewLanguage)?.text ?? '';

  return (
    <div className="mt-8">
      <label className="text-xs uppercase tracking-widest font-medium text-label-secondary mb-4 block">
        {t('onboarding.label')}
      </label>

      {PROGRAM_TYPES.map((programType) => {
        const deText = getRow(programType, 'DE');
        const enText = getRow(programType, 'EN');

        return (
          <div key={programType} className="mb-10">
            {deText && enText ? (
              <div className="max-w-4xl">
                <InputField
                  variant="eduhub"
                  type="markdown"
                  label={t(titleKeyFor(programType))}
                  helpText={t('onboarding.generic_help')}
                  translationTabs={[
                    { lang: 'DE', itemId: deText.id, value: deText.text },
                    { lang: 'EN', itemId: enText.id, value: enText.text },
                  ]}
                  itemId={deText.id}
                  value={deText.text}
                  updateValueMutation={UPDATE_ONBOARDING_TEXT}
                  refetchQueries={['OnboardingTexts']}
                  maxLength={10000}
                  className="h-64"
                />
              </div>
            ) : (
              <div className="text-sm text-label-secondary">{t('loading')}</div>
            )}
          </div>
        );
      })}

      <div>
        <label className="text-xs uppercase tracking-widest font-medium text-label-secondary mb-3 block">
          {t('onboarding.preview')}
        </label>
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <select
            className="rounded border border-border-primary px-3 py-2 bg-fill-primary text-label-primary"
            value={previewProgramType}
            onChange={(e) => setPreviewProgramType(e.target.value)}
          >
            <option value="COURSES">{t('onboarding.courses_label')}</option>
            <option value="EVENTS">{t('onboarding.events_label')}</option>
            <option value="DEGREES">{t('onboarding.degrees_label')}</option>
          </select>
          <select
            className="rounded border border-border-primary px-3 py-2 bg-fill-primary text-label-primary"
            value={previewLanguage}
            onChange={(e) => setPreviewLanguage(e.target.value)}
          >
            <option value="DE">{t('onboarding.text_de')}</option>
            <option value="EN">{t('onboarding.text_en')}</option>
          </select>
        </div>
        <div className="max-w-4xl">
          <div className="bg-fill-secondary rounded-2xl p-6 text-label-primary light border border-border-primary/30 shadow-lg">
            <div className="mb-6 rounded-xl bg-fill-primary p-4">
              <ReactMarkdown
                className="prose max-w-none text-label-primary prose-headings:font-bold prose-headings:text-label-primary prose-p:text-label-secondary prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg"
                remarkPlugins={[remarkGfm]}
              >
                {previewText}
              </ReactMarkdown>
            </div>

            <div className="flex flex-wrap gap-y-3 mb-3">
              <div className="w-full lg:w-1/2 lg:pr-3">
                <label className="block text-sm text-label-primary mb-2">{tProfile('occupation.label')}</label>
                <input
                  type="text"
                  value={tProfile('occupation.UNIVERSITY_STUDENT')}
                  readOnly
                  disabled
                  className="w-full px-3 py-3 rounded bg-fill-primary text-label-primary border border-border-primary opacity-80"
                />
              </div>
              <div className="w-full lg:w-1/2 lg:pl-3">
                <label className="block text-sm text-label-primary mb-2">{tProfile('organization.label_university')}</label>
                <input
                  type="text"
                  value={tProfile('organization.placeholder')}
                  readOnly
                  disabled
                  className="w-full px-3 py-3 rounded bg-fill-primary text-label-primary border border-border-primary opacity-80"
                />
              </div>
            </div>

            <div className="w-full lg:w-1/2 lg:pr-3 mb-2">
              <label className="block text-sm text-label-primary mb-2">{tProfile('matriculation_number')}</label>
              <input
                type="text"
                value=""
                readOnly
                disabled
                className="w-full px-3 py-3 rounded bg-fill-primary text-label-primary border border-border-primary opacity-80"
              />
            </div>

            <div className="flex flex-col lg:flex-row lg:gap-5">
              <button
                type="button"
                disabled
                className="mt-8 block mx-auto lg:mb-5 px-8 py-3 rounded-full bg-error text-label-primary border-2 border-error opacity-100"
              >
                {tCourse('general.reject')}
              </button>
              <button
                type="button"
                disabled
                className="mt-4 lg:mt-8 block mx-auto lg:mb-5 px-8 py-3 rounded-full bg-success text-label-primary border-2 border-success opacity-100"
              >
                {tCourse('general.confirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTextsSection;
