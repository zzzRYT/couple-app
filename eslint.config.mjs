import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactNative from 'eslint-plugin-react-native';
import i18next from 'eslint-plugin-i18next';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', 'design/**', 'specs/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/mobile/src/**/*.{ts,tsx}'],
    plugins: { 'react-native': reactNative },
    rules: { 'react-native/no-unused-styles': 'error' },
  },
  {
    files: ['apps/mobile/src/features/**/*.{ts,tsx}', 'apps/mobile/src/ui/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': ['error', { markupOnly: false }],
      // eslint-plugin-i18next 6.1.5 reports nothing under this flat config, so FR-019 is also enforced by syntax selectors.
      'no-restricted-syntax': ['error',
        { selector: 'JSXText[value=/[A-Za-z가-힣ぁ-ゖァ-ヺ一-鿿]/]', message: 'Display text must come from t() keys (FR-019).' },
        { selector: 'JSXElement > JSXExpressionContainer > Literal[value=/[A-Za-z가-힣ぁ-ゖァ-ヺ一-鿿]/]', message: 'Display text must come from t() keys (FR-019).' },
        { selector: 'JSXElement > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=/[A-Za-z가-힣ぁ-ゖァ-ヺ一-鿿]/]', message: 'Display text must come from t() keys (FR-019).' },
        { selector: 'JSXAttribute[name.name=/^(accessibilityLabel|accessibilityHint|placeholder|title|label|text)$/] > Literal[value=/[A-Za-z가-힣ぁ-ゖァ-ヺ一-鿿]/]', message: 'Display text must come from t() keys (FR-019).' },
      ],
    },
  },
  { files: ['**/*.{js,mjs}'], languageOptions: { globals: { module: 'readonly', require: 'readonly', __dirname: 'readonly', process: 'readonly' } } },
  { files: ['apps/mobile/src/scene/catalog.ts', 'apps/mobile/src/scene/catalogImages.ts', 'apps/mobile/src/theme/fonts.ts', 'apps/mobile/src/ui/CycleLoader.tsx'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  { files: ['**/*.test.{ts,tsx}'], languageOptions: { globals: { it: 'readonly', expect: 'readonly', describe: 'readonly', __dirname: 'readonly' } } },
);
