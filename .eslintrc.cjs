module.exports = {
  // https://eslint.org/docs/user-guide/configuring#using-configuration-files-1
  root: true,
  extends: [ 'eslint:recommended', 'plugin:unicorn/recommended', 'plugin:sonarjs/recommended', 'plugin:jsdoc/recommended', 'plugin:n/recommended', 'plugin:import/recommended'],
  plugins: ['unicorn'],
  env: {
    browser: true,
    es2022: true,
  },

  overrides: [
    {
      files: ['scripts/*'],
      env: {
        node: true,
        browser: false
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 2022,
    impliedStrict: true,
    sourceType: 'module'
  },

  rules: {
    'unicorn/filename-case': 'off',
    'n/no-unsupported-features/es-syntax': ['error', {
      'version': '>=16.0.0',
      'ignores': []
  }],
  'n/no-unpublished-import': 'off',
  'jsdoc/require-jsdoc': 'error'
  }
};
