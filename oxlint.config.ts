import { defineConfig } from 'oxlint';
import core from 'ultracite/oxlint/core';
import next from 'ultracite/oxlint/next';
import react from 'ultracite/oxlint/react';
import vitest from 'ultracite/oxlint/vitest';

export default defineConfig({
  extends: [core, react, next, vitest],
  rules: {
    'no-warning-comments': 'off',
    'no-inline-comments': 'off',

    'sort-keys': 'off',
    'func-style': 'off',

    'promise/prefer-await-to-then': 'off',

    'jsx-a11y/control-has-associated-label': 'off',

    'typescript/no-unsafe-assignment': 'off',
    'typescript/no-unsafe-call': 'off',
    'typescript/no-unsafe-member-access': 'off',
    'typescript/strict-boolean-expressions': 'off',
    'typescript/consistent-type-definitions': ['error', 'type'],
    'typescript/no-misused-promises': 'off',
    'typescript/strict-void-return': 'off',
    'typescript/prefer-regexp-exec': 'off',
    'typescript/no-unsafe-type-assertion': 'off',
    'typescript/switch-exhaustiveness-check': 'off',
    'typescript/await-thenable': 'off',
    'typescript/no-confusing-void-expression': 'off',
    'typescript/no-base-to-string': 'off',
    'typescript/no-non-null-assertion': 'off',
    'typescript/no-floating-promises': 'off',

    'unicorn/no-new-array': 'off',
    'unicorn/custom-error-definition': 'off',

    'eslint/no-negated-condition': 'off',
    'unicorn/no-negated-condition': 'off',

    'react/no-unstable-nested-components': 'off',

    'unicorn/filename-case': 'off',

    'jsdoc/require-param': 'error',
    'jsdoc/require-param-description': 'error',
    'jsdoc/require-returns': 'error',
    'jsdoc/require-returns-description': 'error',
  },
  options: {
    reportUnusedDisableDirectives: 'error',
  },
});
