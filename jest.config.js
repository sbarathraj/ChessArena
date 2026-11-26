module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-url-polyfill/auto$': '<rootDir>/__tests__/__mocks__/urlPolyfillMock.js',
  },
};
