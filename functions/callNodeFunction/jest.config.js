export default {
  testEnvironment: '<rootDir>/jest/environment.js',
  transform: {},
  moduleNameMapper: {
    '^sanitize-html$': '<rootDir>/jest/sanitizeHtml.js',
  },
  testTimeout: 10000,
  roots: ['<rootDir>', '<rootDir>/../sendMail'],
  // Tests live in __tests__/ next to the code: <handler>/__tests__,
  // lib/__tests__, and the root __tests__ for the dispatcher only.
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'sendEnrollmentEmail/**/*.js',
    'sendSessionReminders/**/*.js',
    '!**/node_modules/**',
    '!**/*.test.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
