#!/usr/bin/env node
/**
 * CodeGuard Agents Configuration
 * 
 * Individual agent settings, thresholds, and integration points
 */

module.exports = {
  // Global settings
  projectRoot: process.cwd(),
  outputFormat: process.env.CODEGUARD_OUTPUT || 'cli', // 'cli', 'json', 'report'
  verbose: process.env.CODEGUARD_VERBOSE === 'true',
  
  // Agent-specific configurations
  agents: {
    typescript: {
      enabled: true,
      autofix: true,
      strictMode: false,
      ignorePatterns: ['node_modules/', 'dist/', '.next/'],
      thresholds: {
        maxErrors: 0,
        maxWarnings: 10
      }
    },
    
    security: {
      enabled: true,
      autofix: false,
      severity: 'medium', // 'low', 'medium', 'high', 'critical'
      scanDependencies: true,
      owaspTop10: true,
      ignorePatterns: ['test/', '*.test.js', '*.spec.js']
    },
    
    accessibility: {
      enabled: true,
      autofix: true,
      wcagLevel: 'AA', // 'A', 'AA', 'AAA'
      scanComponents: true,
      generateReports: true
    },
    
    performance: {
      enabled: true,
      autofix: false,
      bundleAnalysis: true,
      memoryLeaks: true,
      thresholds: {
        bundleSize: 500, // KB
        loadTime: 3000 // ms
      }
    },
    
    testing: {
      enabled: true,
      autofix: false,
      coverageThreshold: 80, // percentage
      requireTests: ['components/', 'lib/', 'utils/'],
      testFrameworks: ['vitest', 'jest']
    },
    
    dependency: {
      enabled: true,
      autofix: false,
      checkVulnerabilities: true,
      checkOutdated: true,
      autoUpdate: 'minor', // 'none', 'patch', 'minor', 'major'
    },
    
    codeQuality: {
      enabled: true,
      autofix: true,
      linters: ['biome', 'eslint'],
      formatters: ['prettier'],
      enforceStyles: true
    },
    
    deployment: {
      enabled: true,
      autofix: false,
      platforms: ['vercel'],
      validateConfigs: true,
      checkEnvironment: true
    }
  },
  
  // Integration settings
  integrations: {
    preCommit: {
      enabled: false,
      agents: ['typescript', 'security', 'code-quality']
    },
    
    ci: {
      enabled: true,
      agents: ['typescript', 'security', 'testing', 'deployment'],
      failOnError: true
    },
    
    watch: {
      enabled: false,
      agents: ['typescript', 'accessibility'],
      debounceMs: 500
    }
  },
  
  // Reporting configuration
  reporting: {
    enabled: true,
    outputDir: './codeguard-reports',
    formats: ['json', 'html'],
    includeMetrics: true,
    includeFixes: true
  }
};