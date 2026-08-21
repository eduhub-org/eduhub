import { jest } from '@jest/globals';

describe('Email Template Variables System', () => {
  let EMAIL_VARIABLES, 
      getVariablesByCategory, 
      getAllVariableKeys, 
      validateTemplate,
      createVariableReplacer,
      createEnrollmentVariableReplacer,
      createSessionVariableReplacer,
      createProjectVariableReplacer,
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
    createProjectVariableReplacer = module.createProjectVariableReplacer;
    generateVariableDocumentation = module.generateVariableDocumentation;
  });

  describe('Variable Registry', () => {
    it('should have all expected variable categories', () => {
      expect(EMAIL_VARIABLES).toHaveProperty('USER');
      expect(EMAIL_VARIABLES).toHaveProperty('COURSE');
      expect(EMAIL_VARIABLES).toHaveProperty('ENROLLMENT');
      expect(EMAIL_VARIABLES).toHaveProperty('SESSION');
      expect(EMAIL_VARIABLES).toHaveProperty('PROJECT');
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
      expect(allKeys).toContain('[User:FirstName]');
      expect(allKeys).toContain('[User:LastName]');
      expect(allKeys).toContain('[Enrollment:CourseId--Course:Name]');
      expect(allKeys).toContain('[Course:StartTime]');
      expect(allKeys).toContain('[Session:Title]');
      expect(allKeys).toContain('[Session:ReminderText]');
      expect(allKeys).toContain('[Enrollment:CertificateLink]');
      expect(allKeys).toContain('[Project:Title]');
      expect(allKeys).toContain('[Project:Link]');
      expect(allKeys).toContain('[Project:ApplicantName]');
      expect(allKeys).toContain('[Project:ReviewComment]');
      expect(allKeys).toContain('[Project:SubmissionDeadline]');
    });
  });

  describe('Category Filtering', () => {
    it('should filter variables by enrollment category', () => {
      const enrollmentVars = getVariablesByCategory('enrollment');
      const keys = Object.keys(enrollmentVars);
      
      expect(keys).toContain('[User:FirstName]');
      expect(keys).toContain('[Enrollment:CreatedAt]');
      expect(keys).toContain('[Course:StartTime]');
    });

    it('should filter variables by session category', () => {
      const sessionVars = getVariablesByCategory('session');
      const keys = Object.keys(sessionVars);
      
      expect(keys).toContain('[User:FirstName]');
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
      const template = 'Hello [User:FirstName] [User:LastName], welcome to [Enrollment:CourseId--Course:Name]!';
      const result = validateTemplate(template);
      
      expect(result.valid).toBe(true);
      expect(result.unknownVariables).toHaveLength(0);
    });

    it('should detect unknown variables', () => {
      const template = 'Hello [User:FirstName], your [Unknown:Variable] is ready.';
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
      const result = replacer('Hello [User:FirstName] [User:LastName]!');
      
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
      const result = replacer('Hello [User:FirstName], your course [Enrollment:CourseId--Course:Name] starts [Course:StartTime]. Link: [Enrollment:CourseLink]');
      
      expect(result).toBe('Hello John, your course Test Course starts formatted-2024-01-15. Link: https://test.example.com/course/123');
    });

    it('should resolve the certificate link, falling back to the course page', () => {
      process.env.FRONTEND_URL = 'https://test.example.com';

      const withCert = createEnrollmentVariableReplacer(
        { User: { firstName: 'Ada' }, Course: { id: 7, title: 'Algo' }, certificateLink: 'https://gcs/cert.pdf' },
        mockFormatDate
      );
      expect(withCert('[Enrollment:CertificateLink]')).toBe('https://gcs/cert.pdf');

      const withoutCert = createEnrollmentVariableReplacer(
        { User: { firstName: 'Ada' }, Course: { id: 7, title: 'Algo' }, certificateLink: null },
        mockFormatDate
      );
      expect(withoutCert('[Enrollment:CertificateLink]')).toBe('https://test.example.com/course/7');
    });

    it('should create a project variable replacer and escape user-controlled values', () => {
      process.env.FRONTEND_URL = 'https://test.example.com';

      const replacer = createProjectVariableReplacer(
        { id: 99, title: '<b>Solar</b> & Co' },
        { firstName: 'Bob' },
        { applicantName: 'Eve <x>' }
      );
      const result = replacer('Hi [User:FirstName], [Project:ApplicantName] joins [Project:Title] at [Project:Link]');

      expect(result).toBe('Hi Bob, Eve &lt;x&gt; joins &lt;b&gt;Solar&lt;/b&gt; &amp; Co at https://test.example.com/project/99');
    });

    it('should render the review comment as a labelled block', () => {
      const replacer = createProjectVariableReplacer(
        { id: 3, title: 'Solar', ratingComment: 'Bitte die Quellen ergänzen.\nDanke!' },
        { firstName: 'Ann' }
      );

      expect(replacer('<p>x</p>[Project:ReviewComment]')).toBe(
        '<p>x</p><p><strong>Kommentar der Kursleitung / Instructor comment:</strong><br>' +
          'Bitte die Quellen ergänzen.<br>Danke!</p>'
      );
    });

    it('should escape a review comment that contains markup', () => {
      const replacer = createProjectVariableReplacer(
        { id: 3, title: 'Solar', ratingComment: '<script>alert(1)</script> & more' },
        {}
      );

      const result = replacer('[Project:ReviewComment]');
      expect(result).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; more');
      expect(result).not.toContain('<script>');
    });

    it('should expand the review comment to nothing when there is none', () => {
      const blank = createProjectVariableReplacer({ id: 3, title: 'Solar', ratingComment: '   ' }, {});
      const missing = createProjectVariableReplacer({ id: 3, title: 'Solar' }, {});

      expect(blank('<p>a</p>[Project:ReviewComment]<p>b</p>')).toBe('<p>a</p><p>b</p>');
      expect(missing('<p>a</p>[Project:ReviewComment]<p>b</p>')).toBe('<p>a</p><p>b</p>');
    });

    it('should render the submission deadline as a labelled block', () => {
      const replacer = createProjectVariableReplacer(
        { id: 3, title: 'Solar', submissionDeadline: '2026-09-04T00:00:00+00:00' },
        { firstName: 'Ann' }
      );

      expect(replacer('<p>x</p>[Project:SubmissionDeadline]')).toBe(
        '<p>x</p><p><strong>Abgabefrist / Submission deadline:</strong> 04.09.2026</p>'
      );
    });

    it('should read the deadline date verbatim, without a time-zone shift', () => {
      const replacer = createProjectVariableReplacer(
        { id: 3, title: 'Solar', submissionDeadline: '2026-01-01' },
        {}
      );

      expect(replacer('[Project:SubmissionDeadline]')).toContain('01.01.2026');
    });

    it('should expand the submission deadline to nothing when there is none', () => {
      const missing = createProjectVariableReplacer({ id: 3, title: 'Solar' }, {});
      const nulled = createProjectVariableReplacer(
        { id: 3, title: 'Solar', submissionDeadline: null },
        {}
      );

      expect(missing('<p>a</p>[Project:SubmissionDeadline]<p>b</p>')).toBe('<p>a</p><p>b</p>');
      expect(nulled('<p>a</p>[Project:SubmissionDeadline]<p>b</p>')).toBe('<p>a</p><p>b</p>');
    });

    it('should not expand placeholders that appear inside the review comment', () => {
      const replacer = createProjectVariableReplacer(
        { id: 7, title: 'RealTitle', ratingComment: 'Compare with [Project:Title]' },
        {}
      );

      expect(replacer('[Project:ReviewComment]')).toContain('Compare with [Project:Title]');
    });

    it('should leave values unescaped for plain-text targets like the subject', () => {
      process.env.FRONTEND_URL = 'https://test.example.com';

      const replacer = createProjectVariableReplacer(
        { id: 99, title: 'Solar & Co' },
        { firstName: "O'Brien" },
        { applicantName: 'Eve & Co' }
      );
      const subject = replacer('New request - [Project:Title] ([Project:ApplicantName], [User:FirstName])', {
        html: false
      });

      expect(subject).toBe("New request - Solar & Co (Eve & Co, O'Brien)");
    });

    it('should still escape values for the html body by default', () => {
      const replacer = createProjectVariableReplacer({ id: 1, title: 'Solar & Co' }, {});

      expect(replacer('<p>[Project:Title]</p>')).toBe('<p>Solar &amp; Co</p>');
      expect(replacer('<p>[Project:Title]</p>', { html: true })).toBe('<p>Solar &amp; Co</p>');
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
      const result = replacer('Hello [User:FirstName], [Session:Title] for [Enrollment:CourseId--Course:Name] [Session:ReminderText]');
      
      expect(result).toBe('Hello Jane, Session 1 for Advanced Course starts in 1 hour');
    });
  });

  describe('Documentation Generation', () => {
    it('should generate documentation for all variables', () => {
      const doc = generateVariableDocumentation();
      
      expect(doc).toContain('# Email Template Variables');
      expect(doc).toContain('USER Variables');
      expect(doc).toContain('[User:FirstName]');
      expect(doc).toContain('SESSION Variables');
      expect(doc).toContain('[Session:Title]');
    });

    it('should generate documentation for specific category', () => {
      const doc = generateVariableDocumentation('session');
      
      expect(doc).toContain('Variables available for **session** emails');
      expect(doc).toContain('[Session:Title]');
      expect(doc).toContain('[User:FirstName]'); // User vars are available in session emails
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
      const result = replacer('Hello [User:FirstName] [User:LastName]!');
      
      expect(result).toBe('Hello  !');
    });

    it('should handle partial data', () => {
      const data = {
        user: { firstName: 'John' } // missing lastName
      };
      
      const replacer = createVariableReplacer(data, jest.fn());
      const result = replacer('Hello [User:FirstName] [User:LastName]!');
      
      expect(result).toBe('Hello John !');
    });
  });
}); 