/**
 * Testing Agent - Comprehensive test quality and coverage analysis
 * 
 * Capabilities:
 * - Test coverage analysis and reporting
 * - Test quality assessment (assertions, edge cases)
 * - Missing test detection and generation
 * - Test performance optimization
 * - Test maintainability analysis
 * - Flaky test detection
 * - Integration test validation
 * - Test file organization analysis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestingAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'Testing';
    this.capabilities = [
      'coverage_analysis',
      'test_quality_assessment',
      'missing_test_detection',
      'test_generation',
      'flaky_test_detection',
      'test_performance_optimization',
      'integration_test_validation',
      'test_organization_analysis'
    ];
    
    this.coverageTargets = {
      statements: 80,
      branches: 75,
      functions: 85,
      lines: 80
    };

    this.testPatterns = {
      frameworks: {
        jest: /describe|it|test|expect/,
        vitest: /describe|it|test|expect|vi\./,
        mocha: /describe|it|should|expect/,
        cypress: /cy\.|describe|it/,
        playwright: /test\(|expect\(/
      },
      antiPatterns: [
        { pattern: /it\.skip|test\.skip|describe\.skip/g, type: 'skipped_tests', severity: 'medium' },
        { pattern: /it\.only|test\.only|describe\.only/g, type: 'focused_tests', severity: 'high' },
        { pattern: /expect\(\)\./g, type: 'empty_expectations', severity: 'high' },
        { pattern: /it\(['"][^'"]*['"],\s*\(\)\s*=>\s*\{\s*\}\)/g, type: 'empty_tests', severity: 'critical' },
        { pattern: /console\.log\(/g, type: 'console_in_tests', severity: 'low' },
        { pattern: /setTimeout|setInterval/g, type: 'timing_dependent', severity: 'medium' },
        { pattern: /Math\.random/g, type: 'non_deterministic', severity: 'high' }
      ],
      qualityIndicators: [
        { pattern: /beforeEach|beforeAll|afterEach|afterAll/g, type: 'setup_teardown', positive: true },
        { pattern: /mock|spy|stub/gi, type: 'mocking_usage', positive: true },
        { pattern: /toThrow|toThrowError/g, type: 'error_testing', positive: true },
        { pattern: /async|await|Promise/g, type: 'async_testing', positive: true }
      ]
    };

    this.testComplexityRules = {
      maxAssertionsPerTest: 5,
      maxNestedDescribe: 3,
      maxTestFileSize: 500, // lines
      maxTestLength: 50,    // lines per test
      minAssertionsPerTest: 1
    };
  }

  async analyze() {
    console.log('🧪 Testing Agent: Comprehensive test analysis starting...');
    
    const results = {
      issues: [],
      metrics: {
        testFiles: 0,
        totalTests: 0,
        coverage: {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0
        },
        qualityScore: 0,
        missingTests: 0,
        flakyTests: 0
      },
      recommendations: [],
      testFramework: null
    };

    // 1. Detect test framework
    results.testFramework = await this.detectTestFramework();
    console.log(`📋 Detected test framework: ${results.testFramework || 'Unknown'}`);

    // 2. Find and analyze test files
    const testFiles = await this.findTestFiles();
    results.metrics.testFiles = testFiles.length;

    if (testFiles.length === 0) {
      results.issues.push({
        type: 'no_tests_found',
        severity: 'critical',
        message: 'No test files found in the project',
        recommendation: 'Create test files and implement testing strategy',
        autoFixable: true,
        fix: {
          type: 'create_basic_test_structure'
        }
      });
      
      console.log('❌ Testing Agent: No test files found');
      return results;
    }

    // 3. Analyze each test file
    let totalTests = 0;
    for (const file of testFiles) {
      const fileIssues = await this.analyzeTestFile(file);
      results.issues.push(...fileIssues);
      totalTests += await this.countTestsInFile(file);
    }
    results.metrics.totalTests = totalTests;

    // 4. Coverage analysis
    const coverageAnalysis = await this.analyzeCoverage();
    results.issues.push(...coverageAnalysis.issues);
    results.metrics.coverage = coverageAnalysis.coverage;

    // 5. Missing test detection
    const missingTestAnalysis = await this.detectMissingTests();
    results.issues.push(...missingTestAnalysis);
    results.metrics.missingTests = missingTestAnalysis.length;

    // 6. Flaky test detection
    const flakyTests = await this.detectFlakyTests();
    results.issues.push(...flakyTests);
    results.metrics.flakyTests = flakyTests.length;

    // 7. Integration test validation
    const integrationIssues = await this.validateIntegrationTests();
    results.issues.push(...integrationIssues);

    // 8. Test performance analysis
    const performanceIssues = await this.analyzeTestPerformance();
    results.issues.push(...performanceIssues);

    // 9. Generate test quality score
    results.metrics.qualityScore = this.calculateTestQualityScore(results);

    // 10. Generate recommendations
    results.recommendations = this.generateTestingRecommendations(results.issues);

    console.log(`✅ Testing Agent: Analyzed ${results.metrics.testFiles} test files with ${results.metrics.totalTests} tests. Quality Score: ${results.metrics.qualityScore}/100`);
    
    return results;
  }

  async detectTestFramework() {
    try {
      const packageJsonPath = path.join(this.engine.projectRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Priority order for framework detection
        const frameworks = ['jest', 'vitest', 'cypress', 'playwright', 'mocha'];
        
        for (const framework of frameworks) {
          if (deps[framework]) {
            return framework;
          }
        }
      }
      
      // Fallback: analyze test file content
      const testFiles = await this.findTestFiles();
      if (testFiles.length > 0) {
        const firstTestContent = fs.readFileSync(testFiles[0], 'utf8');
        
        if (firstTestContent.includes('vi.')) return 'vitest';
        if (firstTestContent.includes('cy.')) return 'cypress';
        if (firstTestContent.includes('test(') && firstTestContent.includes('expect(')) return 'playwright';
        if (firstTestContent.includes('should')) return 'mocha';
        return 'jest'; // Default assumption
      }
    } catch (error) {
      // Ignore errors, return unknown
    }
    
    return null;
  }

  async findTestFiles() {
    const testPatterns = [
      '**/*.test.js',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.js',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/test/**/*.js',
      '**/test/**/*.ts',
      '**/tests/**/*.js',
      '**/tests/**/*.ts',
      '**/__tests__/**/*.js',
      '**/__tests__/**/*.ts'
    ];

    const testFiles = [];
    
    for (const pattern of testPatterns) {
      try {
        const files = execSync(`find . -name "${pattern.replace('**/', '*')}" | grep -v node_modules`, {
          cwd: this.engine.projectRoot,
          encoding: 'utf8'
        }).split('\n').filter(Boolean);
        
        testFiles.push(...files.map(f => path.resolve(this.engine.projectRoot, f)));
      } catch (error) {
        // Ignore find errors for patterns that don't match
      }
    }
    
    return [...new Set(testFiles)]; // Remove duplicates
  }

  async analyzeTestFile(filePath) {
    const issues = [];
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // 1. Check for anti-patterns
    this.testPatterns.antiPatterns.forEach(({ pattern, type, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            type,
            file: filePath,
            code: match,
            severity,
            message: this.getAntiPatternMessage(type),
            recommendation: this.getAntiPatternRecommendation(type),
            autoFixable: this.isAntiPatternAutoFixable(type),
            fix: this.getAntiPatternFix(type)
          });
        });
      }
    });

    // 2. Test complexity analysis
    const complexityIssues = await this.analyzeTestComplexity(content, filePath);
    issues.push(...complexityIssues);

    // 3. Assert test has proper structure
    const structuralIssues = await this.analyzeTestStructure(content, filePath);
    issues.push(...structuralIssues);

    // 4. Check test coverage patterns
    const coverageIssues = await this.analyzeTestCoveragePatterns(content, filePath);
    issues.push(...coverageIssues);

    // 5. Async test analysis
    const asyncIssues = await this.analyzeAsyncTests(content, filePath);
    issues.push(...asyncIssues);

    return issues;
  }

  async analyzeTestComplexity(content, filePath) {
    const issues = [];
    const lines = content.split('\n');
    
    // File size check
    if (lines.length > this.testComplexityRules.maxTestFileSize) {
      issues.push({
        type: 'large_test_file',
        file: filePath,
        lines: lines.length,
        severity: 'medium',
        message: `Test file is too large (${lines.length} lines)`,
        recommendation: 'Split large test files into smaller, focused files',
        autoFixable: false
      });
    }

    // Nested describe blocks
    const describeNesting = this.calculateDescribeNesting(content);
    if (describeNesting > this.testComplexityRules.maxNestedDescribe) {
      issues.push({
        type: 'excessive_describe_nesting',
        file: filePath,
        nesting: describeNesting,
        severity: 'medium',
        message: `Too many nested describe blocks (${describeNesting} levels)`,
        recommendation: 'Reduce nesting or split into separate files',
        autoFixable: false
      });
    }

    // Individual test length analysis
    const tests = this.extractIndividualTests(content);
    tests.forEach((test, index) => {
      const testLines = test.content.split('\n').length;
      if (testLines > this.testComplexityRules.maxTestLength) {
        issues.push({
          type: 'long_test_case',
          file: filePath,
          testName: test.name,
          lines: testLines,
          severity: 'low',
          message: `Test case is too long (${testLines} lines)`,
          recommendation: 'Break down test into smaller, focused tests',
          autoFixable: false
        });
      }

      // Check assertions count
      const assertionCount = this.countAssertions(test.content);
      if (assertionCount === 0) {
        issues.push({
          type: 'missing_assertions',
          file: filePath,
          testName: test.name,
          severity: 'critical',
          message: 'Test has no assertions',
          recommendation: 'Add assertions to verify test expectations',
          autoFixable: false
        });
      } else if (assertionCount > this.testComplexityRules.maxAssertionsPerTest) {
        issues.push({
          type: 'too_many_assertions',
          file: filePath,
          testName: test.name,
          assertions: assertionCount,
          severity: 'medium',
          message: `Test has too many assertions (${assertionCount})`,
          recommendation: 'Split test into multiple focused tests',
          autoFixable: false
        });
      }
    });

    return issues;
  }

  async analyzeTestStructure(content, filePath) {
    const issues = [];
    
    // Check for proper test organization (Arrange, Act, Assert)
    const tests = this.extractIndividualTests(content);
    
    tests.forEach(test => {
      const hasSetup = /\/\/ Arrange|\/\/ Given|\/\* Arrange/.test(test.content);
      const hasAction = /\/\/ Act|\/\/ When|\/\* Act/.test(test.content);
      const hasAssertion = /\/\/ Assert|\/\/ Then|\/\* Assert/.test(test.content);
      
      if (!hasSetup && !hasAction && !hasAssertion && test.content.length > 100) {
        issues.push({
          type: 'unclear_test_structure',
          file: filePath,
          testName: test.name,
          severity: 'low',
          message: 'Test lacks clear AAA (Arrange, Act, Assert) structure',
          recommendation: 'Add comments to clarify test phases',
          autoFixable: true,
          fix: {
            type: 'add_aaa_comments'
          }
        });
      }
    });

    // Check for proper describe/context organization
    if (!content.includes('describe(') && content.includes('it(')) {
      issues.push({
        type: 'missing_test_organization',
        file: filePath,
        severity: 'medium',
        message: 'Tests not organized in describe blocks',
        recommendation: 'Group related tests using describe blocks',
        autoFixable: true,
        fix: {
          type: 'wrap_in_describe_block'
        }
      });
    }

    return issues;
  }

  async analyzeCoverage() {
    console.log('📊 Analyzing test coverage...');
    const analysis = {
      issues: [],
      coverage: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0
      }
    };

    try {
      // Try to run coverage analysis
      let coverageCommand = 'npm run test:coverage';
      
      // Detect coverage command based on framework
      const packageJsonPath = path.join(this.engine.projectRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const scripts = packageJson.scripts || {};
        
        if (scripts['test:coverage']) {
          coverageCommand = 'npm run test:coverage';
        } else if (scripts.coverage) {
          coverageCommand = 'npm run coverage';
        } else {
          // Try framework-specific commands
          if (packageJson.devDependencies?.jest || packageJson.dependencies?.jest) {
            coverageCommand = 'npx jest --coverage --silent';
          } else if (packageJson.devDependencies?.vitest) {
            coverageCommand = 'npx vitest --coverage --reporter=json';
          }
        }
      }

      const output = execSync(coverageCommand, {
        cwd: this.engine.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Parse coverage results
      const coverage = this.parseCoverageOutput(output);
      analysis.coverage = coverage;

      // Check against targets
      Object.entries(this.coverageTargets).forEach(([metric, target]) => {
        if (coverage[metric] < target) {
          analysis.issues.push({
            type: 'insufficient_coverage',
            metric: metric,
            actual: coverage[metric],
            target: target,
            severity: coverage[metric] < target * 0.5 ? 'high' : 'medium',
            message: `${metric} coverage (${coverage[metric]}%) below target (${target}%)`,
            recommendation: `Increase ${metric} coverage by adding more comprehensive tests`,
            autoFixable: false
          });
        }
      });

    } catch (error) {
      analysis.issues.push({
        type: 'coverage_analysis_failed',
        severity: 'medium',
        message: 'Unable to analyze test coverage',
        recommendation: 'Configure test coverage reporting in your project',
        details: error.message
      });
    }

    return analysis;
  }

  async detectMissingTests() {
    console.log('🔍 Detecting missing tests...');
    const issues = [];

    // Find source files that should have tests
    const sourceFiles = await this.getSourceFiles();
    const testFiles = await this.findTestFiles();
    
    // Create mapping of test files to source files
    const testMapping = new Map();
    testFiles.forEach(testFile => {
      const baseName = path.basename(testFile)
        .replace(/\.(test|spec)\.(js|ts|tsx)$/, '')
        .replace(/\.(js|ts|tsx)$/, '');
      testMapping.set(baseName, testFile);
    });

    // Check each source file for corresponding test
    for (const sourceFile of sourceFiles) {
      if (sourceFile.includes('node_modules') || 
          sourceFile.includes('.d.ts') ||
          sourceFile.includes('.config.') ||
          sourceFile.includes('.setup.')) {
        continue;
      }

      const baseName = path.basename(sourceFile, path.extname(sourceFile));
      const hasTest = testMapping.has(baseName);
      
      if (!hasTest) {
        // Check if file contains testable code
        const content = fs.readFileSync(sourceFile, 'utf8');
        const hasTestableCode = this.hasTestableCode(content);
        
        if (hasTestableCode) {
          issues.push({
            type: 'missing_test_file',
            file: sourceFile,
            severity: 'medium',
            message: `Source file has no corresponding test file`,
            recommendation: `Create test file: ${baseName}.test.${path.extname(sourceFile).slice(1)}`,
            autoFixable: true,
            fix: {
              type: 'create_test_file',
              sourceFile: sourceFile,
              suggestedTestFile: `${baseName}.test.${path.extname(sourceFile).slice(1)}`
            }
          });
        }
      }
    }

    return issues;
  }

  async detectFlakyTests() {
    console.log('🎲 Detecting flaky tests...');
    const issues = [];

    const testFiles = await this.findTestFiles();
    
    for (const file of testFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Patterns that indicate potential flakiness
      const flakyPatterns = [
        { pattern: /Math\.random/g, reason: 'Uses random values' },
        { pattern: /new Date\(\)/g, reason: 'Uses current date/time' },
        { pattern: /setTimeout|setInterval/g, reason: 'Time-dependent operations' },
        { pattern: /\.focus\(\)|\.blur\(\)/g, reason: 'DOM focus operations' },
        { pattern: /window\.location/g, reason: 'Browser navigation' },
        { pattern: /fetch\(|axios\./g, reason: 'External API calls without mocking' }
      ];

      flakyPatterns.forEach(({ pattern, reason }) => {
        const matches = content.match(pattern);
        if (matches) {
          issues.push({
            type: 'potentially_flaky_test',
            file: file,
            reason: reason,
            matches: matches.length,
            severity: 'medium',
            message: `Test may be flaky: ${reason}`,
            recommendation: 'Mock external dependencies and avoid non-deterministic operations',
            autoFixable: false
          });
        }
      });
    }

    return issues;
  }

  async validateIntegrationTests() {
    console.log('🔗 Validating integration tests...');
    const issues = [];

    const testFiles = await this.findTestFiles();
    let hasIntegrationTests = false;
    
    // Check for integration test patterns
    for (const file of testFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('integration') || 
          content.includes('e2e') ||
          file.includes('integration') ||
          file.includes('e2e')) {
        hasIntegrationTests = true;
        
        // Analyze integration test quality
        const integrationIssues = await this.analyzeIntegrationTestQuality(content, file);
        issues.push(...integrationIssues);
      }
    }

    if (!hasIntegrationTests && testFiles.length > 5) {
      issues.push({
        type: 'missing_integration_tests',
        severity: 'medium',
        message: 'No integration tests found in a project with multiple components',
        recommendation: 'Add integration tests to verify component interactions',
        autoFixable: false
      });
    }

    return issues;
  }

  async analyzeTestPerformance() {
    console.log('⚡ Analyzing test performance...');
    const issues = [];

    try {
      // Run tests with timing information
      const testCommand = this.getTestCommand();
      const output = execSync(`${testCommand} --verbose`, {
        cwd: this.engine.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Parse slow tests from output
      const slowTests = this.parseSlowTests(output);
      
      slowTests.forEach(test => {
        if (test.duration > 5000) { // Tests slower than 5 seconds
          issues.push({
            type: 'slow_test',
            testName: test.name,
            duration: test.duration,
            severity: 'medium',
            message: `Test is slow (${test.duration}ms)`,
            recommendation: 'Optimize test by mocking dependencies or reducing complexity',
            autoFixable: false
          });
        }
      });

    } catch (error) {
      // If we can't analyze performance, suggest general improvements
      issues.push({
        type: 'test_performance_unknown',
        severity: 'low',
        message: 'Unable to analyze test performance',
        recommendation: 'Consider running tests with --verbose flag to monitor performance'
      });
    }

    return issues;
  }

  generateTestingRecommendations(issues) {
    const recommendations = [];
    
    // Group issues by category
    const categories = this.groupIssuesByCategory(issues);
    
    Object.entries(categories).forEach(([category, categoryIssues]) => {
      if (categoryIssues.length > 0) {
        recommendations.push({
          category,
          priority: this.getCategoryPriority(category),
          count: categoryIssues.length,
          autoFixableCount: categoryIssues.filter(i => i.autoFixable).length,
          description: this.getCategoryDescription(category),
          actionItems: this.getCategoryActionItems(category),
          estimatedEffort: this.estimateEffort(category, categoryIssues.length)
        });
      }
    });
    
    return recommendations.sort((a, b) => this.priorityScore(b.priority) - this.priorityScore(a.priority));
  }

  calculateTestQualityScore(results) {
    let score = 100;
    
    // Deduct points for different issue types
    const deductions = {
      'critical': 25,
      'high': 15,
      'medium': 10,
      'low': 5
    };
    
    results.issues.forEach(issue => {
      score -= deductions[issue.severity] || 5;
    });
    
    // Bonus for good coverage
    const avgCoverage = Object.values(results.metrics.coverage).reduce((sum, val) => sum + val, 0) / 4;
    if (avgCoverage > 90) score += 10;
    else if (avgCoverage > 80) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  // Auto-fix capabilities
  async autoFix(issue) {
    console.log(`🧪 Auto-fixing test issue: ${issue.type} in ${issue.file}`);
    
    const fixers = {
      'create_basic_test_structure': () => this.createBasicTestStructure(),
      'create_test_file': () => this.createTestFile(issue),
      'add_aaa_comments': () => this.addAAAComments(issue),
      'wrap_in_describe_block': () => this.wrapInDescribeBlock(issue),
      'remove_focused_tests': () => this.removeFocusedTests(issue),
      'remove_skipped_tests': () => this.removeSkippedTests(issue)
    };
    
    const fixer = fixers[issue.fix?.type];
    if (fixer) {
      return await fixer();
    }
    
    throw new Error(`No auto-fix available for ${issue.type}`);
  }

  async createBasicTestStructure() {
    const testDir = path.join(this.engine.projectRoot, '__tests__');
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const basicTestContent = `// Basic test setup
describe('Application', () => {
  it('should be defined', () => {
    expect(true).toBe(true);
  });
});
`;
    
    fs.writeFileSync(path.join(testDir, 'basic.test.js'), basicTestContent);
    return true;
  }

  async createTestFile(issue) {
    const sourceFile = issue.fix.sourceFile;
    const testFile = issue.fix.suggestedTestFile;
    const testPath = path.join(path.dirname(sourceFile), testFile);
    
    // Read source file to generate appropriate test template
    const sourceContent = fs.readFileSync(sourceFile, 'utf8');
    const testContent = this.generateTestTemplate(sourceContent, sourceFile);
    
    fs.writeFileSync(testPath, testContent);
    return true;
  }

  // Utility methods
  hasTestableCode(content) {
    const testablePatterns = [
      /export\s+(function|class|const)/,
      /export\s+default/,
      /function\s+\w+/,
      /class\s+\w+/,
      /const\s+\w+\s*=\s*(.*=>|\(.*\)\s*=>)/
    ];
    
    return testablePatterns.some(pattern => pattern.test(content));
  }

  countAssertions(testContent) {
    const assertionPatterns = [
      /expect\(/g,
      /assert\./g,
      /should\./g,
      /\.to\./g
    ];
    
    let count = 0;
    assertionPatterns.forEach(pattern => {
      const matches = testContent.match(pattern);
      if (matches) count += matches.length;
    });
    
    return count;
  }

  extractIndividualTests(content) {
    const tests = [];
    const testPattern = /(it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{/g;
    
    let match;
    while ((match = testPattern.exec(content)) !== null) {
      const testStart = match.index;
      const testName = match[2];
      
      // Find the end of this test (simplified - would need proper bracket matching in production)
      const restContent = content.substring(testStart);
      const testEndMatch = restContent.search(/\n\s*(it|test|describe|\})/);
      const testEnd = testEndMatch > 0 ? testStart + testEndMatch : content.length;
      
      tests.push({
        name: testName,
        content: content.substring(testStart, testEnd)
      });
    }
    
    return tests;
  }

  async getSourceFiles() {
    try {
      const files = execSync('find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v ".test." | grep -v ".spec."', {
        cwd: this.engine.projectRoot,
        encoding: 'utf8'
      }).split('\n').filter(Boolean);
      
      return files.map(f => path.resolve(this.engine.projectRoot, f));
    } catch {
      return [];
    }
  }

  getAntiPatternMessage(type) {
    const messages = {
      'skipped_tests': 'Test is being skipped',
      'focused_tests': 'Test is focused (only this test will run)',
      'empty_expectations': 'Test has empty expectations',
      'empty_tests': 'Test has no implementation',
      'console_in_tests': 'Console statements in tests',
      'timing_dependent': 'Test depends on timing',
      'non_deterministic': 'Test uses non-deterministic values'
    };
    
    return messages[type] || 'Test anti-pattern detected';
  }

  getTestCommand() {
    const packageJsonPath = path.join(this.engine.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};
      
      if (scripts.test) return 'npm test';
      if (scripts['test:unit']) return 'npm run test:unit';
    }
    
    return 'npx jest'; // Default fallback
  }

  priorityScore(priority) {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[priority] || 0;
  }

  groupIssuesByCategory(issues) {
    return issues.reduce((groups, issue) => {
      const category = this.getIssueCategory(issue.type);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(issue);
      return groups;
    }, {});
  }

  getIssueCategory(type) {
    const categoryMap = {
      'no_tests_found': 'coverage',
      'insufficient_coverage': 'coverage',
      'missing_test_file': 'coverage',
      'missing_assertions': 'quality',
      'empty_tests': 'quality',
      'focused_tests': 'maintenance',
      'skipped_tests': 'maintenance',
      'potentially_flaky_test': 'reliability',
      'slow_test': 'performance'
    };
    
    return categoryMap[type] || 'other';
  }
}

module.exports = { TestingAgent };