import Link from 'next/link';
import { FC } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Points to the privacy policy where a registration collects data (Art. 13 GDPR).
 *
 * A notice, not a checkbox: the policy is information, not something to
 * consent to. Shown under the registration button because a direct
 * registration happens on that click, without a dialog in between.
 */
export const RegistrationPrivacyNotice: FC = () => {
  const t = useTranslations('course');

  return (
    <p className="mt-3 text-xs text-label-secondary leading-relaxed">
      {t.rich('privacy_notice', {
        privacy: (chunks) => (
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-label-primary">
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
};
