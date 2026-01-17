import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  // Entry points - files that are definitely used
  entry: [
    // Next.js App Router entry points
    'src/app/**/{page,layout,loading,error,not-found,global-error}.{ts,tsx}',
    'src/app/**/route.ts', // API routes
    'src/middleware.ts', // Next.js middleware

    // Convex backend functions
    'convex/**/*.ts',
    '!convex/_generated/**', // Exclude generated files

    // Scripts and tools
    'scripts/**/*.ts',

    // Configuration files
    'next.config.ts',
    'tailwind.config.ts',
    'jest.config.ts',
    'playwright.config.ts',
  ],

  // Project files to analyze
  project: [
    'src/**/*.{ts,tsx}',
    'convex/**/*.ts',
    '!convex/_generated/**',
    'tests/**/*.{ts,tsx}',
    'scripts/**/*.ts',
  ],

  // Files and patterns to ignore
  ignore: [
    // Generated files
    'convex/_generated/**',
    '.next/**',
    'node_modules/**',

    // Asset files
    'src/app/globals.css',
    'public/**',

    // Configuration files that might have unused exports
    'tailwind.config.ts',
    'next.config.ts',
    'jest.config.ts',
    'jest.setup.ts',
    'playwright.config.ts',

    // Test utilities that might have unused exports
    'tests/test-utils.tsx',

    // Documentation and markdown files
    '**/*.md',
    'docs/**',

    // Environment and config files
    '.env*',
    'vercel.json',
    'tsconfig.json',
    'package.json',
  ],

  // Ignore specific patterns for dependencies
  ignoreDependencies: [
    // Next.js dependencies that are used implicitly
    'next',
    'react',
    'react-dom',

    // TypeScript and build tools
    'typescript',
    '@types/node',
    '@types/react',
    '@types/react-dom',

    // ESLint and Prettier (used in scripts)
    'eslint',
    'prettier',

    // Husky and lint-staged (used in git hooks)
    'husky',
    'lint-staged',

    // Testing frameworks
    'jest',
    '@testing-library/jest-dom',
    'playwright',

    // Build and development tools
    'autoprefixer',
    'postcss',
    'tailwindcss',
  ],

  // Plugin configurations
  next: {
    // Next.js specific configuration
    entry: [
      'src/app/**/page.{ts,tsx}',
      'src/app/**/layout.{ts,tsx}',
      'src/app/**/loading.{ts,tsx}',
      'src/app/**/error.{ts,tsx}',
      'src/app/**/not-found.{ts,tsx}',
      'src/app/**/global-error.{ts,tsx}',
      'src/app/**/route.ts',
      'src/middleware.ts',
    ],
  },

  // TypeScript configuration
  typescript: {
    // Include TypeScript-specific analysis
    entry: ['src/**/*.{ts,tsx}', 'convex/**/*.ts'],
  },

  // Jest configuration
  jest: {
    entry: ['jest.config.ts', 'jest.setup.ts', 'tests/**/*.{test,spec}.{ts,tsx}'],
  },

  // Playwright configuration
  playwright: {
    entry: ['playwright.config.ts', 'tests/e2e/**/*.spec.ts'],
  },

  // Workspace configuration for monorepo-like structure
  workspaces: {
    // Main application
    '.': {
      entry: [
        'src/app/**/{page,layout,loading,error,not-found,global-error}.{ts,tsx}',
        'src/app/**/route.ts',
        'src/middleware.ts',
      ],
      project: ['src/**/*.{ts,tsx}'],
    },

    // Convex backend
    convex: {
      entry: ['convex/**/*.ts', '!convex/_generated/**'],
      project: ['convex/**/*.ts', '!convex/_generated/**'],
    },
  },

  // Rules for specific file types
  rules: {
    // Allow unused exports in certain files
    files: {
      // Configuration files can have unused exports
      '**/*.config.{ts,js}': {
        unusedExports: 'off',
      },

      // Type definition files can have unused exports
      '**/*.d.ts': {
        unusedExports: 'off',
      },

      // Test utilities can have unused exports
      'tests/test-utils.tsx': {
        unusedExports: 'off',
      },

      // API routes might have unused exports (for different HTTP methods)
      'src/app/**/route.ts': {
        unusedExports: 'off',
      },
    },
  },

  // Include specific patterns
  include: [
    // Include all TypeScript and TSX files
    '**/*.{ts,tsx}',

    // Include JavaScript files in config
    '**/*.config.js',
  ],

  // Exclude specific patterns
  exclude: [
    // Exclude build outputs
    '.next/**',
    'dist/**',
    'build/**',

    // Exclude dependencies
    'node_modules/**',

    // Exclude generated files
    'convex/_generated/**',

    // Exclude documentation
    '**/*.md',
    'docs/**',
  ],
}

export default config
