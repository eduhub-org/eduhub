import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './apps/stujo',
});

const customJestConfig = {
  displayName: 'stujo',
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['<rootDir>/**/*.{spec,test}.{js,jsx,ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/stujo',
};

export default createJestConfig(customJestConfig);
