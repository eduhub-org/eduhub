import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './apps/edu-hub',
});

const customJestConfig = {
  displayName: 'edu-hub',
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['<rootDir>/**/*.{spec,test}.{js,jsx,ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/edu-hub',
  moduleNameMapper: {
    '^@eduhub/(.*)$': '<rootDir>/$1',
    '^@opencampus/shared-components$': '<rootDir>/components/shared-components/index.ts',
  },
};

export default createJestConfig(customJestConfig);
