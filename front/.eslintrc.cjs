module.exports = {
  root: true,
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
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: [
    '@typescript-eslint',
    'vue'
  ],
  rules: {
    // Quality Gate: Limites de tamanho de arquivos, funções e identação
    'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
    'max-depth': ['error', 4],
    'max-len': ['error', { code: 130, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
    
    // Regras Vue
    'vue/max-len': ['error', { code: 130, ignoreHTMLAttributeValues: true, ignoreHTMLText: true }],
    'vue/multi-word-component-names': 'off',
    
    // Desabilitar checagens restritivas que atrapalhem o Nuxt auto-import
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  }
};
