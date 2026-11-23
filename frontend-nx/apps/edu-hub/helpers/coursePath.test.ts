import { coursePath, courseSegment, courseUrl, manageCoursePath } from './coursePath';
import { ProgramType } from '../types/enums';

describe('coursePath', () => {
  describe('courseSegment', () => {
    it('maps each program type to its own segment', () => {
      expect(courseSegment(ProgramType.COURSES)).toBe('course');
      expect(courseSegment(ProgramType.EVENTS)).toBe('event');
      expect(courseSegment(ProgramType.DEGREES)).toBe('degree');
    });

    // Call sites without Program.type loaded must still produce a usable link;
    // /course/:id redirects on to the right segment.
    it('falls back to course when the type is missing or unknown', () => {
      expect(courseSegment(undefined)).toBe('course');
      expect(courseSegment(null)).toBe('course');
      expect(courseSegment('SOMETHING_ELSE')).toBe('course');
    });
  });

  describe('coursePath', () => {
    it('builds the public path for each program type', () => {
      expect(coursePath(42, ProgramType.COURSES)).toBe('/course/42');
      expect(coursePath(42, ProgramType.EVENTS)).toBe('/event/42');
      expect(coursePath(42, ProgramType.DEGREES)).toBe('/degree/42');
      expect(coursePath(42)).toBe('/course/42');
    });
  });

  describe('manageCoursePath', () => {
    it('builds the organizer path for each program type', () => {
      expect(manageCoursePath(7, ProgramType.COURSES)).toBe('/manage/course/7');
      expect(manageCoursePath(7, ProgramType.EVENTS)).toBe('/manage/event/7');
      expect(manageCoursePath(7, ProgramType.DEGREES)).toBe('/manage/degree/7');
      expect(manageCoursePath(7)).toBe('/manage/course/7');
    });
  });

  describe('courseUrl', () => {
    it('prefixes the base URL without doubling the slash', () => {
      expect(courseUrl(42, ProgramType.EVENTS, 'https://edu.example')).toBe('https://edu.example/event/42');
      expect(courseUrl(42, null, 'https://edu.example')).toBe('https://edu.example/course/42');
    });
  });
});
