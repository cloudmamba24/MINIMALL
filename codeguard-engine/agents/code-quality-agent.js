/**
 * Code Quality Agent - Advanced code maintainability and design pattern analysis
 * 
 * Capabilities:
 * - Cyclomatic complexity analysis
 * - Code duplication detection
 * - Design pattern recognition and violations
 * - SOLID principles validation
 * - Code smell detection
 * - Technical debt quantification
 * - Refactoring opportunities identification
 * - Architecture quality assessment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class CodeQualityAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'Code Quality';
    this.capabilities = [
      'complexity_analysis',
      'duplication_detection',
      'design_pattern_analysis',
      'solid_principles_validation',
      'code_smell_detection',
      'technical_debt_quantification',
      'refactoring_identification',
      'architecture_assessment'
    ];
    
    this.complexityThresholds = {
      function: 10,        // Max cyclomatic complexity per function
      class: 20,          // Max complexity per class
      file: 50,           // Max complexity per file
      cognitiveComplexity: 15  // Max cognitive complexity
    };

    this.qualityMetrics = {
      maxFunctionLength: 50,      // Lines per function
      maxClassLength: 300,        // Lines per class
      maxFileLength: 500,         // Lines per file
      maxParameters: 5,           // Parameters per function
      maxNestingLevel: 4,         // Nesting depth
      minTestCoverage: 80,        // Percentage
      maxDuplicationLines: 10     // Duplicated lines threshold
    };

    this.codeSmells = [
      // Long parameter lists
      { pattern: /function\s+\w+\s*\([^)]{50,}\)/, type: 'long_parameter_list', severity: 'medium' },
      { pattern: /\w+\s*\([^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*\)/, type: 'too_many_parameters', severity: 'medium' },
      
      // Large classes/functions
      { pattern: /class\s+\w+[\s\S]{3000,}/, type: 'large_class', severity: 'high' },
      { pattern: /function\s+\w+[\s\S]{1000,}?(?=function|\nclass|\n$)/, type: 'long_method', severity: 'medium' },
      
      // Primitive obsession
      { pattern: /string\|string\|string/, type: 'primitive_obsession', severity: 'low' },
      
      // Feature envy (accessing another object's data frequently)
      { pattern: /(\w+)\.\w+\.\w+\.\w+/, type: 'feature_envy', severity: 'medium' },
      
      // Data clumps (same parameters appearing together)
      { pattern: /\(.*userId.*,.*userName.*,.*userEmail.*\)/, type: 'data_clump', severity: 'medium' },
      
      // Shotgun surgery indicators
      { pattern: /import.*\/.*\/.*\/.*\/.*\//, type: 'deep_import_paths', severity: 'low' },
      
      // Magic numbers
      { pattern: /[^\.]\b(3600|86400|1000|365|24|60)\b(?!\.\d)/, type: 'magic_numbers', severity: 'low' },
      
      // TODO/FIXME/HACK comments
      { pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)/gi, type: 'technical_debt_comment', severity: 'low' },
      
      // Nested conditionals
      { pattern: /if\s*\([^)]+\)\s*\{[^}]*if\s*\([^)]+\)\s*\{[^}]*if/, type: 'deeply_nested_conditionals', severity: 'medium' }
    ];

    this.designPatterns = {
      singleton: {
        indicators: [/private\s+constructor/, /static\s+instance/, /getInstance/],
        antipatterns: [/new\s+\w+\(\).*new\s+\w+\(\)/]
      },
      factory: {
        indicators: [/create\w+/, /make\w+/, /build\w+/],
        antipatterns: [/new\s+\w+.*new\s+\w+.*new\s+\w+/]
      },
      observer: {
        indicators: [/subscribe|unsubscribe|notify|addEventListener/],
        antipatterns: [/\.on\(.*,.*\).*\.on\(.*,.*\).*\.on\(/]
      }
    };

    this.solidPrinciples = {
      singleResponsibility: {
        violations: [
          /class\s+\w+[\s\S]*?(?:save|load|validate|format|send|receive)[\s\S]*?(?:save|load|validate|format|send|receive)/,
          /function\s+\w*(And|Or)\w*/
        ]
      },
      openClosed: {
        violations: [
          /if.*instanceof.*else.*instanceof/,
          /switch.*type.*case.*type/
        ]
      },
      liskovSubstitution: {
        violations: [
          /throw new Error.*not.*implemented/i,
          /super\.\w+\(\);[\s]*throw/
        ]
      },
      interfaceSegregation: {
        violations: [
          /interface\s+\w+[\s\S]{500,}/, // Large interfaces
          /implements.*{[\s\S]*?throw.*not.*supported/i
        ]
      },
      dependencyInversion: {
        violations: [
          /new\s+[A-Z]\w*Service\(/,
          /new\s+[A-Z]\w*Repository\(/
        ]
      }
    };
  }

  async analyze() {
    console.log('🎯 Code Quality Agent: Comprehensive quality analysis starting...');
    
    const results = {
      issues: [],
      metrics: {
        filesAnalyzed: 0,
        averageComplexity: 0,
        duplicatedLines: 0,
        codeSmells: 0,
        technicalDebtMinutes: 0,
        maintainabilityIndex: 0,
        qualityScore: 0
      },
      recommendations: [],
      techDebt: {
        total: 0,
        breakdown: {}
      }
    };

    // 1. Find all source files
    const sourceFiles = await this.getSourceFiles();
    results.metrics.filesAnalyzed = sourceFiles.length;

    if (sourceFiles.length === 0) {
      results.issues.push({
        type: 'no_source_files',
        severity: 'critical',
        message: 'No source files found for analysis',
        recommendation: 'Ensure source files are in the expected locations'
      });
      return results;
    }

    // 2. Complexity analysis
    const complexityAnalysis = await this.analyzeComplexity(sourceFiles);
    results.issues.push(...complexityAnalysis.issues);
    results.metrics.averageComplexity = complexityAnalysis.averageComplexity;

    // 3. Code duplication detection
    const duplicationAnalysis = await this.detectDuplication(sourceFiles);
    results.issues.push(...duplicationAnalysis.issues);
    results.metrics.duplicatedLines = duplicationAnalysis.totalDuplicatedLines;

    // 4. Code smell detection
    let totalCodeSmells = 0;
    for (const file of sourceFiles) {
      const smellAnalysis = await this.detectCodeSmells(file);
      results.issues.push(...smellAnalysis);
      totalCodeSmells += smellAnalysis.length;
    }
    results.metrics.codeSmells = totalCodeSmells;

    // 5. Design pattern analysis
    for (const file of sourceFiles) {
      const patternAnalysis = await this.analyzeDesignPatterns(file);
      results.issues.push(...patternAnalysis);
    }

    // 6. SOLID principles validation
    for (const file of sourceFiles) {
      const solidAnalysis = await this.validateSOLIDPrinciples(file);
      results.issues.push(...solidAnalysis);
    }

    // 7. Architecture quality assessment
    const architectureAnalysis = await this.assessArchitectureQuality(sourceFiles);
    results.issues.push(...architectureAnalysis);

    // 8. Technical debt quantification
    const techDebtAnalysis = this.quantifyTechnicalDebt(results.issues);
    results.techDebt = techDebtAnalysis;
    results.metrics.technicalDebtMinutes = techDebtAnalysis.total;

    // 9. Calculate quality scores
    results.metrics.maintainabilityIndex = this.calculateMaintainabilityIndex(results);
    results.metrics.qualityScore = this.calculateQualityScore(results);

    // 10. Generate recommendations
    results.recommendations = this.generateQualityRecommendations(results.issues);

    console.log(`✅ Code Quality Agent: Analyzed ${results.metrics.filesAnalyzed} files. Quality Score: ${results.metrics.qualityScore}/100`);
    
    return results;
  }

  async analyzeComplexity(sourceFiles) {
    console.log('🧮 Analyzing cyclomatic complexity...');
    const analysis = { issues: [], totalComplexity: 0 };

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const fileComplexity = this.calculateFileComplexity(content, file);
      
      analysis.totalComplexity += fileComplexity.total;
      
      // Check file complexity
      if (fileComplexity.total > this.complexityThresholds.file) {
        analysis.issues.push({
          type: 'high_file_complexity',
          file: file,
          complexity: fileComplexity.total,
          threshold: this.complexityThresholds.file,
          severity: fileComplexity.total > this.complexityThresholds.file * 2 ? 'high' : 'medium',
          message: `File complexity (${fileComplexity.total}) exceeds threshold`,
          recommendation: 'Break down file into smaller modules',
          autoFixable: false,
          refactoringEffort: this.estimateRefactoringEffort('file_split', fileComplexity.total)
        });
      }

      // Check function complexities
      fileComplexity.functions.forEach(func => {
        if (func.complexity > this.complexityThresholds.function) {
          analysis.issues.push({
            type: 'high_function_complexity',
            file: file,
            function: func.name,
            complexity: func.complexity,
            threshold: this.complexityThresholds.function,
            severity: func.complexity > this.complexityThresholds.function * 2 ? 'high' : 'medium',
            message: `Function ${func.name} complexity (${func.complexity}) exceeds threshold`,
            recommendation: 'Break down function into smaller functions',
            autoFixable: false,
            refactoringEffort: this.estimateRefactoringEffort('function_split', func.complexity)
          });
        }
      });

      // Check class complexities
      fileComplexity.classes.forEach(cls => {
        if (cls.complexity > this.complexityThresholds.class) {
          analysis.issues.push({
            type: 'high_class_complexity',
            file: file,
            class: cls.name,
            complexity: cls.complexity,
            threshold: this.complexityThresholds.class,
            severity: cls.complexity > this.complexityThresholds.class * 2 ? 'high' : 'medium',
            message: `Class ${cls.name} complexity (${cls.complexity}) exceeds threshold`,
            recommendation: 'Extract responsibilities into separate classes',
            autoFixable: false,
            refactoringEffort: this.estimateRefactoringEffort('class_split', cls.complexity)
          });
        }
      });
    }

    const averageComplexity = sourceFiles.length > 0 ? analysis.totalComplexity / sourceFiles.length : 0;
    analysis.averageComplexity = Math.round(averageComplexity * 100) / 100;

    return analysis;
  }

  async detectDuplication(sourceFiles) {
    console.log('👥 Detecting code duplication...');
    const analysis = { issues: [], totalDuplicatedLines: 0 };

    // Simple duplication detection using line hashing
    const lineHashes = new Map();
    const duplicateGroups = new Map();

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, lineNumber) => {
        const trimmedLine = line.trim();
        if (trimmedLine.length < 10 || trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
          return; // Skip short lines and comments
        }

        const hash = crypto.createHash('md5').update(trimmedLine).digest('hex');
        
        if (!lineHashes.has(hash)) {
          lineHashes.set(hash, []);
        }
        
        lineHashes.get(hash).push({
          file: file,
          line: lineNumber + 1,
          content: trimmedLine
        });
      });
    }

    // Find duplicates
    let duplicatedLines = 0;
    lineHashes.forEach((occurrences, hash) => {
      if (occurrences.length > 1) {
        duplicatedLines += occurrences.length;
        
        // Group nearby duplicates
        const groups = this.groupNearbyDuplicates(occurrences);
        
        groups.forEach(group => {
          if (group.length >= this.qualityMetrics.maxDuplicationLines) {
            analysis.issues.push({
              type: 'code_duplication',
              files: group.map(item => item.file),
              lines: group.map(item => item.line),
              duplicatedLines: group.length,
              severity: group.length > 20 ? 'high' : 'medium',
              message: `Code duplication found across ${group.length} lines`,
              recommendation: 'Extract duplicated code into a shared function or module',
              autoFixable: false,
              refactoringEffort: this.estimateRefactoringEffort('extract_method', group.length)
            });
          }
        });
      }
    });

    analysis.totalDuplicatedLines = duplicatedLines;

    return analysis;
  }

  async detectCodeSmells(filePath) {
    const issues = [];
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Pattern-based code smell detection
    this.codeSmells.forEach(({ pattern, type, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            type: `code_smell_${type}`,
            file: filePath,
            code: match.substring(0, 100), // First 100 chars
            severity,
            message: this.getCodeSmellMessage(type),
            recommendation: this.getCodeSmellRecommendation(type),
            autoFixable: this.isCodeSmellAutoFixable(type),
            fix: this.getCodeSmellFix(type),
            refactoringEffort: this.estimateRefactoringEffort(type, 1)
          });
        });
      }
    });

    // File-level analysis
    if (lines.length > this.qualityMetrics.maxFileLength) {
      issues.push({
        type: 'code_smell_large_file',
        file: filePath,
        lines: lines.length,
        severity: 'medium',
        message: `File is too large (${lines.length} lines)`,
        recommendation: 'Split file into smaller, focused modules',
        autoFixable: false,
        refactoringEffort: this.estimateRefactoringEffort('file_split', lines.length)
      });
    }

    // Check for deep nesting
    const maxNesting = this.calculateMaxNesting(content);
    if (maxNesting > this.qualityMetrics.maxNestingLevel) {
      issues.push({
        type: 'code_smell_deep_nesting',
        file: filePath,
        nestingLevel: maxNesting,
        severity: 'medium',
        message: `Deep nesting detected (${maxNesting} levels)`,
        recommendation: 'Reduce nesting using early returns or guard clauses',
        autoFixable: true,
        fix: { type: 'reduce_nesting' },
        refactoringEffort: this.estimateRefactoringEffort('reduce_nesting', maxNesting)
      });
    }

    return issues;
  }

  async analyzeDesignPatterns(filePath) {
    const issues = [];
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for design pattern violations
    Object.entries(this.designPatterns).forEach(([patternName, pattern]) => {
      // Check if pattern is being used
      const hasPattern = pattern.indicators.some(indicator => indicator.test(content));
      
      if (hasPattern) {
        // Check for antipatterns
        const violations = pattern.antipatterns.filter(antipattern => antipattern.test(content));
        
        violations.forEach(violation => {
          issues.push({
            type: 'design_pattern_violation',
            pattern: patternName,
            file: filePath,
            severity: 'medium',
            message: `${patternName} pattern implemented incorrectly`,
            recommendation: `Review ${patternName} pattern implementation`,
            autoFixable: false,
            refactoringEffort: this.estimateRefactoringEffort('pattern_fix', 1)
          });
        });
      }
    });

    return issues;
  }

  async validateSOLIDPrinciples(filePath) {
    const issues = [];
    const content = fs.readFileSync(filePath, 'utf8');

    // Check each SOLID principle
    Object.entries(this.solidPrinciples).forEach(([principle, rules]) => {
      rules.violations.forEach(violationPattern => {
        if (violationPattern.test(content)) {
          issues.push({
            type: 'solid_principle_violation',
            principle: principle,
            file: filePath,
            severity: 'medium',
            message: `${this.formatPrincipleName(principle)} principle violation`,
            recommendation: `Refactor to comply with ${this.formatPrincipleName(principle)}`,
            autoFixable: false,
            refactoringEffort: this.estimateRefactoringEffort('solid_fix', 1)
          });
        }
      });
    });

    return issues;
  }

  async assessArchitectureQuality(sourceFiles) {
    console.log('🏗️ Assessing architecture quality...');
    const issues = [];

    // Check for circular imports
    const importGraph = await this.buildImportGraph(sourceFiles);
    const circularImports = this.findCircularImports(importGraph);
    
    circularImports.forEach(cycle => {
      issues.push({
        type: 'circular_import',
        cycle: cycle,
        severity: 'high',
        message: `Circular import detected: ${cycle.join(' -> ')}`,
        recommendation: 'Refactor to eliminate circular dependencies',
        autoFixable: false,
        refactoringEffort: this.estimateRefactoringEffort('eliminate_circular', cycle.length)
      });
    });

    // Check for God objects (files importing too many things)
    sourceFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const imports = (content.match(/import.*from/g) || []).length;
      
      if (imports > 15) {
        issues.push({
          type: 'god_object',
          file: file,
          imports: imports,
          severity: 'medium',
          message: `File has too many imports (${imports})`,
          recommendation: 'Split file or reduce dependencies',
          autoFixable: false,
          refactoringEffort: this.estimateRefactoringEffort('split_god_object', imports)
        });
      }
    });

    // Check for missing abstractions
    const missingAbstractions = await this.findMissingAbstractions(sourceFiles);
    issues.push(...missingAbstractions);

    return issues;
  }

  quantifyTechnicalDebt(issues) {
    const techDebt = {
      total: 0,
      breakdown: {}
    };

    issues.forEach(issue => {
      const effort = issue.refactoringEffort || this.estimateRefactoringEffort(issue.type, 1);
      const category = this.getDebtCategory(issue.type);
      
      techDebt.total += effort;
      
      if (!techDebt.breakdown[category]) {
        techDebt.breakdown[category] = 0;
      }
      techDebt.breakdown[category] += effort;
    });

    return techDebt;
  }

  calculateMaintainabilityIndex(results) {
    // Simplified maintainability index calculation
    // Based on Halstead metrics, cyclomatic complexity, and lines of code
    
    let baseScore = 100;
    
    // Deduct for complexity
    if (results.metrics.averageComplexity > 10) {
      baseScore -= (results.metrics.averageComplexity - 10) * 2;
    }
    
    // Deduct for code smells
    baseScore -= Math.min(results.metrics.codeSmells * 0.5, 20);
    
    // Deduct for duplication
    if (results.metrics.duplicatedLines > 100) {
      baseScore -= Math.min((results.metrics.duplicatedLines - 100) / 10, 15);
    }
    
    return Math.max(0, Math.min(100, Math.round(baseScore)));
  }

  calculateQualityScore(results) {
    let score = 100;
    
    // Weight different types of issues
    const weights = {
      'critical': 25,
      'high': 15,
      'medium': 8,
      'low': 3
    };
    
    results.issues.forEach(issue => {
      score -= weights[issue.severity] || 5;
    });
    
    // Bonus for good metrics
    if (results.metrics.averageComplexity < 5) score += 5;
    if (results.metrics.duplicatedLines < 50) score += 5;
    if (results.metrics.maintainabilityIndex > 80) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  generateQualityRecommendations(issues) {
    const recommendations = [];
    
    // Group issues by category
    const categories = this.groupIssuesByCategory(issues);
    
    Object.entries(categories).forEach(([category, categoryIssues]) => {
      if (categoryIssues.length > 0) {
        recommendations.push({
          category,
          priority: this.getCategoryPriority(category),
          count: categoryIssues.length,
          totalEffort: categoryIssues.reduce((sum, issue) => sum + (issue.refactoringEffort || 30), 0),
          description: this.getCategoryDescription(category),
          actionItems: this.getCategoryActionItems(category, categoryIssues),
          impact: this.getCategoryImpact(category)
        });
      }
    });
    
    return recommendations.sort((a, b) => this.priorityScore(b.priority) - this.priorityScore(a.priority));
  }

  // Auto-fix capabilities (limited for code quality)
  async autoFix(issue) {
    console.log(`🎯 Auto-fixing code quality issue: ${issue.type} in ${issue.file}`);
    
    const fixers = {
      'reduce_nesting': () => this.reduceNesting(issue),
      'extract_magic_numbers': () => this.extractMagicNumbers(issue),
      'add_missing_docs': () => this.addMissingDocumentation(issue)
    };
    
    const fixer = fixers[issue.fix?.type];
    if (fixer) {
      return await fixer();
    }
    
    throw new Error(`No auto-fix available for ${issue.type}`);
  }

  // Utility methods
  calculateFileComplexity(content, filePath) {
    const complexity = {
      total: 1, // Base complexity
      functions: [],
      classes: []
    };

    // Count decision points (simplified)
    const decisionPoints = [
      /if\s*\(/g,
      /else\s*if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /catch\s*\(/g,
      /case\s+/g,
      /\?\s*:/g, // Ternary
      /&&/g,
      /\|\|/g
    ];

    decisionPoints.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity.total += matches.length;
      }
    });

    // Extract function complexities (simplified)
    const functionMatches = content.matchAll(/function\s+(\w+)[\s\S]*?(?=function|\nclass|\n$|$)/g);
    for (const match of functionMatches) {
      const funcContent = match[0];
      let funcComplexity = 1;
      
      decisionPoints.forEach(pattern => {
        const matches = funcContent.match(pattern);
        if (matches) {
          funcComplexity += matches.length;
        }
      });

      complexity.functions.push({
        name: match[1],
        complexity: funcComplexity
      });
    }

    return complexity;
  }

  calculateMaxNesting(content) {
    let maxNesting = 0;
    let currentNesting = 0;
    
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      
      currentNesting += openBraces - closeBraces;
      maxNesting = Math.max(maxNesting, currentNesting);
    });
    
    return maxNesting;
  }

  groupNearbyDuplicates(occurrences) {
    // Group occurrences that are close to each other
    const groups = [];
    let currentGroup = [occurrences[0]];
    
    for (let i = 1; i < occurrences.length; i++) {
      const current = occurrences[i];
      const last = currentGroup[currentGroup.length - 1];
      
      if (current.file === last.file && Math.abs(current.line - last.line) <= 5) {
        currentGroup.push(current);
      } else {
        if (currentGroup.length >= this.qualityMetrics.maxDuplicationLines) {
          groups.push(currentGroup);
        }
        currentGroup = [current];
      }
    }
    
    if (currentGroup.length >= this.qualityMetrics.maxDuplicationLines) {
      groups.push(currentGroup);
    }
    
    return groups;
  }

  estimateRefactoringEffort(type, magnitude) {
    const baseEfforts = {
      'file_split': 60,        // 60 minutes base
      'function_split': 30,    // 30 minutes base
      'class_split': 90,       // 90 minutes base
      'extract_method': 20,    // 20 minutes base
      'reduce_nesting': 15,    // 15 minutes base
      'pattern_fix': 45,       // 45 minutes base
      'solid_fix': 60,         // 60 minutes base
      'eliminate_circular': 120 // 120 minutes base
    };

    const baseEffort = baseEfforts[type] || 30;
    const complexityMultiplier = Math.log10(magnitude + 1);
    
    return Math.round(baseEffort * complexityMultiplier);
  }

  getCodeSmellMessage(type) {
    const messages = {
      'long_parameter_list': 'Function has too many parameters',
      'too_many_parameters': 'Excessive parameter count detected',
      'large_class': 'Class is too large and complex',
      'long_method': 'Method is too long and complex',
      'feature_envy': 'Method accessing other object\'s data excessively',
      'data_clump': 'Data clump - same parameters appear together',
      'magic_numbers': 'Magic numbers should be extracted to constants',
      'technical_debt_comment': 'Technical debt comment indicates unfinished work',
      'deeply_nested_conditionals': 'Deeply nested conditionals reduce readability'
    };
    
    return messages[type] || 'Code quality issue detected';
  }

  getDebtCategory(issueType) {
    const categoryMap = {
      'high_file_complexity': 'complexity',
      'high_function_complexity': 'complexity',
      'code_duplication': 'duplication',
      'code_smell_': 'maintainability',
      'solid_principle_violation': 'design',
      'circular_import': 'architecture'
    };
    
    for (const [prefix, category] of Object.entries(categoryMap)) {
      if (issueType.includes(prefix)) {
        return category;
      }
    }
    
    return 'other';
  }

  formatPrincipleName(principle) {
    const names = {
      'singleResponsibility': 'Single Responsibility Principle',
      'openClosed': 'Open/Closed Principle',
      'liskovSubstitution': 'Liskov Substitution Principle',
      'interfaceSegregation': 'Interface Segregation Principle',
      'dependencyInversion': 'Dependency Inversion Principle'
    };
    
    return names[principle] || principle;
  }

  async getSourceFiles() {
    try {
      const files = execSync('find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | grep -v node_modules | grep -v ".test." | grep -v ".spec."', {
        cwd: this.engine.projectRoot,
        encoding: 'utf8'
      }).split('\n').filter(Boolean);
      
      return files.map(f => path.resolve(this.engine.projectRoot, f));
    } catch {
      return [];
    }
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
      'high_file_complexity': 'complexity',
      'high_function_complexity': 'complexity',
      'high_class_complexity': 'complexity',
      'code_duplication': 'duplication',
      'code_smell_': 'maintainability',
      'design_pattern_violation': 'design',
      'solid_principle_violation': 'design',
      'circular_import': 'architecture',
      'god_object': 'architecture'
    };
    
    for (const [prefix, category] of Object.entries(categoryMap)) {
      if (type.includes(prefix)) {
        return category;
      }
    }
    
    return 'other';
  }

  priorityScore(priority) {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[priority] || 0;
  }

  isCodeSmellAutoFixable(type) {
    const autoFixable = [
      'magic_numbers',
      'deeply_nested_conditionals',
      'technical_debt_comment'
    ];
    
    return autoFixable.includes(type);
  }

  getCategoryPriority(category) {
    const priorities = {
      'complexity': 'high',
      'architecture': 'high',
      'design': 'medium',
      'duplication': 'medium',
      'maintainability': 'low'
    };
    
    return priorities[category] || 'low';
  }
}

module.exports = { CodeQualityAgent };