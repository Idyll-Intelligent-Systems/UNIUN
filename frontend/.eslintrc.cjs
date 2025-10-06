module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['node_modules/', '.next/', 'dist/', 'out/', 'e2e/**'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  },
}
