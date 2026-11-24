import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactNative from 'eslint-plugin-react-native';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.open-next/**', '**/.wrangler/**', '**/next-env.d.ts', 'design/**', 'specs/**'] },
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
    rules: {
      'no-restricted-syntax': ['error',
        { selector: 'JSXText[value=/[A-Za-z가-힣ぁ-ゖァ-ヺ一-鿿]/]', message: 'Display text must come from t() keys (FR-019).' },
        { selector: 'JSXElement > JSXExpressionContainer > Literal[value=/[A-Za-z가-힣ぁ-ゖァ-ヺ一-鿿]/]', message: 'Display text must come from t() keys (FR-019).' },
        { selector: 'JSXElement > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=/[A-Za-z가-힣ぁ-ゖァ-ヺ一-鿿]/]', message: 'Display text must come from t() keys (FR-019).' },
        { selector: 'JSXAttribute[name.name=/^(accessibilityLabel|accessibilityHint|placeholder|title|label|text)$/] > Literal[value=/[A-Za-z가-힣ぁ-ゖァ-ヺ一-鿿]/]', message: 'Display text must come from t() keys (FR-019).' },
      ],
    },
  },
  {
    files: ['apps/mobile/src/{lib,ui,theme}/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ regex: '^(\\.\\./)+features(/|$)', message: 'lib/, ui/ and theme/ sit below features/ and must not import it. Move the shared code down (state, adapters and port types to lib/, components to ui/, colors to theme/), or move the importing code into features/.' }] }],
    },
  },
  { files: ['**/*.{js,mjs}'], languageOptions: { globals: { module: 'readonly', require: 'readonly', __dirname: 'readonly', process: 'readonly' } } },
  { files: ['apps/mobile/src/scene/catalog.ts', 'apps/mobile/src/scene/catalogImages.ts', 'apps/mobile/src/theme/fonts.ts', 'apps/mobile/src/ui/CycleLoader.tsx', 'apps/mobile/src/features/splash/BrandSplash.tsx', 'apps/mobile/src/ui/Wordmark.tsx'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  { files: ['**/*.test.{ts,tsx}'], languageOptions: { globals: { it: 'readonly', expect: 'readonly', describe: 'readonly', __dirname: 'readonly' } } },
);
