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
}

export default config
