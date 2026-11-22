import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { ProgramType } from '../types/enums';
import { programTypeMessageKey } from '../helpers/programType';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Values = Record<string, any>;

/**
 * Minimal shape of a next-intl translator. This app does not augment
 * IntlMessages, so keys are plain strings.
 */
type Translator = {
  (key: string, values?: Values): string;
  has: (key: string) => boolean;
};

export type ProgramTypeTranslator = Translator;

/**
 * A translator that prefers the wording written for this program type.
 *
 * Resolution is `<key>.<programType>`, then `<key>.other`, then `<key>`:
 *
 *     "save": "Speichern"                      -> no variants, used as is
 *     "default_title": {
 *       "other": "Unbenanntes Angebot",        -> the neutral base
 *       "events": "Unbenanntes Event"          -> override where it reads better
 *     }
 *
 * JSON cannot hold a string and children under one key, which is why the base
 * lives at `other` (as in an ICU `select`) rather than at the key itself. So a
 * string only needs variants where the three types really read differently; the
 * ~90% of keys that never name the thing stay plain keys.
 *
 * The override is a whole string rather than an interpolated noun because German
 * declines around it: "den Kurs" but "das Event", so substituting the noun into
 * one sentence would produce "den Event".
 *
 * The base should be worded neutrally ("Angebot" / "offering"). CONTEXT.md keeps
 * "Offering" out of *code*, but it is the right word in copy — the T&Cs already
 * use it — and a neutral base means a missing override reads generic rather than
 * calling an event a Kurs, which the glossary lists under things to avoid.
 */
export const useProgramTypeTranslations = (
  namespace: string,
  programType?: ProgramType | string | null
): ProgramTypeTranslator => {
  const t = useTranslations(namespace) as unknown as Translator;
  const suffix = programTypeMessageKey(programType as ProgramType);

  return useMemo(() => {
    const translate = ((key: string, values?: Values) => {
      const override = `${key}.${suffix}`;
      if (t.has(override)) return t(override, values);

      const neutral = `${key}.other`;
      if (t.has(neutral)) return t(neutral, values);

      return t(key, values);
    }) as ProgramTypeTranslator;

    translate.has = (key: string) =>
      t.has(`${key}.${suffix}`) || t.has(`${key}.other`) || t.has(key);

    return translate;
  }, [t, suffix]);
};
