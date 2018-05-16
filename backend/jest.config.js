module.exports = {
  displayName: 'server',
  testEnvironment: 'node',
  coverageDirectory: './coverage',
  transform: { '.*': '<rootDir>/node_modules/babel-jest' },
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!.eslintrc.js',
    '!.prettierrc.js',
  ],
  coverageThreshold: {
    global: {
      statements: 1,
      branches: 0,
      functions: 1,
      lines: 1,
    },
  },
};
