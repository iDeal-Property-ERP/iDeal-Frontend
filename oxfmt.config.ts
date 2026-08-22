import { defineConfig } from 'oxfmt';
import ultracite from 'ultracite/oxfmt';

export default defineConfig({
  extends: [ultracite],
  singleQuote: true,
  ignorePatterns: [
    'migrations/*',
    '*.md',
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
  ],
  sortImports: {
    ignoreCase: true,
    newlinesBetween: false,
    order: 'asc',
  },
  sortTailwindcss: {
    stylesheet: 'src/styles/global.css',
  },
});
