/**
 * Minimal shape of a next-intl translator scoped to the `manageCourse` namespace.
 * This app does not augment IntlMessages, so keys are plain strings.
 */
type Translator = {
  (key: string): string;
  has: (key: string) => boolean;
};

type CertificateActionResult =
  | {
      error?: string | null;
      messageKey?: string | null;
    }
  | null
  | undefined;

/**
 * Turns the `messageKey` of the `createCertificates` action into an admin-facing message.
 *
 * The cloud function reports a stable messageKey (e.g. DEGREE_REQUIREMENTS_NOT_MET) plus an
 * untranslated `error` detail naming the specifics (which participant, which threshold). The
 * translated message is preferred and the detail appended, so nothing the backend reports is
 * lost. Unknown keys degrade to the raw detail, then to `fallback`.
 *
 * Keys live under `manageCourse.errors.certificates.<MESSAGE_KEY>`; keep them in sync with
 * the message keys raised in functions/callPythonFunction/pythonFunctions/create_certificates.py.
 */
export const certificateActionErrorMessage = (
  result: CertificateActionResult,
  tManageCourse: Translator,
  fallback: string
): string => {
  const messageKey = result?.messageKey?.trim();
  const translationKey = messageKey ? `errors.certificates.${messageKey}` : null;
  const translated =
    translationKey && tManageCourse.has(translationKey) ? tManageCourse(translationKey) : null;
  const detail = result?.error?.trim() || null;

  if (translated && detail) return `${translated} (${detail})`;
  return translated ?? detail ?? fallback;
};
