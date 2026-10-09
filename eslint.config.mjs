import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import ts from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
export default defineConfig([
  globalIgnores([
    '.next/**',
    '.next-e2e/**',
    'src/generated/**',
    '.local/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
  ]),
  js.configs.recommended,
  ...ts.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ['src/**/*.tsx'],
    extends: [hooks.configs.flat.recommended, a11y.flatConfigs.recommended],
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
]);
