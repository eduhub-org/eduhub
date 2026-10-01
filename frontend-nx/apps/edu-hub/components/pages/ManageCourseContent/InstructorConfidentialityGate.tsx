import { useTranslations } from 'next-intl';
import { FC, ReactNode, useCallback, useState } from 'react';

import { Button } from '../../common/Button';
import Loading from '../../common/Loading';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { useUserId } from '../../../hooks/user';
import { useAppSettings } from '../../../contexts/AppSettingsContext';
import { AuthRoles } from '../../../types/enums';
import {
  ACCEPT_INSTRUCTOR_CONFIDENTIALITY,
  MY_INSTRUCTOR_CONFIDENTIALITY_ACCEPTANCE,
} from '../../../queries/instructorConfidentiality';
import {
  MyInstructorConfidentialityAcceptance,
  MyInstructorConfidentialityAcceptanceVariables,
} from '../../../queries/__generated__/MyInstructorConfidentialityAcceptance';
import {
  AcceptInstructorConfidentiality,
  AcceptInstructorConfidentialityVariables,
} from '../../../queries/__generated__/AcceptInstructorConfidentiality';

/** Bump when the commitment text changes materially: everyone is asked again. */
export const INSTRUCTOR_CONFIDENTIALITY_VERSION = '2026-09';

const COMMITMENT_POINTS = ['access', 'purpose', 'no_disclosure', 'exports', 'incidents', 'duration'] as const;

interface InstructorConfidentialityGateProps {
  children: ReactNode;
}

/**
 * Instructors can read participant data beyond their own courses - the user
 * search needs it to add speakers, co-instructors and participants. So before
 * they work with it here, they commit once to keeping it confidential
 * (GDPR Art. 29, 32(4)). The acceptance is stored per text version as an
 * append-only record (InstructorConfidentialityAcceptance).
 */
export const InstructorConfidentialityGate: FC<InstructorConfidentialityGateProps> = ({ children }) => {
  const t = useTranslations('manageCourse.instructor_confidentiality');
  const userId = useUserId();
  const { operatorName, privacyContactEmail } = useAppSettings();

  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { data, loading, refetch } = useRoleQuery<
    MyInstructorConfidentialityAcceptance,
    MyInstructorConfidentialityAcceptanceVariables
  >(MY_INSTRUCTOR_CONFIDENTIALITY_ACCEPTANCE, {
    variables: { userId: userId ?? '', version: INSTRUCTOR_CONFIDENTIALITY_VERSION },
    skip: !userId,
    context: { role: AuthRoles.instructor },
  });

  const [accept, { loading: accepting }] = useRoleMutation<
    AcceptInstructorConfidentiality,
    AcceptInstructorConfidentialityVariables
  >(ACCEPT_INSTRUCTOR_CONFIDENTIALITY, { context: { role: AuthRoles.instructor } });

  const handleAccept = useCallback(async () => {
    try {
      await accept({ variables: { version: INSTRUCTOR_CONFIDENTIALITY_VERSION } });
    } catch {
      // A second click, or a second tab, hits the unique key; the refetch below
      // then finds the first acceptance, so only a real failure is reported.
    }
    try {
      const result = await refetch();
      if (!result.data?.InstructorConfidentialityAcceptance?.length) {
        setErrorMessage(t('failed'));
      }
    } catch {
      setErrorMessage(t('failed'));
    }
  }, [accept, refetch, t]);

  // Both come from AppSettings (Settings > Operator & privacy) and are optional.
  const operator = operatorName?.trim() || t('operator_generic');
  const baseRecipient = operatorName?.trim()
    ? t('recipient_operator', { operator: operatorName.trim() })
    : t('recipient_generic');
  const recipient = privacyContactEmail?.trim()
    ? t('recipient_contact', { recipient: baseRecipient, email: privacyContactEmail.trim() })
    : baseRecipient;
  const pointValues = { operator, recipient };

  if (!userId || (loading && !data)) {
    return <Loading />;
  }

  if (data?.InstructorConfidentialityAcceptance?.length) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-6 md:mt-12 rounded-lg border border-border-primary bg-bg-secondary p-6 text-label-primary">
      <h2 className="text-2xl font-bold mb-4">{t('title')}</h2>
      <p className="mb-4">{t('intro')}</p>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        {COMMITMENT_POINTS.map((point) => (
          <li key={point}>{t(`points.${point}`, pointValues)}</li>
        ))}
      </ul>
      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          disabled={accepting}
          className="mt-1 h-5 w-5"
        />
        <span>{t('checkbox')}</span>
      </label>
      <Button onClick={handleAccept} disabled={!confirmed || accepting} filled inverted>
        {t('accept')}
      </Button>
      <ErrorMessageDialog open={errorMessage !== ''} errorMessage={errorMessage} onClose={() => setErrorMessage('')} />
    </div>
  );
};
