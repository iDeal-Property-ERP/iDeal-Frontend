import { defineConfig } from 'oxlint';
import core from 'ultracite/oxlint/core';
import next from 'ultracite/oxlint/next';
import react from 'ultracite/oxlint/react';
import vitest from 'ultracite/oxlint/vitest';

export default defineConfig({
  extends: [core, react, next, vitest],
  ignorePatterns: [
    '.agent/**',
    '.agents/**',
    '.claude/**',
    '.codex/**',
    '.continue/**',
    '.cursor/**',
    '.gemini/**',
    '.opencode/**',
    '.pi/**',
    '.roo/**',
    '.windsurf/**',
    'tools/oxlint/anti-slop/**',
    'src/types/**/*.d.ts',
  ],
  jsPlugins: [{ name: 'anti-slop', specifier: './tools/oxlint/anti-slop/index.ts' }],
  rules: {
    'anti-slop/no-chained-type-assertions': 'error',
    'anti-slop/no-conditional-empty-object-spread': 'error',
    'anti-slop/no-known-value-widening': 'error',
    'anti-slop/no-module-mocking': 'error',
    'anti-slop/no-object-parameters': 'error',
    'anti-slop/no-reflect-apply': 'error',
    'anti-slop/no-reflect-get': 'error',
    'anti-slop/no-runtime-typeof': 'error',
    'anti-slop/no-shape-in-symbol-names': 'error',
    'anti-slop/no-unknown-parameters': 'error',
    'anti-slop/no-unknown-returns': 'error',
    'anti-slop/no-unknown-type-aliases': 'error',
    'anti-slop/no-unsafe-dictionary-type': 'error',
    'anti-slop/no-widen-then-assert': 'error',
    'anti-slop/require-safety-comment-for-type-assertion': 'error',

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
