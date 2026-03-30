/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.js'],
  globalSetup: './src/tests/globalSetup.js',
  globalTeardown: './src/tests/globalTeardown.js',
  testTimeout: 30000,
};
