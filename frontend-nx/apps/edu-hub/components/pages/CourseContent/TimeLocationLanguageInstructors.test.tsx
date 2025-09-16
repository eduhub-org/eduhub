import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useTranslations } from 'next-intl';
import { TimeLocationLanguageInstructors } from './TimeLocationLanguageInstructors';
import { Course_Course_by_pk } from '../../../queries/__generated__/Course';
import { Weekday_enum, LocationOption_enum } from '../../../__generated__/globalTypes';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ src, alt, width, height, className, style }: any) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        data-testid="mock-image"
      />
    );
  },
}));

// Mock UserCard component
jest.mock('../../common/UserCard', () => ({
  __esModule: true,
  default: function MockUserCard({ user, className }: any) {
    if (!user) {
      return <div data-testid="user-card-error">User is undefined</div>;
    }
    return (
      <div data-testid="user-card" className={className}>
        {user.firstName} {user.lastName}
      </div>
    );
  },
}));

// Mock date time helpers
jest.mock('../../../helpers/dateTimeHelpers', () => ({
  useStartTimeString: () => jest.fn((time: string) => time ? '09:00' : ''),
  useEndTimeString: () => jest.fn((time: string) => time ? '17:00' : ''),
  getWeekdayString: jest.fn((course: any, t: any, short: boolean, withTime: boolean) => 'Monday'),
}));

// Mock image imports
jest.mock('../../../public/images/course/language.svg', () => 'language-icon');
jest.mock('../../../public/images/course/pin.svg', () => 'pin-icon');

