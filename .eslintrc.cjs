module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: [
    'node_modules/*',
    'public/mockServiceWorker.js',
    'generators/*',
    '**/__tests__/**',
    'src/testing/**',
  ],
  // NOTE: `next/core-web-vitals` (eslint-config-next@16) is a flat-config-only
  // package and crashes ESLint 8's eslintrc loader. We load the underlying
  // @next/eslint-plugin-next directly (eslintrc-compatible) in the overrides.
  extends: ['eslint:recommended'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      settings: {
        react: { version: 'detect' },
        'import/resolver': {
          typescript: {},
        },
      },
      env: {
        browser: true,
        node: true,
        es6: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:prettier/recommended',
        'plugin:testing-library/react',
        'plugin:jest-dom/recommended',
        'plugin:tailwindcss/recommended',
        'plugin:vitest/legacy-recommended',
      ],
      rules: {
        'import/no-restricted-paths': [
          'error',
          {
            zones: [
              // disables cross-feature imports:
              // eg. src/features/discussions should not import from src/features/comments, etc.
              {
                target: './src/features/auth',
                from: './src/features',
                except: ['./auth'],
              },
              {
                target: './src/features/comments',
                from: './src/features',
                except: ['./comments'],
              },
              {
                target: './src/features/discussions',
                from: './src/features',
                except: ['./discussions'],
              },
              {
                target: './src/features/teams',
                from: './src/features',
                except: ['./teams'],
              },
              {
                target: './src/features/users',
                from: './src/features',
                except: ['./users'],
              },
              // enforce unidirectional codebase:

              // e.g. src/app can import from src/features but not the other way around
              {
                target: './src/features',
                from: './src/app',
              },

              // e.g src/features and src/app can import from these shared modules but not the other way around
              {
                target: [
                  './src/components',
                  './src/hooks',
                  './src/lib',
                  './src/types',
                  './src/utils',
                ],
                from: ['./src/features', './src/app'],
              },
            ],
          },
        ],
        'import/no-cycle': 'error',
        'linebreak-style': ['error', 'unix'],
        'react/prop-types': 'off',
        'import/order': [
          'error',
          {
            groups: [
              'builtin',
              'external',
              'internal',
              'parent',
              'sibling',
              'index',
              'object',
            ],
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
          },
        ],
        'import/default': 'off',
        'import/no-named-as-default-member': 'off',
        'import/no-named-as-default': 'off',
        'react/react-in-jsx-scope': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        '@typescript-eslint/no-unused-vars': ['error'],
        '@typescript-eslint/explicit-function-return-type': ['off'],
        '@typescript-eslint/explicit-module-boundary-types': ['off'],
        '@typescript-eslint/no-empty-function': ['off'],
        '@typescript-eslint/no-explicit-any': ['off'],
        'tailwindcss/no-custom-classname': 'off',
        'tailwindcss/classnames-order': 'off',
        // Sacred Editorial — interdit la palette Tailwind brute (cassée en dark /
        // off-brand). Utiliser les tokens sémantiques : text-foreground,
        // text-muted-foreground, text-primary, bg-card, bg-success|warning|info|
        // destructive|accent/…. Exceptions documentées dans l'override ci-dessous.
        'no-restricted-syntax': [
          'error',
          {
            selector:
              "Literal[value=/(text|bg|border|ring|from|to|via|fill|stroke|divide|placeholder|decoration|shadow|outline|caret|accent)-(gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|[1-9]00|950)/]",
            message:
              'Palette Tailwind brute interdite (Sacred Editorial). Utilise un token sémantique : text-foreground/-muted-foreground, text-primary, bg-card, bg-success|warning|info|destructive|accent/…',
          },
        ],
        // Formatage géré par Prettier CLI (`yarn format`), pas par ESLint :
        // l'intégration plugin:prettier produisait des milliers de faux
        // positifs de drift. eslint-config-prettier (via le preset) désactive
        // toujours les règles de style en conflit avec Prettier.
        'prettier/prettier': 'off',
      },
    },
    {
      // Exceptions à la règle anti-palette : la landing a une direction
      // artistique « dark forcé » avec surfaces fixes intentionnelles (badges
      // de store sur fond blanc) ; les stories et la page démo Sentry ne sont
      // pas du code applicatif livré.
      files: [
        'src/features/landing/**/*',
        '**/*.stories.tsx',
        'src/app/sentry-example-page/**/*',
      ],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
    {
      plugins: ['check-file'],
      files: ['src/**/*'],
      rules: {
        'check-file/filename-naming-convention': [
          'error',
          {
            '**/*.{ts,tsx}': 'KEBAB_CASE',
          },
          {
            ignoreMiddleExtensions: true,
          },
        ],
        'check-file/folder-naming-convention': [
          'error',
          {
            '!(src/app)/**/*': 'KEBAB_CASE',
            '!(**/__tests__)/**/*': 'KEBAB_CASE',
          },
        ],
      },
    },
  ],
};
