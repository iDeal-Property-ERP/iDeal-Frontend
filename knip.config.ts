import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignore: [
    'src/libs/I18n.ts',
    'src/types/I18n.ts',
    'src/components/LocaleSwitcher.tsx',
    'src/templates/BaseTemplate.tsx',
    // shadcn/ui is a vendored component library: keep primitives available
    // even when not yet consumed by a page.
    'src/components/ui/**',
  ],
  ignoreDependencies: ['@swc/helpers'],
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