describe('TimeLocationLanguageInstructors', () => {
  const mockT = jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'general.ects': 'ECTS',
      'GERMAN': 'German',
      'ENGLISH': 'English',
      'ects.2': '2 ECTS',
      'ects.3': '3 ECTS',
    };
    return translations[key] || key;
  });

  const mockTCourse = jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'general.ects': 'ECTS',
      'ects.2': '2 ECTS',
      'ects.3': '3 ECTS',
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    (useTranslations as jest.Mock).mockImplementation((namespace: string) => {
      if (namespace === 'common') return mockT;
      if (namespace === 'course') return mockTCourse;
      return jest.fn((key: string) => key);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createBaseCourse = (): Course_Course_by_pk => ({
    __typename: 'Course',
    id: 1,
    ects: '3',
    tagline: 'Test Course',
    weekDay: Weekday_enum.MONDAY,
    cost: 'Free',
    published: true,
    applicationEnd: '2024-12-31',
    coverImage: null,
    language: 'GERMAN',
    maxMissedSessions: 2,
    chatLink: null,
    title: 'Test Course Title',
    achievementCertificatePossible: true,
    attendanceCertificatePossible: true,
    programId: 1,
    maxParticipants: 20,
    learningGoals: 'Test learning goals',
    headingDescriptionField1: null,
    contentDescriptionField1: null,
    headingDescriptionField2: null,
    contentDescriptionField2: null,
    externalRegistrationLink: null,
    registrationType: null,
    startTime: '09:00:00',
    endTime: '17:00:00',
    Sessions: [],
    CourseInstructors: [],
    CourseLocations: [
      {
        __typename: 'CourseLocation',
        id: 1,
        defaultSessionAddress: 'Test Address',
        locationOption: LocationOption_enum.OFFLINE,
      },
    ],
    Program: {
      __typename: 'Program',
      id: 1,
      title: 'Test Program',
      shortTitle: 'TP',
      lectureStart: null,
      lectureEnd: null,
      defaultApplicationEnd: null,
      achievementRecordUploadDeadline: null,
      published: true,
      visibilityAchievementCertificate: true,
      visibilityAttendanceCertificate: true,
      type: 'CERTIFICATE' as any,
    },
    CourseGroups: [],
    DegreeCourses: [],
    CourseFundingOrganizations: [],
  });

  describe('Runtime Error Scenarios', () => {
    it('should handle course with undefined Expert in CourseInstructors without crashing', () => {
      const courseWithUndefinedExpert = createBaseCourse();
      courseWithUndefinedExpert.CourseInstructors = [
        {
          __typename: 'CourseInstructor',
          id: 1,
          // Expert is intentionally undefined to test graceful handling
          Expert: undefined as any,
        },
      ];

      // This should not throw an error anymore with the null check fix
      expect(() => {
        render(<TimeLocationLanguageInstructors course={courseWithUndefinedExpert} />);
      }).not.toThrow();
    });

    it('should handle course with null Expert in CourseInstructors', () => {
      const courseWithNullExpert = createBaseCourse();
      courseWithNullExpert.CourseInstructors = [
        {
          __typename: 'CourseInstructor',
          id: 1,
          Expert: null as any,
        },
      ];

      // This should not throw an error anymore with the null check fix
      expect(() => {
        render(<TimeLocationLanguageInstructors course={courseWithNullExpert} />);
      }).not.toThrow();
    });

    it('should handle course with Expert missing User property', () => {
      const courseWithExpertMissingUser = createBaseCourse();
      courseWithExpertMissingUser.CourseInstructors = [
        {
          __typename: 'CourseInstructor',
          id: 1,
          Expert: {
            __typename: 'Expert',
            id: 1,
            description: 'Test expert',
            // User property is missing to test undefined access
            User: undefined as any,
          },
        },
      ];

      // This should not throw because UserCard handles undefined user gracefully
      expect(() => {
        render(<TimeLocationLanguageInstructors course={courseWithExpertMissingUser} />);
      }).not.toThrow();

      // But should show an error indication in the UserCard
      expect(screen.getByTestId('user-card-error')).toBeInTheDocument();
    });

    it('should handle empty CourseInstructors array', () => {
      const courseWithNoInstructors = createBaseCourse();
      courseWithNoInstructors.CourseInstructors = [];

      expect(() => {
        render(<TimeLocationLanguageInstructors course={courseWithNoInstructors} />);
      }).not.toThrow();

      // Should render the course info but no instructor cards
      expect(screen.getByText('ECTS')).toBeInTheDocument();
      expect(screen.queryByTestId('user-card')).not.toBeInTheDocument();
    });
  });

  describe('Success Scenarios', () => {
    it('should render course with valid instructors', () => {
      const courseWithValidInstructors = createBaseCourse();
      courseWithValidInstructors.CourseInstructors = [
        {
          __typename: 'CourseInstructor',
          id: 1,
          Expert: {
            __typename: 'Expert',
            id: 1,
            description: 'Test expert description',
            User: {
              __typename: 'User',
              id: '1',
              firstName: 'John',
              lastName: 'Doe',
              picture: null,
              externalProfile: null,
              email: 'john.doe@example.com',
            },
          },
        },
      ];

      render(<TimeLocationLanguageInstructors course={courseWithValidInstructors} />);

      // Should render course information
      expect(screen.getByText('ECTS')).toBeInTheDocument();
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('German')).toBeInTheDocument();

      // Should render instructor
      expect(screen.getByTestId('user-card')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render multiple instructors', () => {
      const courseWithMultipleInstructors = createBaseCourse();
      courseWithMultipleInstructors.CourseInstructors = [
        {
          __typename: 'CourseInstructor',
          id: 1,
          Expert: {
            __typename: 'Expert',
            id: 1,
            description: 'First expert',
            User: {
              __typename: 'User',
              id: '1',
              firstName: 'John',
              lastName: 'Doe',
              picture: null,
              externalProfile: null,
              email: 'john.doe@example.com',
            },
          },
        },
        {
          __typename: 'CourseInstructor',
          id: 2,
          Expert: {
            __typename: 'Expert',
            id: 2,
            description: 'Second expert',
            User: {
              __typename: 'User',
              id: '2',
              firstName: 'Jane',
              lastName: 'Smith',
              picture: null,
              externalProfile: null,
              email: 'jane.smith@example.com',
            },
          },
        },
      ];

      render(<TimeLocationLanguageInstructors course={courseWithMultipleInstructors} />);

      // Should render both instructors
      const userCards = screen.getAllByTestId('user-card');
      expect(userCards).toHaveLength(2);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should handle course with no weekday', () => {
      const courseWithNoWeekday = createBaseCourse();
      courseWithNoWeekday.weekDay = Weekday_enum.NONE;

      render(<TimeLocationLanguageInstructors course={courseWithNoWeekday} />);

      // Should still render other information
      expect(screen.getByText('ECTS')).toBeInTheDocument();
      expect(screen.getByText('German')).toBeInTheDocument();
    });

    it('should handle ECTS translation fallback', () => {
      const courseWithUnknownEcts = createBaseCourse();
      courseWithUnknownEcts.ects = '4.5';

      render(<TimeLocationLanguageInstructors course={courseWithUnknownEcts} />);

      // Should fallback to original value when translation is not found
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });
  });

  describe('ECTS Translation', () => {
    it('should handle ECTS values with dots', () => {
      const courseWithDecimalEcts = createBaseCourse();
      courseWithDecimalEcts.ects = '2.5';

      render(<TimeLocationLanguageInstructors course={courseWithDecimalEcts} />);

      // Should convert dots to 'dot' in translation key
      expect(mockTCourse).toHaveBeenCalledWith('ects.2dot5');
    });

    it('should handle ECTS values with commas', () => {
      const courseWithCommaEcts = createBaseCourse();
      courseWithCommaEcts.ects = '2,5';

      render(<TimeLocationLanguageInstructors course={courseWithCommaEcts} />);

      // Should convert commas to underscore in translation key
      expect(mockTCourse).toHaveBeenCalledWith('ects.2_5');
    });
  });
});
