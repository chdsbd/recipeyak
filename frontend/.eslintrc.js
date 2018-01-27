module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
        jsx: true
    }
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  // required to lint *.vue files
  plugins: [
    'html',
    'react',
  ],
  extends: [
      'react-app',
      'standard',
  ],
  'env': {
    'browser': true,
  },
  // add your custom rules here
  rules: {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    'block-spacing': ['warn', 'always'],
    'comma-spacing': ["warn", { "before": false, "after": true }],
    'brace-style': ['warn', '1tbs', { 'allowSingleLine': true }],
    'comma-dangle': ['warn', 'only-multiline'],
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'object-curly-spacing': ['warn', 'always'],
    'no-multiple-empty-lines': ['warn', { 'max': 1, 'maxEOF': 0 }],
    'prefer-const': ['error', {
        'destructuring': 'any',
        'ignoreReadBeforeAssign': false
    }],
  }
}
