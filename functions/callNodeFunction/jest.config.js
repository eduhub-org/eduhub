export default {
  testEnvironment: 'node',
  transform: {},
  testTimeout: 10000,
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'sendEnrollmentEmail/**/*.js',
    'sendSessionReminders/**/*.js',
    '!**/node_modules/**',
    '!**/*.test.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
}; 