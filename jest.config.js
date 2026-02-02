/**
 * Jest Configuration
 */
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/app.js',
    '!src/db/**',
    '!src/config/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
  ],
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
