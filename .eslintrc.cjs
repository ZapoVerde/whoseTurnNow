module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // This is the most important change. It turns off the rule that was
    // causing the flood of "Unexpected any" errors, matching your old setup.
    '@typescript-eslint/no-explicit-any': 'off',

    // This restores the smart "unused variable" rule from your old config.
    // You can now use an underscore `_` to ignore unused variables.
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ],

    // This is a standard rule for Vite projects.
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}