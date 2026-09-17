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
  // next/jest does not translate tsconfig `paths`, so the @eduhub/* alias
  // StuJo uses for shared edu-hub components has to be mapped by hand.
  moduleNameMapper: {
    '^@eduhub/(.*)$': '<rootDir>/../edu-hub/$1',
  },
};

export default createJestConfig(customJestConfig);
