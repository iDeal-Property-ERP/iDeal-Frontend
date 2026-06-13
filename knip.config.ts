import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignore: ['src/libs/I18n.ts', 'src/types/I18n.ts'],
  ignoreDependencies: ['@swc/helpers', 'react-hook-form', 'vitest-browser-react'],
  ignoreBinaries: [],
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/gu)].join('\n'),
  },
  treatConfigHintsAsErrors: true,
};

export default config;
