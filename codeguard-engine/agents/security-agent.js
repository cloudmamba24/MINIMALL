#!/usr/bin/env node
/**
 * Security Agent - Advanced security vulnerability detection and hardening
 * 
 * Capabilities:
 * - OWASP Top 10 vulnerability scanning
 * - Dependency vulnerability analysis
 * - Code injection detection
 * - Authentication bypass detection
 * - Data exposure analysis
 * - Auto-hardening recommendations
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class SecurityAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'Security';
    this.capabilities = [
      'vulnerability_scanning',
      'dependency_analysis',
      'injection_detection',
      'auth_bypass_detection',
      'data_exposure_analysis',
      'auto_hardening'
    ];
    
    this.owaspTop10 = {
      'A01_broken_access_control': { severity: 'critical', category: 'access_control' },
      'A02_cryptographic_failures': { severity: 'high', category: 'cryptography' },
      'A03_injection': { severity: 'critical', category: 'injection' },
      'A04_insecure_design': { severity: 'high', category: 'design' },
      'A05_security_misconfiguration': { severity: 'high', category: 'configuration' },
      'A06_vulnerable_components': { severity: 'high', category: 'dependencies' },
      'A07_identification_failures': { severity: 'high', category: 'authentication' },
      'A08_software_integrity_failures': { severity: 'medium', category: 'integrity' },
      'A09_logging_monitoring_failures': { severity: 'medium', category: 'monitoring' },
      'A10_server_side_request_forgery': { severity: 'high', category: 'ssrf' }
    };
    
    this.dangerousPatterns = [
      { pattern: /eval\s*\(/, type: 'code_injection', severity: 'critical' },
      { pattern: /innerHTML\s*=.*\+/, type: 'xss_vulnerability', severity: 'high' },
      { pattern: /document\.write\s*\(/, type: 'dom_manipulation', severity: 'high' },
      { pattern: /dangerouslySetInnerHTML/, type: 'react_xss_risk', severity: 'medium' },
      { pattern: /localStorage\.setItem.*password/, type: 'credential_exposure', severity: 'critical' },
      { pattern: /sessionStorage\.setItem.*token/, type: 'token_exposure', severity: 'high' },
      { pattern: /console\.log.*password/, type: 'credential_logging', severity: 'high' },
      { pattern: /\.env.*=.*['"]\w+['"]/, type: 'hardcoded_secrets', severity: 'critical' }
    ];
  }

  async analyze() {
    console.log('🔒 Security Agent: OWASP Top 10 vulnerability analysis starting...');
    
    const results = {
      issues: [],
      metrics: {
        filesScanned: 0,
        vulnerabilitiesFound: 0,
        criticalVulnerabilities: 0,
        dependencyVulnerabilities: 0,
        owaspCoverage: {}
      },
      recommendations: []
    };

    // 1. Dependency vulnerability scan
    const depVulns = await this.scanDependencyVulnerabilities();
    results.issues.push(...depVulns);
    results.metrics.dependencyVulnerabilities = depVulns.length;

    // 2. Source code vulnerability scan
    const sourceFiles = await this.getSourceFiles();
    results.metrics.filesScanned = sourceFiles.length;
    
    for (const file of sourceFiles) {
      const fileVulns = await this.scanSourceFile(file);
      results.issues.push(...fileVulns);
    }

    // 3. Configuration security analysis
    const configVulns = await this.analyzeSecurityConfiguration();
    results.issues.push(...configVulns);

    // 4. Authentication & authorization analysis
    const authVulns = await this.analyzeAuthenticationSecurity();
    results.issues.push(...authVulns);

    // 5. API security analysis
    const apiVulns = await this.analyzeApiSecurity();
    results.issues.push(...apiVulns);

    // Calculate metrics
    results.metrics.vulnerabilitiesFound = results.issues.length;
    results.metrics.criticalVulnerabilities = results.issues.filter(i => i.severity === 'critical').length;
    results.metrics.owaspCoverage = this.calculateOwaspCoverage(results.issues);

    // Generate hardening recommendations
    results.recommendations = this.generateHardeningRecommendations(results.issues);

    console.log(`✅ Security Agent: Found ${results.issues.length} vulnerabilities (${results.metrics.criticalVulnerabilities} critical)`);
    
    return results;
  }

  async scanDependencyVulnerabilities() {
    console.log('📦 Scanning dependency vulnerabilities...');
    const vulnerabilities = [];

    try {
      // Run npm audit
      const auditOutput = execSync('npm audit --json', {
        cwd: this.engine.projectRoot,
        encoding: 'utf8'
      });
      
      const auditData = JSON.parse(auditOutput);
      
      if (auditData.vulnerabilities) {
        for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
          vulnerabilities.push({
            type: 'A06_vulnerable_components',
            package: packageName,
            severity: this.mapAuditSeverity(vulnData.severity),
            title: vulnData.title || 'Dependency vulnerability',
            description: vulnData.overview || 'Vulnerable dependency detected',
            version: vulnData.range,
            cwe: vulnData.cwe || [],
            cvss: vulnData.cvss || null,
            autoFixable: vulnData.fixAvailable || false,
            recommendation: vulnData.recommendation || `Update ${packageName} to a secure version`
          });
        }
      }

    } catch (error) {
      // npm audit might fail, try alternative approaches
      vulnerabilities.push({
        type: 'monitoring_failure',
        severity: 'medium',
        title: 'Dependency scanning failed',
        description: 'Unable to scan dependencies for vulnerabilities',
        recommendation: 'Manually run npm audit or install security scanning tools'
      });
    }

    return vulnerabilities;
  }

  async scanSourceFile(filePath) {
    const vulnerabilities = [];
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Pattern-based vulnerability detection
    this.dangerousPatterns.forEach(({ pattern, type, severity }) => {
      let match;
      let lineNumber = 0;
      
      for (const line of lines) {
        lineNumber++;
        if (pattern.test(line)) {
          vulnerabilities.push({
            type,
            file: filePath,
            line: lineNumber,
            severity,
            code: line.trim(),
            description: this.getVulnerabilityDescription(type),
            recommendation: this.getVulnerabilityFix(type),
            autoFixable: this.isAutoFixable(type),
            owaspCategory: this.getOwaspCategory(type)
          });
        }
      }
    });

    // Specific vulnerability patterns
    const specificVulns = await this.detectSpecificVulnerabilities(content, filePath);
    vulnerabilities.push(...specificVulns);

    return vulnerabilities;
  }

  async detectSpecificVulnerabilities(content, filePath) {
    const vulnerabilities = [];

    // SQL Injection detection
    const sqlPatterns = [
      /query.*\+.*req\.(body|params|query)/i,
      /execute.*\$\{.*req\./i,
      /SELECT.*\+.*user/i
    ];

    sqlPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        vulnerabilities.push({
          type: 'A03_injection',
          subtype: 'sql_injection',
          file: filePath,
          severity: 'critical',
          description: 'Potential SQL injection vulnerability detected',
          recommendation: 'Use parameterized queries or prepared statements',
          owaspCategory: 'injection',
          autoFixable: false
        });
      }
    });

    // NoSQL Injection detection
    const noSqlPatterns = [
      /find\(.*req\.(body|params|query)/i,
      /\$where.*user.*input/i
    ];

    noSqlPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        vulnerabilities.push({
          type: 'A03_injection',
          subtype: 'nosql_injection',
          file: filePath,
          severity: 'critical',
          description: 'Potential NoSQL injection vulnerability detected',
          recommendation: 'Validate and sanitize user inputs, use schema validation',
          owaspCategory: 'injection',
          autoFixable: false
        });
      }
    });

    // Command Injection detection
    const commandPatterns = [
      /exec\(.*req\./i,
      /spawn\(.*user/i,
      /system\(.*\+/i
    ];

    commandPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        vulnerabilities.push({
          type: 'A03_injection',
          subtype: 'command_injection',
          file: filePath,
          severity: 'critical',
          description: 'Potential command injection vulnerability detected',
          recommendation: 'Never execute user input directly, use input validation and sanitization',
          owaspCategory: 'injection',
          autoFixable: false
        });
      }
    });

    // Insecure Direct Object References
    if (content.includes('req.params.id') && !content.includes('authorization')) {
      vulnerabilities.push({
        type: 'A01_broken_access_control',
        subtype: 'idor',
        file: filePath,
        severity: 'high',
        description: 'Potential Insecure Direct Object Reference (IDOR)',
        recommendation: 'Implement proper authorization checks before accessing resources',
        owaspCategory: 'access_control',
        autoFixable: false
      });
    }

    // Hardcoded credentials
    const credentialPatterns = [
      /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
      /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
      /secret\s*[:=]\s*['"][^'"]+['"]/i,
      /token\s*[:=]\s*['"][^'"]{20,}['"]/i
    ];

    credentialPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        vulnerabilities.push({
          type: 'A02_cryptographic_failures',
          subtype: 'hardcoded_credentials',
          file: filePath,
          severity: 'critical',
          description: 'Hardcoded credentials detected',
          recommendation: 'Move credentials to environment variables or secure configuration',
          owaspCategory: 'cryptography',
          autoFixable: true
        });
      }
    });

    return vulnerabilities;
  }

  async analyzeSecurityConfiguration() {
    console.log('⚙️  Analyzing security configuration...');
    const vulnerabilities = [];

    // Check for security headers
    const middlewareFiles = await this.findMiddlewareFiles();
    
    for (const file of middlewareFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Missing security headers
      const securityHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security',
        'Content-Security-Policy'
      ];

      securityHeaders.forEach(header => {
        if (!content.includes(header)) {
          vulnerabilities.push({
            type: 'A05_security_misconfiguration',
            subtype: 'missing_security_headers',
            file: file,
            severity: 'medium',
            header: header,
            description: `Missing security header: ${header}`,
            recommendation: `Add ${header} header to prevent attacks`,
            owaspCategory: 'configuration',
            autoFixable: true
          });
        }
      });
    }

    // Check CORS configuration
    if (await this.hasCorsConfiguration()) {
      const corsConfig = await this.analyzeCorsConfiguration();
      if (corsConfig.tooPermissive) {
        vulnerabilities.push({
          type: 'A05_security_misconfiguration',
          subtype: 'permissive_cors',
          severity: 'high',
          description: 'CORS configuration too permissive',
          recommendation: 'Restrict CORS origins to specific domains',
          owaspCategory: 'configuration',
          autoFixable: true
        });
      }
    }

    return vulnerabilities;
  }

  async analyzeAuthenticationSecurity() {
    console.log('🔐 Analyzing authentication security...');
    const vulnerabilities = [];

    // Find authentication-related files
    const authFiles = await this.findAuthenticationFiles();
    
    for (const file of authFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Weak password policies
      if (content.includes('password') && !content.includes('bcrypt') && !content.includes('scrypt')) {
        vulnerabilities.push({
          type: 'A02_cryptographic_failures',
          subtype: 'weak_password_hashing',
          file: file,
          severity: 'critical',
          description: 'Passwords may not be properly hashed',
          recommendation: 'Use bcrypt, scrypt, or Argon2 for password hashing',
          owaspCategory: 'cryptography',
          autoFixable: false
        });
      }

      // Missing rate limiting
      if (content.includes('/login') && !content.includes('rate') && !content.includes('limit')) {
        vulnerabilities.push({
          type: 'A07_identification_failures',
          subtype: 'missing_rate_limiting',
          file: file,
          severity: 'high',
          description: 'Login endpoint missing rate limiting',
          recommendation: 'Implement rate limiting to prevent brute force attacks',
          owaspCategory: 'authentication',
          autoFixable: true
        });
      }

      // Insecure JWT handling
      if (content.includes('jwt') && content.includes('sign') && !content.includes('RS256')) {
        vulnerabilities.push({
          type: 'A02_cryptographic_failures',
          subtype: 'weak_jwt_algorithm',
          file: file,
          severity: 'high',
          description: 'JWT using potentially weak algorithm',
          recommendation: 'Use RS256 or ES256 for JWT signing',
          owaspCategory: 'cryptography',
          autoFixable: true
        });
      }
    }

    return vulnerabilities;
  }

  async analyzeApiSecurity() {
    console.log('🔌 Analyzing API security...');
    const vulnerabilities = [];

    // Find API routes
    const apiFiles = await this.findApiFiles();
    
    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Missing input validation
      if (content.includes('req.body') && !content.includes('validate') && !content.includes('schema')) {
        vulnerabilities.push({
          type: 'A03_injection',
          subtype: 'missing_input_validation',
          file: file,
          severity: 'high',
          description: 'API endpoint missing input validation',
          recommendation: 'Implement input validation using schemas (Joi, Yup, etc.)',
          owaspCategory: 'injection',
          autoFixable: true
        });
      }

      // Missing authentication
      if ((content.includes('DELETE') || content.includes('PUT') || content.includes('POST')) && 
          !content.includes('auth') && !content.includes('token')) {
        vulnerabilities.push({
          type: 'A01_broken_access_control',
          subtype: 'missing_authentication',
          file: file,
          severity: 'critical',
          description: 'Sensitive API endpoint missing authentication',
          recommendation: 'Add authentication middleware to protect sensitive endpoints',
          owaspCategory: 'access_control',
          autoFixable: true
        });
      }

      // Excessive data exposure
      if (content.includes('User') && content.includes('password') && content.includes('return')) {
        vulnerabilities.push({
          type: 'A01_broken_access_control',
          subtype: 'data_exposure',
          file: file,
          severity: 'high',
          description: 'API may be exposing sensitive user data',
          recommendation: 'Filter sensitive fields from API responses',
          owaspCategory: 'access_control',
          autoFixable: true
        });
      }
    }

    return vulnerabilities;
  }

  calculateOwaspCoverage(issues) {
    const coverage = {};
    
    Object.keys(this.owaspTop10).forEach(owaspId => {
      coverage[owaspId] = issues.filter(i => i.type === owaspId).length;
    });
    
    return coverage;
  }

  generateHardeningRecommendations(issues) {
    const recommendations = [];
    
    // Group by OWASP category
    const categories = this.groupByOwaspCategory(issues);
    
    for (const [category, categoryIssues] of Object.entries(categories)) {
      if (categoryIssues.length > 0) {
        recommendations.push({
          category,
          priority: this.getCategoryPriority(category),
          issueCount: categoryIssues.length,
          description: this.getCategoryDescription(category),
          actionItems: this.getCategoryActionItems(category, categoryIssues),
          estimatedEffort: this.estimateHardeningEffort(category, categoryIssues)
        });
      }
    }
    
    return recommendations.sort((a, b) => this.priorityScore(b.priority) - this.priorityScore(a.priority));
  }

  // Auto-hardening capabilities
  async autoHarden(vulnerability) {
    console.log(`🔒 Auto-hardening security vulnerability: ${vulnerability.type}`);
    
    const hardeningStrategies = {
      'missing_security_headers': () => this.addSecurityHeaders(vulnerability),
      'hardcoded_credentials': () => this.moveCredentialsToEnv(vulnerability),
      'missing_input_validation': () => this.addInputValidation(vulnerability),
      'permissive_cors': () => this.restrictCors(vulnerability),
      'missing_rate_limiting': () => this.addRateLimit(vulnerability)
    };
    
    const strategy = hardeningStrategies[vulnerability.subtype];
    if (strategy) {
      return await strategy();
    }
    
    throw new Error(`No auto-hardening available for ${vulnerability.type}/${vulnerability.subtype}`);
  }

  async addSecurityHeaders(vulnerability) {
    // Add security headers to middleware
    const middlewareContent = fs.readFileSync(vulnerability.file, 'utf8');
    
    const headerMap = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'"
    };
    
    const headerValue = headerMap[vulnerability.header];
    if (headerValue) {
      const headerCode = `res.setHeader('${vulnerability.header}', '${headerValue}');`;
      
      // Find appropriate place to insert header
      const updatedContent = middlewareContent.replace(
        /(export\s+async\s+function\s+\w+.*{)/,
        `$1\n  ${headerCode}`
      );
      
      fs.writeFileSync(vulnerability.file, updatedContent);
      return true;
    }
    
    return false;
  }

  // Utility methods
  mapAuditSeverity(npmSeverity) {
    const mapping = {
      'critical': 'critical',
      'high': 'high',
      'moderate': 'medium',
      'low': 'low'
    };
    return mapping[npmSeverity] || 'medium';
  }

  getVulnerabilityDescription(type) {
    const descriptions = {
      'code_injection': 'Code execution vulnerability through eval() usage',
      'xss_vulnerability': 'Cross-site scripting vulnerability through innerHTML',
      'credential_exposure': 'Sensitive credentials stored in browser storage',
      'credential_logging': 'Credentials being logged to console',
      'hardcoded_secrets': 'Secrets hardcoded in source code'
    };
    
    return descriptions[type] || 'Security vulnerability detected';
  }

  getVulnerabilityFix(type) {
    const fixes = {
      'code_injection': 'Avoid eval(), use safe alternatives like JSON.parse()',
      'xss_vulnerability': 'Use textContent or proper sanitization',
      'credential_exposure': 'Store sensitive data server-side only',
      'credential_logging': 'Remove credential logging in production',
      'hardcoded_secrets': 'Move secrets to environment variables'
    };
    
    return fixes[type] || 'Review and fix security vulnerability';
  }

  isAutoFixable(type) {
    const autoFixable = [
      'hardcoded_credentials',
      'missing_security_headers',
      'missing_input_validation',
      'permissive_cors',
      'missing_rate_limiting'
    ];
    
    return autoFixable.includes(type);
  }

  getOwaspCategory(type) {
    const categoryMap = {
      'code_injection': 'injection',
      'xss_vulnerability': 'injection',
      'credential_exposure': 'cryptography',
      'sql_injection': 'injection',
      'command_injection': 'injection',
      'idor': 'access_control',
      'hardcoded_credentials': 'cryptography'
    };
    
    return categoryMap[type] || 'other';
  }

  async getSourceFiles() {
    const { execSync } = require('child_process');
    
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

  async findMiddlewareFiles() {
    return this.findFilesByPattern(['middleware', 'server', 'app']);
  }

  async findAuthenticationFiles() {
    return this.findFilesByPattern(['auth', 'login', 'session', 'jwt', 'passport']);
  }

  async findApiFiles() {
    return this.findFilesByPattern(['api', 'route', 'controller', 'endpoint']);
  }

  async findFilesByPattern(patterns) {
    const allFiles = await this.getSourceFiles();
    return allFiles.filter(file => 
      patterns.some(pattern => 
        file.toLowerCase().includes(pattern.toLowerCase())
      )
    );
  }

  groupByOwaspCategory(issues) {
    return issues.reduce((groups, issue) => {
      const category = issue.owaspCategory || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(issue);
      return groups;
    }, {});
  }

  priorityScore(priority) {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[priority] || 0;
  }
}

// CLI functionality for standalone execution
async function runStandalone() {
  console.log('🛡️  SECURITY CODEGUARD AGENT');
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
    config = { agents: { security: { enabled: true, autofix: false, severity: 'medium' } } };
  }
  
  if (!config.agents.security.enabled) {
    console.log('❌ Security agent is disabled in configuration');
    return;
  }
  
  // Create mock engine for standalone operation
  const mockEngine = {
    projectRoot,
    state: { metrics: {} },
    emit: () => {}
  };
  
  const agent = new SecurityAgent(mockEngine);
  
  try {
    switch (mode) {
      case 'analyze':
        console.log('🔍 Running security analysis...');
        const results = await agent.analyze();
        printSecurityResults(results, config);
        process.exit(results.issues.length > 0 ? 1 : 0);
        break;
        
      case 'harden':
        if (!config.agents.security.autofix) {
          console.log('❌ Auto-hardening is disabled in configuration');
          process.exit(1);
        }
        console.log('🔒 Running security analysis and hardening...');
        const hardenResults = await runWithHardening(agent);
        printSecurityResults(hardenResults, config);
        process.exit(hardenResults.hardenedCount > 0 ? 0 : 1);
        break;
        
      case 'report':
        console.log('📊 Generating security report...');
        const reportResults = await agent.analyze();
        generateSecurityReport(reportResults, config);
        break;
        
      case 'deps':
        console.log('📦 Checking dependency vulnerabilities...');
        const depsResults = await agent.analyzeDependencies();
        printDependencyResults(depsResults, config);
        break;
        
      default:
        console.log('Usage: npm run guard:security [analyze|harden|report|deps]');
        console.log('  analyze - Run security analysis (default)');
        console.log('  harden  - Run analysis and attempt auto-hardening');
        console.log('  report  - Generate detailed security report');
        console.log('  deps    - Check dependency vulnerabilities only');
    }
  } catch (error) {
    console.error('💥 Security agent execution failed:', error.message);
    process.exit(1);
  }
}

async function runWithHardening(agent) {
  const results = await agent.analyze();
  let hardenedCount = 0;
  
  for (const issue of results.issues) {
    if (issue.autoFixable) {
      try {
        const hardened = await agent.autoHarden(issue);
        if (hardened) {
          console.log(`✅ Hardened: ${issue.description}`);
          hardenedCount++;
        }
      } catch (error) {
        console.log(`❌ Failed to harden: ${issue.description} - ${error.message}`);
      }
    }
  }
  
  return { ...results, hardenedCount };
}

function printSecurityResults(results, config) {
  console.log('\n📊 SECURITY ANALYSIS RESULTS');
  console.log('━'.repeat(40));
  console.log(`📁 Files scanned: ${results.metrics.filesScanned}`);
  console.log(`🚨 Vulnerabilities found: ${results.metrics.vulnerabilitiesFound}`);
  console.log(`⚠️  Critical: ${results.metrics.critical}`);
  console.log(`🟡 High: ${results.metrics.high}`);
  console.log(`🔧 Auto-fixable: ${results.metrics.autoFixable}`);
  
  if (results.hardenedCount !== undefined) {
    console.log(`🔒 Issues hardened: ${results.hardenedCount}`);
  }
  
  if (results.owaspCoverage) {
    console.log('\n🔍 OWASP TOP 10 COVERAGE:');
    Object.entries(results.owaspCoverage).forEach(([owasp, count]) => {
      if (count > 0) {
        console.log(`  ${owasp}: ${count} issues`);
      }
    });
  }
  
  if (config.outputFormat === 'json') {
    console.log('\n' + JSON.stringify(results, null, 2));
  } else if (results.issues.length > 0 && config.verbose) {
    console.log('\n🚨 SECURITY VULNERABILITIES:');
    results.issues.slice(0, 10).forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.type.toUpperCase()}`);
      console.log(`   File: ${issue.file}`);
      console.log(`   Severity: ${issue.severity}`);
      console.log(`   Description: ${issue.description}`);
      console.log(`   Recommendation: ${issue.recommendation}`);
      console.log(`   Auto-fixable: ${issue.autoFixable ? '✅' : '❌'}`);
    });
    
    if (results.issues.length > 10) {
      console.log(`\n... and ${results.issues.length - 10} more vulnerabilities`);
    }
  }
  
  if (results.hardening && results.hardening.length > 0) {
    console.log('\n💡 HARDENING RECOMMENDATIONS:');
    results.hardening.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.category}: ${rec.description}`);
      console.log(`   Priority: ${rec.priority} | Issues: ${rec.issueCount}`);
    });
  }
}

function printDependencyResults(results, config) {
  console.log('\n📦 DEPENDENCY VULNERABILITY RESULTS');
  console.log('━'.repeat(40));
  
  if (results.vulnerabilities && results.vulnerabilities.length > 0) {
    console.log(`🚨 Vulnerable packages: ${results.vulnerabilities.length}`);
    
    results.vulnerabilities.forEach((vuln, i) => {
      console.log(`\n${i + 1}. ${vuln.name} (${vuln.version})`);
      console.log(`   Severity: ${vuln.severity}`);
      console.log(`   Description: ${vuln.description}`);
      if (vuln.fixVersion) {
        console.log(`   Fix available: ${vuln.fixVersion}`);
      }
    });
  } else {
    console.log('✅ No known vulnerabilities in dependencies');
  }
}

function generateSecurityReport(results, config) {
  const reportData = {
    timestamp: new Date().toISOString(),
    agent: 'security',
    summary: results.metrics,
    vulnerabilities: results.issues,
    owaspCoverage: results.owaspCoverage,
    hardening: results.hardening
  };
  
  const reportDir = config.reporting?.outputDir || './codeguard-reports';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `security-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(`📄 Security report generated: ${reportPath}`);
}

// Run standalone if called directly
if (require.main === module) {
  runStandalone().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { SecurityAgent };