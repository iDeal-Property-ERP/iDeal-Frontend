import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignore: [
    'src/libs/I18n.ts',
    'src/types/I18n.ts',
    'src/components/LocaleSwitcher.tsx',
    'src/templates/BaseTemplate.tsx',
  ],
  ignoreDependencies: ['@swc/helpers', 'vitest-browser-react'],
  rules: {
    exports: 'off',
    types: 'off',
  },
  ignoreBinaries: [],
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/gu)].join('\n'),
  },
  treatConfigHintsAsErrors: true,
};

export default config;
