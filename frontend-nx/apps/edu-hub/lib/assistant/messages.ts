import de from '../../locales/de.json';
import en from '../../locales/en.json';

/**
 * The messages the Assistant's endpoints return with an error code, in the asker's locale. They
 * live in the locale files under `assistant.errors`, so the widget (#2194) can show the same text
 * by code.
 */

export type AssistantErrorCode = keyof typeof en.assistant.errors;

const catalogues = { de: de.assistant.errors, en: en.assistant.errors };

export type Locale = keyof typeof catalogues;

export const toLocale = (value: unknown): Locale => (value === 'en' ? 'en' : 'de');

export const errorMessage = (code: AssistantErrorCode, locale: Locale, params: Record<string, string | number> = {}) =>
  catalogues[locale][code].replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] !== undefined ? String(params[name]) : match
  );
