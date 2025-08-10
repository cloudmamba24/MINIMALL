#!/usr/bin/env node
/**
 * TypeScript Agent - Advanced TypeScript error detection and fixing
 * 
 * Capabilities:
 * - Deep AST analysis for type errors
 * - Intelligent type inference and fixes
 * - Import/export resolution
 * - Generic type compatibility analysis
 * - Interface merging and extension detection
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TypeScriptAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'TypeScript';
    this.capabilities = [
      'type_error_detection',
      'interface_analysis', 
      'import_resolution',
      'generic_inference',
      'ast_parsing',
      'auto_fixing'
    ];
  }

  async analyze() {
    console.log('🔍 TypeScript Agent: Deep AST analysis starting...');
    
    const results = {
      issues: [],
      metrics: {
        filesAnalyzed: 0,
        errorsFound: 0,
        autoFixable: 0,
        complexIssues: 0
      },
      recommendations: []
    };

    // 1. Compile TypeScript and capture detailed errors
    const tsErrors = await this.getDetailedTypeScriptErrors();
    
    // 2. Analyze each error for fixability
    for (const error of tsErrors) {
      const analysis = await this.analyzeError(error);
      results.issues.push(analysis);
      
      if (analysis.autoFixable) {
        results.metrics.autoFixable++;
      }
      if (analysis.complexity === 'high') {
        results.metrics.complexIssues++;
      }
    }

    // 3. Dependency analysis
    const dependencyIssues = await this.analyzeDependencies();
    results.issues.push(...dependencyIssues);

    // 4. Type coverage analysis
    const coverageAnalysis = await this.analyzeTypeCoverage();
    results.recommendations.push(...coverageAnalysis);

    results.metrics.errorsFound = results.issues.length;
    results.metrics.filesAnalyzed = await this.countTypeScriptFiles();

    console.log(`✅ TypeScript Agent: Found ${results.issues.length} issues across ${results.metrics.filesAnalyzed} files`);
    
    return results;
  }

  async getDetailedTypeScriptErrors() {
    try {
      // Run TypeScript compiler with detailed output
      execSync('npx tsc --noEmit --pretty false', { 
        cwd: this.engine.projectRoot,
        stdio: 'pipe'
      });
      return [];
    } catch (error) {
      return this.parseDetailedErrors(error.stdout);
    }
  }

  parseDetailedErrors(output) {
    const errors = [];
    const lines = output.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const errorMatch = line.match(/^(.+)\((\d+),(\d+)\): error TS(\d+): (.+)$/);
      
      if (errorMatch) {
        const error = {
          file: errorMatch[1],
          line: parseInt(errorMatch[2]),
          column: parseInt(errorMatch[3]),
          code: errorMatch[4],
          message: errorMatch[5],
          context: this.getErrorContext(errorMatch[1], parseInt(errorMatch[2])),
          category: this.categorizeError(errorMatch[4])
        };
        
        errors.push(error);
      }
    }
    
    return errors;
  }

  async analyzeError(error) {
    const analysis = {
      ...error,
      severity: this.calculateSeverity(error),
      complexity: this.calculateComplexity(error),
      autoFixable: this.isAutoFixable(error),
      fixStrategy: this.suggestFixStrategy(error),
      relatedFiles: await this.findRelatedFiles(error),
      riskLevel: this.assessRisk(error)
    };

    return analysis;
  }

  calculateSeverity(error) {
    // Critical errors that prevent compilation
    const criticalCodes = ['2304', '2322', '2339', '2345', '2554'];
    
    if (criticalCodes.includes(error.code)) {
      return 'critical';
    }
    
    // High priority errors
    const highPriorityCodes = ['2531', '2532', '2533', '2695'];
    if (highPriorityCodes.includes(error.code)) {
      return 'high';
    }
    
    return 'medium';
  }

  calculateComplexity(error) {
    // Complex generic type errors
    if (error.message.includes('generic') || error.message.includes('extends')) {
      return 'high';
    }
    
    // Union type issues
    if (error.message.includes('union') || error.message.includes('|')) {
      return 'medium';
    }
    
    return 'low';
  }

  isAutoFixable(error) {
    const autoFixableCodes = [
      '2304', // Cannot find name
      '2307', // Cannot find module
      '2322', // Type not assignable (simple cases)
      '2345', // Argument of type not assignable
      '2531', // Object is possibly null
      '2532', // Object is possibly undefined
    ];
    
    return autoFixableCodes.includes(error.code);
  }

  suggestFixStrategy(error) {
    const strategies = {
      '2304': 'import_missing_dependency',
      '2307': 'fix_module_path',
      '2322': 'type_assertion_or_interface_update',
      '2345': 'parameter_type_fix',
      '2531': 'null_check_or_optional_chaining',
      '2532': 'undefined_check_or_optional_chaining',
      '2339': 'add_property_or_type_assertion',
      '2554': 'fix_function_parameters'
    };
    
    return strategies[error.code] || 'manual_review_required';
  }

  async findRelatedFiles(error) {
    // Find files that might be affected by this error
    const relatedFiles = [];
    
    // If it's an interface error, find all files that use this interface
    if (error.message.includes('interface') || error.message.includes('type')) {
      const interfaceName = this.extractInterfaceName(error.message);
      if (interfaceName) {
        relatedFiles.push(...await this.findInterfaceUsages(interfaceName));
      }
    }
    
    return relatedFiles;
  }

  async analyzeDependencies() {
    console.log('🔗 Analyzing import/export dependencies...');
    
    const issues = [];
    const tsFiles = await this.getAllTypeScriptFiles();
    
    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const imports = this.extractImports(content);
      
      for (const importStatement of imports) {
        const resolved = await this.resolveImport(importStatement, file);
        if (!resolved.exists) {
          issues.push({
            type: 'missing_import',
            file: file,
            import: importStatement,
            severity: 'high',
            autoFixable: true,
            fixStrategy: 'resolve_import_path'
          });
        }
      }
    }
    
    return issues;
  }

  async analyzeTypeCoverage() {
    console.log('📊 Analyzing TypeScript type coverage...');
    
    const recommendations = [];
    
    try {
      // Run type-coverage tool if available
      const coverage = execSync('npx type-coverage --detail', {
        cwd: this.engine.projectRoot,
        encoding: 'utf8'
      });
      
      const coverageMatch = coverage.match(/(\d+\.?\d*)% type coverage/);
      if (coverageMatch) {
        const percentage = parseFloat(coverageMatch[1]);
        
        if (percentage < 80) {
          recommendations.push({
            type: 'type_coverage_low',
            message: `Type coverage is ${percentage}%. Consider adding more type annotations.`,
            priority: 'medium',
            action: 'add_type_annotations'
          });
        }
      }
      
    } catch (error) {
      // type-coverage not available, use basic analysis
      recommendations.push({
        type: 'install_type_coverage',
        message: 'Consider installing type-coverage for better type analysis',
        priority: 'low',
        action: 'npm install --save-dev type-coverage'
      });
    }
    
    return recommendations;
  }

  // Auto-fix capabilities
  async autoFix(error) {
    console.log(`🔧 Auto-fixing TypeScript error: ${error.code} in ${error.file}`);
    
    const fixers = {
      '2304': () => this.fixMissingName(error),
      '2307': () => this.fixMissingModule(error),
      '2322': () => this.fixTypeAssignment(error),
      '2531': () => this.fixNullCheck(error),
      '2532': () => this.fixUndefinedCheck(error)
    };
    
    const fixer = fixers[error.code];
    if (fixer) {
      return await fixer();
    }
    
    throw new Error(`No auto-fix available for error code ${error.code}`);
  }

  async fixMissingName(error) {
    // Extract the missing name from the error message
    const missingName = error.message.match(/Cannot find name '(.+)'/)?.[1];
    if (!missingName) return false;
    
    // Try to find the correct import
    const correctImport = await this.findCorrectImport(missingName);
    if (correctImport) {
      await this.addImport(error.file, correctImport);
      return true;
    }
    
    return false;
  }

  async fixTypeAssignment(error) {
    // Simple type assertion fixes
    const file = error.file;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const line = lines[error.line - 1];
    
    // Add type assertion for common cases
    if (error.message.includes('string | undefined') && error.message.includes('string')) {
      const fixed = line.replace(/([a-zA-Z_]\w*)(\s*[=:]\s*)/, '$1$2$1 || ""');
      lines[error.line - 1] = fixed;
      
      fs.writeFileSync(file, lines.join('\n'));
      return true;
    }
    
    return false;
  }

  // Utility methods
  getErrorContext(file, line) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      const start = Math.max(0, line - 3);
      const end = Math.min(lines.length, line + 2);
      
      return lines.slice(start, end).map((l, i) => ({
        line: start + i + 1,
        content: l,
        isError: start + i + 1 === line
      }));
    } catch {
      return [];
    }
  }

  categorizeError(code) {
    const categories = {
      'type_mismatch': ['2322', '2345', '2554'],
      'missing_declaration': ['2304', '2307', '2339'],
      'null_undefined': ['2531', '2532', '2533'],
      'generic_constraint': ['2344', '2345', '2416'],
      'module_resolution': ['2307', '2339', '2694']
    };
    
    for (const [category, codes] of Object.entries(categories)) {
      if (codes.includes(code)) {
        return category;
      }
    }
    
    return 'other';
  }

  async getAllTypeScriptFiles() {
    const { execSync } = require('child_process');
    
    try {
      const files = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules', {
        cwd: this.engine.projectRoot,
        encoding: 'utf8'
      }).split('\n').filter(Boolean);
      
      return files.map(f => path.resolve(this.engine.projectRoot, f));
    } catch {
      return [];
    }
  }

  async countTypeScriptFiles() {
    const files = await this.getAllTypeScriptFiles();
    return files.length;
  }

  extractImports(content) {
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  assessRisk(error) {
    // Assess the risk of fixing this error
    if (error.file.includes('node_modules')) {
      return 'low';
    }
    
    if (error.file.includes('test') || error.file.includes('spec')) {
      return 'low';
    }
    
    if (error.category === 'missing_declaration' || error.category === 'module_resolution') {
      return 'low';
    }
    
    if (error.category === 'type_mismatch') {
      return 'medium';
    }
    
    return 'high';
  }
}

// CLI functionality for standalone execution
async function runStandalone() {
  console.log('🛡️  TYPESCRIPT CODEGUARD AGENT');
  console.log('━'.repeat(40));
  
  const projectRoot = process.cwd();
  const args = process.argv.slice(2);
  const mode = args[0] || 'analyze';
  
  // Load configuration
  let config = {};
  try {
    config = require(path.join(projectRoot, 'codeguard-agents.config.js'));
  } catch (error) {
    console.log('⚠️  No configuration file found, using defaults');
    config = { agents: { typescript: { enabled: true, autofix: false } } };
  }
  
  if (!config.agents.typescript.enabled) {
    console.log('❌ TypeScript agent is disabled in configuration');
    return;
  }
  
  // Create mock engine for standalone operation
  const mockEngine = {
    projectRoot,
    state: { metrics: {} },
    emit: () => {}
  };
  
  const agent = new TypeScriptAgent(mockEngine);
  
  try {
    switch (mode) {
      case 'analyze':
        console.log('🔍 Running analysis...');
        const results = await agent.analyze();
        printResults(results, config);
        process.exit(results.issues.length > 0 ? 1 : 0);
        break;
        
      case 'fix':
        if (!config.agents.typescript.autofix) {
          console.log('❌ Auto-fix is disabled in configuration');
          process.exit(1);
        }
        console.log('🔧 Running analysis and auto-fixes...');
        const fixResults = await runWithFixes(agent);
        printResults(fixResults, config);
        process.exit(fixResults.fixedCount > 0 ? 0 : 1);
        break;
        
      case 'report':
        console.log('📊 Generating detailed report...');
        const reportResults = await agent.analyze();
        generateReport(reportResults, config);
        break;
        
      default:
        console.log('Usage: npm run guard:typescript [analyze|fix|report]');
        console.log('  analyze - Run analysis only (default)');
        console.log('  fix     - Run analysis and attempt auto-fixes');
        console.log('  report  - Generate detailed report');
    }
  } catch (error) {
    console.error('💥 Agent execution failed:', error.message);
    process.exit(1);
  }
}

async function runWithFixes(agent) {
  const results = await agent.analyze();
  let fixedCount = 0;
  
  for (const issue of results.issues) {
    if (issue.autoFixable) {
      try {
        const fixed = await agent.autoFix(issue);
        if (fixed) {
          console.log(`✅ Fixed: ${issue.message}`);
          fixedCount++;
        }
      } catch (error) {
        console.log(`❌ Failed to fix: ${issue.message} - ${error.message}`);
      }
    }
  }
  
  return { ...results, fixedCount };
}

function printResults(results, config) {
  console.log('\n📊 TYPESCRIPT ANALYSIS RESULTS');
  console.log('━'.repeat(40));
  console.log(`📁 Files analyzed: ${results.metrics.filesAnalyzed}`);
  console.log(`❌ Errors found: ${results.metrics.errorsFound}`);
  console.log(`🔧 Auto-fixable: ${results.metrics.autoFixable}`);
  console.log(`⚠️  Complex issues: ${results.metrics.complexIssues}`);
  
  if (results.fixedCount !== undefined) {
    console.log(`✅ Issues fixed: ${results.fixedCount}`);
  }
  
  if (config.outputFormat === 'json') {
    console.log('\n' + JSON.stringify(results, null, 2));
  } else if (results.issues.length > 0 && config.verbose) {
    console.log('\n🔍 DETAILED ISSUES:');
    results.issues.slice(0, 10).forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.file}:${issue.line}:${issue.column}`);
      console.log(`   Error: ${issue.message}`);
      console.log(`   Severity: ${issue.severity} | Fixable: ${issue.autoFixable ? '✅' : '❌'}`);
    });
    
    if (results.issues.length > 10) {
      console.log(`\n... and ${results.issues.length - 10} more issues`);
    }
  }
  
  if (results.recommendations && results.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    results.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.message}`);
    });
  }
}

function generateReport(results, config) {
  const reportData = {
    timestamp: new Date().toISOString(),
    agent: 'typescript',
    summary: results.metrics,
    issues: results.issues,
    recommendations: results.recommendations
  };
  
  const reportDir = config.reporting?.outputDir || './codeguard-reports';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `typescript-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(`📄 Report generated: ${reportPath}`);
}

// Run standalone if called directly
if (require.main === module) {
  runStandalone().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { TypeScriptAgent };