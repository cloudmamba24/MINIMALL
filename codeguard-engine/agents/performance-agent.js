/**
 * Performance Agent - Advanced performance analysis and optimization
 * 
 * Capabilities:
 * - Bundle size analysis and optimization
 * - Runtime performance profiling
 * - Memory leak detection
 * - Core Web Vitals monitoring
 * - Asset optimization recommendations
 * - Code splitting analysis
 * - Tree shaking effectiveness
 * - Performance budget enforcement
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'Performance';
    this.capabilities = [
      'bundle_analysis',
      'memory_leak_detection',
      'core_web_vitals',
      'asset_optimization',
      'code_splitting_analysis',
      'performance_budgets',
      'tree_shaking_analysis',
      'runtime_profiling'
    ];
    
    this.performanceBudgets = {
      bundle: {
        initial: 200000, // 200KB initial bundle
        total: 1000000,  // 1MB total assets
        individual: 50000 // 50KB per chunk
      },
      metrics: {
        fcp: 1800,  // First Contentful Paint - 1.8s
        lcp: 2500,  // Largest Contentful Paint - 2.5s
        fid: 100,   // First Input Delay - 100ms
        cls: 0.1    // Cumulative Layout Shift - 0.1
      },
      images: {
        maxSize: 500000,    // 500KB max image
        formats: ['webp', 'avif'], // Modern formats
        lazy: true          // Lazy loading required
      }
    };

    this.optimizationPatterns = [
      { pattern: /import\s+\*\s+as\s+\w+\s+from\s+['"]lodash['"]/, type: 'inefficient_import', severity: 'medium' },
      { pattern: /import\s+.*\s+from\s+['"]moment['"]/, type: 'heavy_dependency', severity: 'high' },
      { pattern: /console\.log\(.*\)/g, type: 'console_statements', severity: 'low' },
      { pattern: /debugger;/g, type: 'debugger_statements', severity: 'medium' },
      { pattern: /React\.createElement/, type: 'jsx_optimization', severity: 'low' },
      { pattern: /useState\(\[\]\)/g, type: 'empty_array_state', severity: 'medium' },
      { pattern: /useEffect\(\(\)\s*=>\s*\{[\s\S]*?\},\s*\[\]\)/g, type: 'empty_dependency_effect', severity: 'low' }
    ];
  }

  async analyze() {
    console.log('⚡ Performance Agent: Bundle and runtime optimization analysis starting...');
    
    const results = {
      issues: [],
      metrics: {
        filesAnalyzed: 0,
        bundleSize: 0,
        optimizationsFound: 0,
        budgetViolations: 0,
        performanceScore: 0
      },
      recommendations: [],
      budgets: this.performanceBudgets
    };

    // 1. Bundle analysis
    const bundleIssues = await this.analyzeBundleSize();
    results.issues.push(...bundleIssues);
    results.metrics.bundleSize = await this.calculateTotalBundleSize();

    // 2. Code splitting analysis
    const splittingIssues = await this.analyzeCodeSplitting();
    results.issues.push(...splittingIssues);

    // 3. Asset optimization analysis
    const assetIssues = await this.analyzeAssets();
    results.issues.push(...assetIssues);

    // 4. Performance pattern analysis
    const sourceFiles = await this.getSourceFiles();
    results.metrics.filesAnalyzed = sourceFiles.length;
    
    for (const file of sourceFiles) {
      const fileIssues = await this.analyzeSourceFile(file);
      results.issues.push(...fileIssues);
    }

    // 5. Memory leak detection
    const memoryIssues = await this.detectMemoryLeaks();
    results.issues.push(...memoryIssues);

    // 6. Tree shaking effectiveness
    const treeshakingIssues = await this.analyzeTreeShaking();
    results.issues.push(...treeshakingIssues);

    // 7. Performance budget validation
    const budgetIssues = await this.validatePerformanceBudgets();
    results.issues.push(...budgetIssues);
    results.metrics.budgetViolations = budgetIssues.length;

    // 8. Generate optimization recommendations
    results.recommendations = this.generateOptimizationRecommendations(results.issues);

    results.metrics.optimizationsFound = results.issues.length;
    results.metrics.performanceScore = this.calculatePerformanceScore(results);

    console.log(`✅ Performance Agent: Found ${results.issues.length} optimizations. Score: ${results.metrics.performanceScore}/100`);
    
    return results;
  }

  async analyzeBundleSize() {
    console.log('📦 Analyzing bundle size and composition...');
    const issues = [];

    try {
      // Check if webpack-bundle-analyzer is available
      const bundleStatsPath = path.join(this.engine.projectRoot, 'bundle-stats.json');
      let bundleStats = null;
      
      try {
        // Try to generate bundle stats
        execSync('npm run build:analyze 2>/dev/null || npx webpack-bundle-analyzer --analyze-mode json', {
          cwd: this.engine.projectRoot,
          stdio: 'pipe'
        });
        
        if (fs.existsSync(bundleStatsPath)) {
          bundleStats = JSON.parse(fs.readFileSync(bundleStatsPath, 'utf8'));
        }
      } catch (error) {
        // Fallback to manual analysis
      }

      // Analyze package.json for heavy dependencies
      const packageJsonPath = path.join(this.engine.projectRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const heavyDependencies = this.identifyHeavyDependencies(packageJson);
        
        heavyDependencies.forEach(dep => {
          issues.push({
            type: 'heavy_dependency',
            package: dep.name,
            size: dep.estimatedSize,
            severity: 'high',
            message: `Heavy dependency detected: ${dep.name} (~${dep.estimatedSize}KB)`,
            recommendation: dep.alternative ? `Consider using ${dep.alternative}` : 'Consider if this dependency is necessary',
            autoFixable: false,
            impact: 'bundle_size'
          });
        });
      }

      // Check for duplicate dependencies
      const duplicates = await this.findDuplicateDependencies();
      duplicates.forEach(dup => {
        issues.push({
          type: 'duplicate_dependency',
          package: dup.name,
          versions: dup.versions,
          severity: 'medium',
          message: `Duplicate dependency: ${dup.name} has multiple versions`,
          recommendation: 'Consolidate to a single version using resolutions',
          autoFixable: true,
          impact: 'bundle_size'
        });
      });

    } catch (error) {
      issues.push({
        type: 'bundle_analysis_failed',
        severity: 'low',
        message: 'Bundle analysis tools not available',
        recommendation: 'Install webpack-bundle-analyzer for detailed bundle analysis'
      });
    }

    return issues;
  }

  async analyzeCodeSplitting() {
    console.log('🧩 Analyzing code splitting opportunities...');
    const issues = [];
    
    const routeFiles = await this.findRouteFiles();
    const componentFiles = await this.findComponentFiles();
    
    // Check for missing dynamic imports in routes
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Look for static imports of large components in routing
      const staticImports = content.match(/import\s+\w+\s+from\s+['"][^'"]*Component[^'"]*['"]/g);
      if (staticImports && staticImports.length > 3) {
        issues.push({
          type: 'missing_dynamic_imports',
          file: file,
          severity: 'medium',
          message: 'Route file has many static component imports',
          recommendation: 'Use dynamic imports (React.lazy) for route-level code splitting',
          autoFixable: true,
          fix: {
            type: 'convert_to_dynamic_import',
            imports: staticImports
          },
          impact: 'initial_bundle_size'
        });
      }
    }

    // Check for large components that should be split
    for (const file of componentFiles) {
      const stats = fs.statSync(file);
      if (stats.size > 10000) { // Files larger than 10KB
        const content = fs.readFileSync(file, 'utf8');
        const componentCount = (content.match(/export\s+(default\s+)?(?:function|const)\s+\w+/g) || []).length;
        
        if (componentCount > 1) {
          issues.push({
            type: 'large_component_file',
            file: file,
            size: stats.size,
            componentCount: componentCount,
            severity: 'medium',
            message: `Large file with multiple components (${Math.round(stats.size/1000)}KB)`,
            recommendation: 'Split into separate files or use dynamic imports',
            autoFixable: false,
            impact: 'bundle_organization'
          });
        }
      }
    }

    return issues;
  }

  async analyzeAssets() {
    console.log('🖼️ Analyzing asset optimization...');
    const issues = [];

    const assetTypes = {
      images: ['**/*.{jpg,jpeg,png,gif,svg,webp}'],
      fonts: ['**/*.{woff,woff2,ttf,otf}'],
      videos: ['**/*.{mp4,webm,avi,mov}']
    };

    for (const [type, patterns] of Object.entries(assetTypes)) {
      for (const pattern of patterns) {
        try {
          const files = execSync(`find . -name "${pattern.replace('**/*', '*')}" | grep -v node_modules`, {
            cwd: this.engine.projectRoot,
            encoding: 'utf8'
          }).split('\n').filter(Boolean);

          for (const file of files) {
            const fullPath = path.resolve(this.engine.projectRoot, file);
            const stats = fs.statSync(fullPath);
            
            if (type === 'images' && stats.size > this.performanceBudgets.images.maxSize) {
              issues.push({
                type: 'oversized_image',
                file: fullPath,
                size: stats.size,
                severity: 'high',
                message: `Image exceeds size budget: ${Math.round(stats.size/1000)}KB`,
                recommendation: 'Optimize image size and consider modern formats (WebP, AVIF)',
                autoFixable: true,
                fix: {
                  type: 'optimize_image',
                  targetSize: this.performanceBudgets.images.maxSize
                },
                impact: 'load_time'
              });
            }

            // Check for missing lazy loading
            if (type === 'images') {
              const usage = await this.findImageUsage(file);
              if (!usage.hasLazyLoading && usage.isVisible) {
                issues.push({
                  type: 'missing_lazy_loading',
                  file: fullPath,
                  severity: 'medium',
                  message: 'Image missing lazy loading attribute',
                  recommendation: 'Add loading="lazy" to img tags',
                  autoFixable: true,
                  fix: {
                    type: 'add_lazy_loading'
                  },
                  impact: 'initial_load'
                });
              }
            }
          }
        } catch (error) {
          // Skip if find command fails
        }
      }
    }

    return issues;
  }

  async analyzeSourceFile(filePath) {
    const issues = [];
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern-based performance analysis
    this.optimizationPatterns.forEach(({ pattern, type, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            type,
            file: filePath,
            code: match,
            severity,
            message: this.getOptimizationMessage(type),
            recommendation: this.getOptimizationRecommendation(type),
            autoFixable: this.isOptimizationAutoFixable(type),
            fix: this.getOptimizationFix(type, match),
            impact: this.getPerformanceImpact(type)
          });
        });
      }
    });

    // React-specific optimizations
    if (filePath.includes('.tsx') || filePath.includes('.jsx')) {
      const reactIssues = await this.analyzeReactPerformance(content, filePath);
      issues.push(...reactIssues);
    }

    return issues;
  }

  async analyzeReactPerformance(content, filePath) {
    const issues = [];

    // Check for missing memo/callback optimizations
    const hasExpensiveOperations = /\.map\(|\.filter\(|\.reduce\(|\.sort\(/g.test(content);
    const hasMemo = /useMemo|React\.memo|useCallback/g.test(content);
    
    if (hasExpensiveOperations && !hasMemo) {
      issues.push({
        type: 'missing_react_optimization',
        file: filePath,
        severity: 'medium',
        message: 'Component has expensive operations without memoization',
        recommendation: 'Use useMemo, useCallback, or React.memo for optimization',
        autoFixable: false,
        impact: 'render_performance'
      });
    }

    // Check for inline function/object creation in render
    const inlineFunctions = content.match(/onClick=\{[^}]*=>/g);
    if (inlineFunctions && inlineFunctions.length > 2) {
      issues.push({
        type: 'inline_function_creation',
        file: filePath,
        count: inlineFunctions.length,
        severity: 'low',
        message: 'Multiple inline functions in JSX may cause re-renders',
        recommendation: 'Extract functions or use useCallback',
        autoFixable: true,
        fix: {
          type: 'extract_inline_functions'
        },
        impact: 'render_performance'
      });
    }

    // Check for key prop issues
    const mapCalls = content.match(/\.map\([^)]*\)/g);
    if (mapCalls) {
      mapCalls.forEach(mapCall => {
        if (!mapCall.includes('key=')) {
          issues.push({
            type: 'missing_react_keys',
            file: filePath,
            code: mapCall,
            severity: 'medium',
            message: 'Map operation missing key prop',
            recommendation: 'Add unique key prop to mapped elements',
            autoFixable: false,
            impact: 'render_performance'
          });
        }
      });
    }

    return issues;
  }

  async detectMemoryLeaks() {
    console.log('🧠 Detecting potential memory leaks...');
    const issues = [];
    const sourceFiles = await this.getSourceFiles();

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Event listener without cleanup
      if (/addEventListener/.test(content) && !/removeEventListener/.test(content)) {
        issues.push({
          type: 'missing_event_cleanup',
          file: file,
          severity: 'high',
          message: 'Event listener added without cleanup',
          recommendation: 'Add removeEventListener in cleanup/useEffect return',
          autoFixable: true,
          fix: {
            type: 'add_event_cleanup'
          },
          impact: 'memory_usage'
        });
      }

      // Timer without cleanup
      if (/setInterval|setTimeout/.test(content) && !/clearInterval|clearTimeout/.test(content)) {
        const hasUseEffect = /useEffect/.test(content);
        if (hasUseEffect) {
          issues.push({
            type: 'missing_timer_cleanup',
            file: file,
            severity: 'high',
            message: 'Timer created without cleanup',
            recommendation: 'Clear timers in useEffect cleanup function',
            autoFixable: true,
            fix: {
              type: 'add_timer_cleanup'
            },
            impact: 'memory_usage'
          });
        }
      }

      // Large closure captures
      const closurePatterns = /useCallback\([^)]*\)|useMemo\([^)]*\)/g;
      const closures = content.match(closurePatterns);
      if (closures && closures.length > 5) {
        issues.push({
          type: 'excessive_closures',
          file: file,
          count: closures.length,
          severity: 'medium',
          message: 'High number of closures may retain memory',
          recommendation: 'Review closure dependencies and consider optimization',
          autoFixable: false,
          impact: 'memory_usage'
        });
      }
    }

    return issues;
  }

  async analyzeTreeShaking() {
    console.log('🌲 Analyzing tree shaking effectiveness...');
    const issues = [];

    // Check for barrel exports that prevent tree shaking
    const indexFiles = await this.findBarrelExports();
    
    for (const file of indexFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const reexports = (content.match(/export\s+\*\s+from/g) || []).length;
      
      if (reexports > 10) {
        issues.push({
          type: 'barrel_export_bloat',
          file: file,
          count: reexports,
          severity: 'medium',
          message: 'Large barrel export file may prevent tree shaking',
          recommendation: 'Consider direct imports instead of barrel exports',
          autoFixable: false,
          impact: 'bundle_size'
        });
      }
    }

    return issues;
  }

  async validatePerformanceBudgets() {
    console.log('💰 Validating performance budgets...');
    const issues = [];

    const bundleSize = await this.calculateTotalBundleSize();
    
    if (bundleSize > this.performanceBudgets.bundle.total) {
      issues.push({
        type: 'budget_violation_total',
        severity: 'critical',
        actual: bundleSize,
        budget: this.performanceBudgets.bundle.total,
        message: `Total bundle size (${Math.round(bundleSize/1000)}KB) exceeds budget`,
        recommendation: 'Implement code splitting and remove unused dependencies',
        autoFixable: false,
        impact: 'load_time'
      });
    }

    return issues;
  }

  generateOptimizationRecommendations(issues) {
    const recommendations = [];
    
    // Group issues by impact type
    const impactGroups = this.groupIssuesByImpact(issues);
    
    for (const [impact, impactIssues] of Object.entries(impactGroups)) {
      if (impactIssues.length > 0) {
        recommendations.push({
          impact,
          priority: this.getImpactPriority(impact),
          count: impactIssues.length,
          autoFixableCount: impactIssues.filter(i => i.autoFixable).length,
          description: this.getImpactDescription(impact),
          estimatedGain: this.estimatePerformanceGain(impact, impactIssues),
          actionItems: this.getImpactActionItems(impact, impactIssues)
        });
      }
    }
    
    return recommendations.sort((a, b) => this.priorityScore(b.priority) - this.priorityScore(a.priority));
  }

  // Auto-optimization capabilities
  async autoOptimize(issue) {
    console.log(`⚡ Auto-optimizing performance issue: ${issue.type} in ${issue.file}`);
    
    const optimizers = {
      'convert_to_dynamic_import': () => this.convertToDynamicImport(issue),
      'optimize_image': () => this.optimizeImage(issue),
      'add_lazy_loading': () => this.addLazyLoading(issue),
      'extract_inline_functions': () => this.extractInlineFunctions(issue),
      'add_event_cleanup': () => this.addEventCleanup(issue),
      'add_timer_cleanup': () => this.addTimerCleanup(issue)
    };
    
    const optimizer = optimizers[issue.fix?.type];
    if (optimizer) {
      return await optimizer();
    }
    
    throw new Error(`No auto-optimization available for ${issue.type}`);
  }

  async convertToDynamicImport(issue) {
    const content = fs.readFileSync(issue.file, 'utf8');
    let updatedContent = content;
    
    issue.fix.imports.forEach(importStatement => {
      const componentName = importStatement.match(/import\s+(\w+)/)[1];
      const componentPath = importStatement.match(/from\s+['"]([^'"]+)['"]/)[1];
      
      const dynamicImport = `const ${componentName} = React.lazy(() => import('${componentPath}'));`;
      updatedContent = updatedContent.replace(importStatement, dynamicImport);
    });
    
    // Add Suspense wrapper if not present
    if (!updatedContent.includes('Suspense')) {
      updatedContent = `import { Suspense } from 'react';\n${updatedContent}`;
    }
    
    fs.writeFileSync(issue.file, updatedContent);
    return true;
  }

  // Utility methods
  identifyHeavyDependencies(packageJson) {
    const heavyDeps = [
      { name: 'moment', estimatedSize: 288, alternative: 'date-fns' },
      { name: 'lodash', estimatedSize: 71, alternative: 'specific lodash functions' },
      { name: 'rxjs', estimatedSize: 200, alternative: 'consider if all operators are needed' },
      { name: 'antd', estimatedSize: 1200, alternative: 'tree shake or use lighter UI library' },
      { name: 'material-ui', estimatedSize: 900, alternative: 'tree shake or use MUI v5' }
    ];

    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    return heavyDeps.filter(dep => dependencies[dep.name]);
  }

  async calculateTotalBundleSize() {
    try {
      const buildDir = path.join(this.engine.projectRoot, 'build');
      if (fs.existsSync(buildDir)) {
        const jsFiles = execSync('find build -name "*.js" -exec du -b {} +', {
          cwd: this.engine.projectRoot,
          encoding: 'utf8'
        });
        
        const totalSize = jsFiles.split('\n')
          .filter(Boolean)
          .reduce((total, line) => {
            const size = parseInt(line.split('\t')[0]);
            return total + (isNaN(size) ? 0 : size);
          }, 0);
          
        return totalSize;
      }
    } catch (error) {
      // Fallback estimation
    }
    
    return 0;
  }

  calculatePerformanceScore(results) {
    let score = 100;
    
    // Deduct points for each issue type
    const deductions = {
      'critical': 20,
      'high': 10,
      'medium': 5,
      'low': 2
    };
    
    results.issues.forEach(issue => {
      score -= deductions[issue.severity] || 2;
    });
    
    return Math.max(0, score);
  }

  getOptimizationMessage(type) {
    const messages = {
      'inefficient_import': 'Inefficient import detected - importing entire library',
      'heavy_dependency': 'Heavy dependency that significantly impacts bundle size',
      'console_statements': 'Console statements should be removed in production',
      'debugger_statements': 'Debugger statements must be removed for production',
      'jsx_optimization': 'JSX could be optimized for better performance',
      'empty_array_state': 'Empty array state may cause unnecessary re-renders',
      'empty_dependency_effect': 'useEffect with empty dependency array'
    };
    
    return messages[type] || 'Performance optimization opportunity detected';
  }

  getOptimizationRecommendation(type) {
    const recommendations = {
      'inefficient_import': 'Use specific imports or tree-shakeable imports',
      'heavy_dependency': 'Consider lighter alternatives or lazy loading',
      'console_statements': 'Remove console.log statements',
      'debugger_statements': 'Remove debugger statements',
      'jsx_optimization': 'Use JSX transform optimization',
      'empty_array_state': 'Use useMemo for empty arrays or objects',
      'empty_dependency_effect': 'Review effect dependencies'
    };
    
    return recommendations[type] || 'Review and optimize this code';
  }

  async getSourceFiles() {
    try {
      const files = execSync('find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | grep -v node_modules', {
        cwd: this.engine.projectRoot,
        encoding: 'utf8'
      }).split('\n').filter(Boolean);
      
      return files.map(f => path.resolve(this.engine.projectRoot, f));
    } catch {
      return [];
    }
  }

  groupIssuesByImpact(issues) {
    return issues.reduce((groups, issue) => {
      const impact = issue.impact || 'other';
      if (!groups[impact]) {
        groups[impact] = [];
      }
      groups[impact].push(issue);
      return groups;
    }, {});
  }

  priorityScore(priority) {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[priority] || 0;
  }

  isOptimizationAutoFixable(type) {
    const autoFixable = [
      'console_statements',
      'debugger_statements',
      'add_lazy_loading',
      'extract_inline_functions',
      'add_event_cleanup',
      'add_timer_cleanup'
    ];
    
    return autoFixable.includes(type);
  }

  getPerformanceImpact(type) {
    const impactMap = {
      'inefficient_import': 'bundle_size',
      'heavy_dependency': 'bundle_size',
      'console_statements': 'runtime_performance',
      'debugger_statements': 'runtime_performance',
      'missing_react_optimization': 'render_performance',
      'missing_event_cleanup': 'memory_usage',
      'missing_timer_cleanup': 'memory_usage'
    };
    
    return impactMap[type] || 'other';
  }
}

module.exports = { PerformanceAgent };