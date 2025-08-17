/**
 * Shared build configuration
 */
export const buildConfig = {
  // TypeScript compiler options for packages
  packageTsConfig: {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      lib: ['ES2022'],
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
  },
  
  // Turbo configuration
  turboConfig: {
    pipeline: {
      build: {
        dependsOn: ['^build'],
        outputs: ['dist/**', '.next/**'],
      },
      lint: {
        outputs: [],
      },
      dev: {
        cache: false,
        persistent: true,
      },
      test: {
        outputs: ['coverage/**'],
        dependsOn: ['build'],
      },
      'test:coverage': {
        outputs: ['coverage/**'],
        dependsOn: ['build'],
      },
      'type-check': {
        dependsOn: ['^build'],
        outputs: [],
      },
    },
  },
  
  // Vite/Vitest configuration
  vitestConfig: {
    test: {
      globals: true,
      environment: 'node',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'dist/',
          '.next/',
          '*.config.*',
          '**/*.d.ts',
          '**/*.spec.ts',
          '**/*.test.ts',
        ],
      },
    },
  },
};