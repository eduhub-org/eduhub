import React, { FC, useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslations, useLocale } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MdExpandMore, MdExpandLess } from 'react-icons/md';

import { GET_FAQS_BY_COLLECTION_AND_LANG } from '../../queries/faqQueries';
import { GetFaqsByCollectionAndLang } from '../../queries/__generated__/GetFaqsByCollectionAndLang';
import Loading from './Loading';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  locale: string;
}

interface FaqSectionProps {
  collection?: string;
  className?: string;
}

interface FaqItemProps {
  faq: FaqItem;
}

const FaqItemComponent: FC<FaqItemProps> = ({ faq }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border border-border-primary rounded-lg mb-4">
      <button
        className="w-full p-4 text-left flex justify-between items-center hover:bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-50"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
        <h3 className="text-lg font-medium text-label-primary pr-4">{faq.question}</h3>
        {isExpanded ? (
          <MdExpandLess className="text-label-secondary flex-shrink-0" size={24} />
        ) : (
          <MdExpandMore className="text-label-secondary flex-shrink-0" size={24} />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border-primary">
          <div className="pt-4 text-label-primary leading-relaxed">
            <ReactMarkdown 
              className="prose max-w-none prose-headings:text-label-primary prose-p:text-label-primary prose-li:text-label-primary prose-strong:text-label-primary prose-a:text-brand"
              remarkPlugins={[remarkGfm]}
            >
              {faq.answer}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Accordion of the FAQ entries in one FaqCollection, in the active locale
 * (falling back to the English translation). Shared between edu-hub's
 * homepage section and StuJo's /faq page, so every colour goes through the
 * `--eduhub-*` design tokens rather than literal greys — StuJo redefines
 * those tokens light in its globals.css (AGENTS.md rule 10).
 */
const FaqSection: FC<FaqSectionProps> = ({ collection = 'default', className = '' }) => {
  const t = useTranslations('common');
  const locale = useLocale();

  const { data, loading, error } = useQuery<GetFaqsByCollectionAndLang>(GET_FAQS_BY_COLLECTION_AND_LANG, {
    variables: {
      collection,
      lang: (locale || 'de').toUpperCase(),
    },
    errorPolicy: 'all',
  });

  const faqs = useMemo(() => {
    if (!data || !data.FaqCollection || data.FaqCollection.length === 0) {
      return [];
    }

    const faqCollection = data.FaqCollection[0];
    return faqCollection.Faqs.map((faq) => {
      // Use requested language translation or fallback to English
      const translation = faq.FaqTranslations.length > 0 ? faq.FaqTranslations[0] : faq.FaqTranslations_fallback[0];

      if (!translation) {
        return null;
      }

      return {
        id: faq.id,
        question: translation.question,
        answer: translation.answer,
        locale: translation.lang,
      };
    }).filter(Boolean) as FaqItem[];
  }, [data]);

  if (loading) {
    return (
      <div className={`faq-section ${className}`}>
        <Loading />
      </div>
    );
  }

  if (error) {
    console.error('Error loading FAQs:', error);
    return (
      <div className={`faq-section ${className}`}>
        <div className="text-center py-8">
          <p className="text-label-secondary">{t('faq.error_loading')}</p>
        </div>
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <div className={`faq-section ${className}`}>
        <div className="text-center py-8">
          <p className="text-label-secondary">{t('faq.no_faqs_available')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`faq-section ${className}`}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-label-primary">{t('faq.title')}</h2>
        <div className="space-y-2">
          {faqs.map((faq) => (
            <FaqItemComponent key={faq.id} faq={faq} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FaqSection;
