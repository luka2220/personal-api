// @ts-expect-error - @hono/eslint-config does not provide types
import hono from '@hono/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  ...hono,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'await-promise': 'off',

      'import/no-unresolved': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: ['dist/', '.wrangler/', 'node_modules/'],
  }
);
