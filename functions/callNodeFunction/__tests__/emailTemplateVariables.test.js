import { jest } from '@jest/globals';

describe('Email Template Variables System', () => {
  let EMAIL_VARIABLES, 
      getVariablesByCategory, 
      getAllVariableKeys, 
      validateTemplate,
      createVariableReplacer,
      createEnrollmentVariableReplacer,
      createSessionVariableReplacer,
      generateVariableDocumentation;

  beforeAll(async () => {
    const module = await import('../emailTemplateVariables.js');
    EMAIL_VARIABLES = module.EMAIL_VARIABLES;
    getVariablesByCategory = module.getVariablesByCategory;
    getAllVariableKeys = module.getAllVariableKeys;
    validateTemplate = module.validateTemplate;
    createVariableReplacer = module.createVariableReplacer;
    createEnrollmentVariableReplacer = module.createEnrollmentVariableReplacer;
    createSessionVariableReplacer = module.createSessionVariableReplacer;
    generateVariableDocumentation = module.generateVariableDocumentation;
  });

  describe('Variable Registry', () => {
    it('should have all expected variable categories', () => {
      expect(EMAIL_VARIABLES).toHaveProperty('USER');
      expect(EMAIL_VARIABLES).toHaveProperty('COURSE');
      expect(EMAIL_VARIABLES).toHaveProperty('ENROLLMENT');
      expect(EMAIL_VARIABLES).toHaveProperty('SESSION');
    });

    it('should have complete metadata for each variable', () => {
      Object.values(EMAIL_VARIABLES).forEach(categoryObj => {
        Object.entries(categoryObj).forEach(([key, metadata]) => {
          expect(metadata).toHaveProperty('description');
          expect(metadata).toHaveProperty('example');
          expect(metadata).toHaveProperty('categories');
          expect(Array.isArray(metadata.categories)).toBe(true);
          expect(metadata.categories.length).toBeGreaterThan(0);
        });
      });
    });

    it('should include all known variables', () => {
      const allKeys = getAllVariableKeys();
      
      // Check that all expected variables are present
      expect(allKeys).toContain('[User:Firstname]');
      expect(allKeys).toContain('[User:LastName]');
      expect(allKeys).toContain('[Enrollment:CourseId--Course:Name]');
      expect(allKeys).toContain('[Course:StartTime]');
      expect(allKeys).toContain('[Session:Title]');
      expect(allKeys).toContain('[Session:ReminderText]');
    });
  });

  describe('Category Filtering', () => {
    it('should filter variables by enrollment category', () => {
      const enrollmentVars = getVariablesByCategory('enrollment');
      const keys = Object.keys(enrollmentVars);
      
      expect(keys).toContain('[User:Firstname]');
      expect(keys).toContain('[Enrollment:CreatedAt]');
      expect(keys).toContain('[Course:StartTime]');
    });

    it('should filter variables by session category', () => {
      const sessionVars = getVariablesByCategory('session');
      const keys = Object.keys(sessionVars);
      
      expect(keys).toContain('[User:Firstname]');
      expect(keys).toContain('[Session:Title]');
      expect(keys).toContain('[Session:Duration]');
      expect(keys).not.toContain('[Course:StartTime]');
    });

    it('should return empty object for unknown category', () => {
      const unknownVars = getVariablesByCategory('unknown');
      expect(Object.keys(unknownVars)).toHaveLength(0);
    });
  });

  describe('Template Validation', () => {
    it('should validate templates with known variables', () => {
      const template = 'Hello [User:Firstname] [User:LastName], welcome to [Enrollment:CourseId--Course:Name]!';
      const result = validateTemplate(template);
      
      expect(result.valid).toBe(true);
      expect(result.unknownVariables).toHaveLength(0);
    });

    it('should detect unknown variables', () => {
      const template = 'Hello [User:Firstname], your [Unknown:Variable] is ready.';
      const result = validateTemplate(template);
      
      expect(result.valid).toBe(false);
      expect(result.unknownVariables).toContain('[Unknown:Variable]');
    });

    it('should handle templates with no variables', () => {
      const template = 'This is a plain text template.';
      const result = validateTemplate(template);
      
      expect(result.valid).toBe(true);
      expect(result.unknownVariables).toHaveLength(0);
    });
  });

  describe('Variable Replacement', () => {
    const mockFormatDate = jest.fn((date) => `formatted-${date}`);

    beforeEach(() => {
      mockFormatDate.mockClear();
    });

    it('should replace user variables', () => {
      const data = {
        user: { firstName: 'John', lastName: 'Doe' }
      };
      
      const replacer = createVariableReplacer(data, mockFormatDate);
      const result = replacer('Hello [User:Firstname] [User:LastName]!');
      
      expect(result).toBe('Hello John Doe!');
    });

    it('should replace course variables', () => {
      const data = {
        course: { 
          title: 'Data Science Course',
          startTime: '2024-01-15',
          endTime: '2024-03-15'
        }
      };
      
      const replacer = createVariableReplacer(data, mockFormatDate);
      const result = replacer('[Enrollment:CourseId--Course:Name] from [Course:StartTime] to [Course:EndTime]');
      
      expect(result).toBe('Data Science Course from formatted-2024-01-15 to formatted-2024-03-15');
      expect(mockFormatDate).toHaveBeenCalledWith('2024-01-15');
      expect(mockFormatDate).toHaveBeenCalledWith('2024-03-15');
    });

    it('should handle missing course times gracefully', () => {
      const data = {
        course: { title: 'Data Science Course' }
      };
      
      const replacer = createVariableReplacer(data, mockFormatDate);
      const result = replacer('[Course:StartTime] to [Course:EndTime]');
      
      expect(result).toBe('TBD to TBD');
      expect(mockFormatDate).not.toHaveBeenCalled();
    });

    it('should replace session variables', () => {
      const data = {
        session: {
          title: 'Introduction Session',
          startDateTime: '2024-01-15 14:00',
          duration: '2 hours',
          reminderText: 'starts tomorrow',
          reminderTime: 'tomorrow'
        }
      };
      
      const replacer = createVariableReplacer(data, mockFormatDate);
      const result = replacer('[Session:Title] [Session:ReminderText] at [Session:StartDateTime]');
      
      expect(result).toBe('Introduction Session starts tomorrow at 2024-01-15 14:00');
    });

    it('should handle enrollment expiration dates', () => {
      const data = {
        enrollment: {
          created_at: '2024-01-10',
          invitationExpirationDate: '2024-01-25'
        }
      };
      
      const replacer = createVariableReplacer(data, mockFormatDate);
      const result = replacer('Applied: [Enrollment:CreatedAt], expires: [Enrollment:ExpirationDate]');
      
      expect(result).toBe('Applied: formatted-2024-01-10, expires: formatted-2024-01-25');
    });

    it('should handle missing expiration date', () => {
      const data = {
        enrollment: { created_at: '2024-01-10' }
      };
      
      const replacer = createVariableReplacer(data, mockFormatDate);
      const result = replacer('Expires: [Enrollment:ExpirationDate]');
      
      expect(result).toBe('Expires: TBD');
    });
  });

  describe('Convenience Functions', () => {
    const mockFormatDate = jest.fn((date) => `formatted-${date}`);

    beforeEach(() => {
      mockFormatDate.mockClear();
    });

    it('should create enrollment variable replacer', () => {
      const enrollmentDetails = {
        User: { firstName: 'John', lastName: 'Doe' },
        Course: { id: 123, title: 'Test Course', startTime: '2024-01-15' },
        created_at: '2024-01-10'
      };
      
      process.env.FRONTEND_URL = 'https://test.example.com';
      
      const replacer = createEnrollmentVariableReplacer(enrollmentDetails, mockFormatDate);
      const result = replacer('Hello [User:Firstname], your course [Enrollment:CourseId--Course:Name] starts [Course:StartTime]. Link: [Enrollment:CourseLink]');
      
      expect(result).toBe('Hello John, your course Test Course starts formatted-2024-01-15. Link: https://test.example.com/course/123');
    });

    it('should create session variable replacer', () => {
      const session = {
        title: 'Session 1',
        Course: { id: 456, title: 'Advanced Course' }
      };
      
      const enrollment = {
        User: { firstName: 'Jane', lastName: 'Smith' }
      };
      
      const sessionData = {
        startDateTime: '2024-01-15 14:00',
        duration: '90 minutes',
        reminderText: 'starts in 1 hour',
        reminderTime: 'in 1 hour'
      };
      
      const replacer = createSessionVariableReplacer(session, enrollment, sessionData);
      const result = replacer('Hello [User:Firstname], [Session:Title] for [Enrollment:CourseId--Course:Name] [Session:ReminderText]');
      
      expect(result).toBe('Hello Jane, Session 1 for Advanced Course starts in 1 hour');
    });
  });

  describe('Documentation Generation', () => {
    it('should generate documentation for all variables', () => {
      const doc = generateVariableDocumentation();
      
      expect(doc).toContain('# Email Template Variables');
      expect(doc).toContain('USER Variables');
      expect(doc).toContain('[User:Firstname]');
      expect(doc).toContain('SESSION Variables');
      expect(doc).toContain('[Session:Title]');
    });

    it('should generate documentation for specific category', () => {
      const doc = generateVariableDocumentation('session');
      
      expect(doc).toContain('Variables available for **session** emails');
      expect(doc).toContain('[Session:Title]');
      expect(doc).toContain('[User:Firstname]'); // User vars are available in session emails
    });
  });

  describe('Edge Cases', () => {
    it('should handle null or undefined text', () => {
      const replacer = createVariableReplacer({}, jest.fn());
      
      expect(replacer(null)).toBeNull();
      expect(replacer(undefined)).toBeUndefined();
      expect(replacer('')).toBe('');
    });

    it('should handle missing data gracefully', () => {
      const replacer = createVariableReplacer({}, jest.fn());
      const result = replacer('Hello [User:Firstname] [User:LastName]!');
      
      expect(result).toBe('Hello  !');
    });

    it('should handle partial data', () => {
      const data = {
        user: { firstName: 'John' } // missing lastName
      };
      
      const replacer = createVariableReplacer(data, jest.fn());
      const result = replacer('Hello [User:Firstname] [User:LastName]!');
      
      expect(result).toBe('Hello John !');
    });
  });
}); 