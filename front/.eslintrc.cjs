module.exports = {
  root: true,
  ignorePatterns: [
    '.nuxt',
    '.output',
    'dist',
    'src-tauri/**',
    'playwright-report/**',
    'test-results/**',
    'node_modules/**'
  ],
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential'
  ],
  plugins: [
    'vue'
  ],
  rules: {
    // Quality Gate: Limites de tamanho de arquivos, funções e identação
    'max-lines': ['error', { max: 350, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
    'max-depth': ['error', 4],
    'max-len': ['error', { code: 160, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreRegExpLiterals: true }],

    // Regras Vue
    'vue/multi-word-component-names': 'off',

    // Desabilitar checagens restritivas para auto-imports do Nuxt
    'no-undef': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  },
  overrides: [
    {
      // Em arquivos .vue, classes Tailwind longas são comuns nos templates HTML
      files: ['*.vue'],
      rules: {
        'max-len': 'off'
      }
    },
    {
      // Componentes gráficos complexos e páginas ricas em templates/modais
      files: ['app/components/**/*.vue', 'app/pages/**/*.vue'],
      rules: {
        'max-lines': ['warn', { max: 600, skipBlankLines: true, skipComments: true }],
        'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true }]
      }
    },
    {
      // Composables, stores, adaptadores e utilitários
      files: [
        'app/composables/**/*.ts',
        'app/composables/**/*.js',
        'app/stores/**/*.ts',
        'app/stores/**/*.js',
        'app/utils/**/*.ts',
        'app/utils/**/*.js',
        'app/adapters/**/*.ts',
        'app/adapters/**/*.js'
      ],
      rules: {
        'max-lines-per-function': ['warn', { max: 800, skipBlankLines: true, skipComments: true }],
        'max-lines': ['warn', { max: 800, skipBlankLines: true, skipComments: true }],
        'max-depth': ['warn', 6]
      }
    },
    {
      // Interfaces e arquivos de definição
      files: ['app/interfaces/**/*.ts', 'app/**/*.d.ts'],
      rules: {
        'no-unused-vars': 'off'
      }
    },
    {
      // Arquivos de testes e scripts utilitários
      files: ['tests/**/*.ts', 'tests/**/*.js', 'scripts/**/*.js'],
      rules: {
        'max-lines-per-function': 'off',
        'max-lines': 'off',
        'no-unused-vars': 'off'
      }
    }
  ]
};
