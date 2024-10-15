module.exports = {
    // Specifies the ESLint parser
    parser: '@babel/eslint-parser',
  
    // Specifies the ESLint parser options
    parserOptions: {
      ecmaVersion: 2023, // Allows for the parsing of modern ECMAScript features
      sourceType: 'module', // Allows for the use of imports
      ecmaFeatures: {
        jsx: false, // Disable JSX since this is a Node.js project
      },
      requireConfigFile: false, // Allows ESLint to parse without a Babel config
    },
  
    // Specifies the environments
    env: {
      node: true, // Node.js global variables and Node.js scoping
      es6: true, // Enables ES6 features
      commonjs: true, // CommonJS global variables and CommonJS scoping
      jest: true, // Jest global variables for testing
    },
  
    // Extends predefined ESLint configurations
    extends: [
      'eslint:recommended', // Uses the recommended rules from ESLint
      'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
    ],
  
    // Specifies the plugins
    plugins: [
      'prettier', // Integrates Prettier for code formatting
      'import', // Helps validate proper imports
    ],
  
    // Customizes the rules
    rules: {
      // Enforce Prettier's code formatting rules
      'prettier/prettier': 'error',
  
      // Possible Errors
      'no-console': 'warn', // Warns when console statements are used
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warns about unused variables but ignores variables starting with _
  
      // Best Practices
      'eqeqeq': ['error', 'always'], // Enforces the use of === and !==
      'curly': ['error', 'all'], // Enforces consistent brace style for all control statements
      'consistent-return': 'error', // Requires return statements to either always or never specify values
  
      // Variables
      'no-var': 'error', // Requires let or const instead of var
      'prefer-const': ['error', { destructuring: 'all' }], // Suggests using const when variables are not reassigned
  
      // Stylistic Issues
      'indent': ['error', 2, { SwitchCase: 1 }], // Enforces 2-space indentation
      'quotes': ['error', 'single'], // Enforces the use of single quotes
      'semi': ['error', 'always'], // Requires semicolons
      'comma-dangle': ['error', 'only-multiline'], // Requires or disallows trailing commas
  
      // Import Rules
      'import/order': [
        'error',
        {
          groups: [['builtin', 'external'], 'internal', ['sibling', 'parent'], 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  
    // Settings for plugins
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  
    // Overrides for specific files
    overrides: [
      {
        files: ['*.test.js', '*.spec.js'],
        env: {
          jest: true,
        },
        rules: {
          'no-unused-expressions': 'off', // Allows unused expressions in test files
        },
      },
    ],
  };
  