import { renderHook } from '@testing-library/react';

import { useProgramTypeTranslations } from '../useProgramTypeTranslations';
import { ProgramType } from '../../types/enums';

// A stand-in message tree for one namespace, resolved by dotted key.
const MESSAGES: Record<string, string> = {
  save: 'Speichern',
  'default_title.other': 'Unbenanntes Angebot',
  'default_title.events': 'Unbenanntes Event',
  'delete.other': 'Angebot „{title}" löschen?',
  'delete.courses': 'Den Kurs „{title}" löschen?',
  'delete.events': 'Das Event „{title}" löschen?',
  'delete.degrees': 'Das Degree „{title}" löschen?',
};

jest.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string, values?: Record<string, unknown>) => {
      const message = MESSAGES[key];
      if (message == null) throw new Error(`missing key: ${key}`);
      return values
        ? message.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`))
        : message;
    };
    t.has = (key: string) => key in MESSAGES;
    return t;
  },
}));

const translator = (programType?: ProgramType | null) =>
  renderHook(() => useProgramTypeTranslations('course', programType)).result.current;

describe('useProgramTypeTranslations', () => {
  it('passes a key with no variants straight through', () => {
    expect(translator(ProgramType.EVENTS)('save')).toBe('Speichern');
  });

  it('prefers the override written for this program type', () => {
    expect(translator(ProgramType.EVENTS)('default_title')).toBe('Unbenanntes Event');
  });

  // The point of the design: a type without its own wording is not a missing key.
  it('falls back to the neutral base when no override exists', () => {
    expect(translator(ProgramType.DEGREES)('default_title')).toBe('Unbenanntes Angebot');
    expect(translator(ProgramType.COURSES)('default_title')).toBe('Unbenanntes Angebot');
  });

  it('treats a missing program type as a course, matching programTypeMessageKey', () => {
    expect(translator(null)('delete', { title: 'X' })).toBe('Den Kurs „X" löschen?');
  });

  // German declines around the noun, so each override is a whole sentence.
  it('keeps placeholders working inside an override', () => {
    expect(translator(ProgramType.EVENTS)('delete', { title: 'KI-Nacht' })).toBe(
      'Das Event „KI-Nacht" löschen?'
    );
  });

  describe('has', () => {
    it('finds a key through either an override or the base', () => {
      const t = translator(ProgramType.DEGREES);
      expect(t.has('default_title')).toBe(true);
      expect(t.has('save')).toBe(true);
      expect(t.has('nope')).toBe(false);
    });
  });
});
