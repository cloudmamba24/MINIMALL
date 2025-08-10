/**
 * Dependency Agent - Advanced package management and dependency analysis
 * 
 * Capabilities:
 * - Outdated package detection and upgrade recommendations
 * - License compliance and conflict detection
 * - Dependency vulnerability scanning (security overlap)
 * - Circular dependency detection
 * - Bundle impact analysis for dependencies
 * - Unused dependency cleanup
 * - Version conflict resolution
 * - Supply chain security analysis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class DependencyAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'Dependency';
    this.capabilities = [
      'outdated_package_detection',
      'license_compliance_analysis',
      'dependency_vulnerability_scanning',
      'circular_dependency_detection',
      'unused_dependency_cleanup',
      'version_conflict_resolution',
      'bundle_impact_analysis',
      'supply_chain_security'
    ];
    
    this.licenseCategories = {
      permissive: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'],
      copyleft_weak: ['LGPL-2.1', 'LGPL-3.0', 'MPL-2.0'],
      copyleft_strong: ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0'],
      proprietary: ['UNLICENSED', 'SEE LICENSE IN'],
      unknown: ['UNKNOWN', 'UNLICENSE', '']
    };

    this.riskThresholds = {
      outdated: {
        major: 365,      // Days behind on major versions
        minor: 180,      // Days behind on minor versions  
        patch: 90        // Days behind on patch versions
      },
      maintenance: {
        lastUpdateDays: 730,    // 2 years since last update
        minStars: 100,          // Minimum GitHub stars
        minDownloads: 1000      // Minimum weekly downloads
      },
      security: {
        criticalVulns: 0,       // No critical vulnerabilities allowed
        highVulns: 2,           // Max 2 high vulnerabilities
        mediumVulns: 5          // Max 5 medium vulnerabilities
      }
    };

    this.problematicPatterns = [
      { pattern: /node_modules\/[^\/]+\/node_modules/, type: 'nested_node_modules', severity: 'medium' },
      { pattern: /require\(['"][\.\/]+node_modules/, type: 'direct_node_modules_access', severity: 'high' },
      { pattern: /package-lock\.json.*"version":\s*""/, type: 'empty_lockfile_version', severity: 'medium' },
    ];
  }

  async analyze() {
    console.log('📦 Dependency Agent: Comprehensive package analysis starting...');
    
    const results = {
      issues: [],
      metrics: {
        totalDependencies: 0,
        outdatedDependencies: 0,
        vulnerableDependencies: 0,
        unusedDependencies: 0,
        licenseViolations: 0,
        circularDependencies: 0,
        riskScore: 0
      },
      recommendations: [],
      packageManagers: []
    };

    // 1. Detect package managers and analyze package files
    const packageManagers = await this.detectPackageManagers();
    results.packageManagers = packageManagers;

    if (packageManagers.length === 0) {
      results.issues.push({
        type: 'no_package_manager',
        severity: 'high',
        message: 'No package manager configuration found',
        recommendation: 'Initialize package.json with npm init or yarn init',
        autoFixable: true,
        fix: { type: 'init_package_json' }
      });
      
      console.log('❌ Dependency Agent: No package manager found');
      return results;
    }

    // 2. Analyze package.json structure and dependencies
    for (const pm of packageManagers) {
      const packageAnalysis = await this.analyzePackageFile(pm);
      results.issues.push(...packageAnalysis.issues);
      results.metrics.totalDependencies += packageAnalysis.totalDeps;
    }

    // 3. Outdated packages analysis
    const outdatedAnalysis = await this.analyzeOutdatedPackages();
    results.issues.push(...outdatedAnalysis);
    results.metrics.outdatedDependencies = outdatedAnalysis.length;

    // 4. License compliance analysis  
    const licenseAnalysis = await this.analyzeLicenseCompliance();
    results.issues.push(...licenseAnalysis.issues);
    results.metrics.licenseViolations = licenseAnalysis.violations;

    // 5. Unused dependencies detection
    const unusedAnalysis = await this.detectUnusedDependencies();
    results.issues.push(...unusedAnalysis);
    results.metrics.unusedDependencies = unusedAnalysis.length;

    // 6. Circular dependency detection
    const circularAnalysis = await this.detectCircularDependencies();
    results.issues.push(...circularAnalysis);
    results.metrics.circularDependencies = circularAnalysis.length;

    // 7. Version conflict analysis
    const conflictAnalysis = await this.analyzeVersionConflicts();
    results.issues.push(...conflictAnalysis);

    // 8. Supply chain security analysis
    const supplyChainAnalysis = await this.analyzeSupplyChainSecurity();
    results.issues.push(...supplyChainAnalysis);

    // 9. Bundle impact analysis
    const bundleImpactAnalysis = await this.analyzeBundleImpact();
    results.issues.push(...bundleImpactAnalysis);

    // 10. Package maintenance analysis
    const maintenanceAnalysis = await this.analyzePackageMaintenance();
    results.issues.push(...maintenanceAnalysis);

    // Calculate risk score
    results.metrics.riskScore = this.calculateDependencyRiskScore(results);

    // Generate recommendations
    results.recommendations = this.generateDependencyRecommendations(results.issues);

    console.log(`✅ Dependency Agent: Analyzed ${results.metrics.totalDependencies} dependencies. Risk Score: ${results.metrics.riskScore}/100`);
    
    return results;
  }

  async detectPackageManagers() {
    const packageManagers = [];
    const root = this.engine.projectRoot;

    // Check for different package managers
    const managers = [
      { name: 'npm', files: ['package.json'], lockfiles: ['package-lock.json'] },
      { name: 'yarn', files: ['package.json'], lockfiles: ['yarn.lock'] },
      { name: 'pnpm', files: ['package.json'], lockfiles: ['pnpm-lock.yaml'] },
      { name: 'bun', files: ['package.json'], lockfiles: ['bun.lockb'] }
    ];

    for (const manager of managers) {
      const hasPackageFile = manager.files.some(file => 
        fs.existsSync(path.join(root, file))
      );
      
      const hasLockFile = manager.lockfiles.some(file => 
        fs.existsSync(path.join(root, file))
      );

      if (hasPackageFile) {
        packageManagers.push({
          name: manager.name,
          packageFile: path.join(root, manager.files[0]),
          lockFile: hasLockFile ? path.join(root, manager.lockfiles.find(f => 
            fs.existsSync(path.join(root, f))
          )) : null,
          isActive: hasLockFile
        });
      }
    }

    return packageManagers;
  }

  async analyzePackageFile(packageManager) {
    console.log(`📋 Analyzing ${packageManager.name} package file...`);
    const analysis = { issues: [], totalDeps: 0 };
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageManager.packageFile, 'utf8'));
      
      // Count dependencies
      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};
      const peerDeps = packageJson.peerDependencies || {};
      analysis.totalDeps = Object.keys(deps).length + Object.keys(devDeps).length + Object.keys(peerDeps).length;

      // Check package.json structure
      if (!packageJson.name) {
        analysis.issues.push({
          type: 'missing_package_name',
          severity: 'medium',
          message: 'package.json missing name field',
          recommendation: 'Add name field to package.json',
          autoFixable: true,
          fix: { type: 'add_package_name' }
        });
      }

      if (!packageJson.version) {
        analysis.issues.push({
          type: 'missing_package_version',
          severity: 'medium',
          message: 'package.json missing version field',
          recommendation: 'Add version field to package.json',
          autoFixable: true,
          fix: { type: 'add_package_version' }
        });
      }

      // Check for scripts
      if (!packageJson.scripts || Object.keys(packageJson.scripts).length === 0) {
        analysis.issues.push({
          type: 'missing_scripts',
          severity: 'low',
          message: 'package.json has no scripts defined',
          recommendation: 'Add common scripts like build, test, dev',
          autoFixable: true,
          fix: { type: 'add_basic_scripts' }
        });
      }

      // Check for development vs production dependency misplacement
      const devInProd = this.findMisplacedDependencies(deps, 'production');
      const prodInDev = this.findMisplacedDependencies(devDeps, 'development');

      devInProd.forEach(dep => {
        analysis.issues.push({
          type: 'misplaced_dev_dependency',
          package: dep,
          severity: 'medium',
          message: `Development dependency ${dep} in production dependencies`,
          recommendation: `Move ${dep} to devDependencies`,
          autoFixable: true,
          fix: { type: 'move_to_dev_dependencies', package: dep }
        });
      });

      prodInDev.forEach(dep => {
        analysis.issues.push({
          type: 'misplaced_prod_dependency',
          package: dep,
          severity: 'medium',
          message: `Production dependency ${dep} in development dependencies`,
          recommendation: `Move ${dep} to dependencies`,
          autoFixable: true,
          fix: { type: 'move_to_prod_dependencies', package: dep }
        });
      });

      // Check for version ranges that are too permissive
      const permissiveVersions = this.findPermissiveVersions(deps, devDeps);
      permissiveVersions.forEach(({ package: pkg, version, reason }) => {
        analysis.issues.push({
          type: 'permissive_version_range',
          package: pkg,
          version: version,
          severity: 'low',
          message: `Permissive version range for ${pkg}: ${version}`,
          reason: reason,
          recommendation: 'Use more specific version ranges for stability',
          autoFixable: false
        });
      });

    } catch (error) {
      analysis.issues.push({
        type: 'package_file_parse_error',
        severity: 'critical',
        message: 'Failed to parse package.json',
        error: error.message,
        recommendation: 'Fix JSON syntax errors in package.json',
        autoFixable: false
      });
    }

    return analysis;
  }

  async analyzeOutdatedPackages() {
    console.log('⏰ Analyzing outdated packages...');
    const issues = [];

    try {
      // Try npm outdated first
      let outdatedOutput;
      try {
        outdatedOutput = execSync('npm outdated --json', {
          cwd: this.engine.projectRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch (error) {
        outdatedOutput = error.stdout; // npm outdated exits with code 1 when there are outdated packages
      }

      if (outdatedOutput) {
        const outdatedData = JSON.parse(outdatedOutput);
        
        Object.entries(outdatedData).forEach(([packageName, info]) => {
          const current = info.current;
          const wanted = info.wanted;
          const latest = info.latest;
          
          const updateType = this.determineUpdateType(current, latest);
          const severity = this.getUpdateSeverity(updateType);
          
          issues.push({
            type: 'outdated_package',
            package: packageName,
            currentVersion: current,
            wantedVersion: wanted,
            latestVersion: latest,
            updateType: updateType,
            severity: severity,
            message: `${packageName} is outdated (${current} -> ${latest})`,
            recommendation: `Update to latest version: npm install ${packageName}@${latest}`,
            autoFixable: updateType === 'patch' || updateType === 'minor',
            fix: {
              type: 'update_package',
              package: packageName,
              version: latest
            },
            riskLevel: this.assessUpdateRisk(updateType, packageName)
          });
        });
      }
    } catch (error) {
      issues.push({
        type: 'outdated_analysis_failed',
        severity: 'low',
        message: 'Unable to analyze outdated packages',
        recommendation: 'Run npm outdated manually to check for updates'
      });
    }

    return issues;
  }

  async analyzeLicenseCompliance() {
    console.log('⚖️ Analyzing license compliance...');
    const analysis = { issues: [], violations: 0 };

    try {
      // Get license information
      const licenseData = await this.getLicenseInformation();
      
      // Check for license conflicts
      const conflicts = this.detectLicenseConflicts(licenseData);
      analysis.violations = conflicts.length;
      
      conflicts.forEach(conflict => {
        analysis.issues.push({
          type: 'license_conflict',
          packages: conflict.packages,
          licenses: conflict.licenses,
          severity: conflict.severity,
          message: `License conflict: ${conflict.description}`,
          recommendation: conflict.recommendation,
          autoFixable: false
        });
      });

      // Check for unknown licenses
      const unknownLicenses = licenseData.filter(pkg => 
        !pkg.license || this.licenseCategories.unknown.includes(pkg.license)
      );

      unknownLicenses.forEach(pkg => {
        analysis.issues.push({
          type: 'unknown_license',
          package: pkg.name,
          license: pkg.license || 'UNKNOWN',
          severity: 'medium',
          message: `Package ${pkg.name} has unknown or missing license`,
          recommendation: 'Review package license before use in production',
          autoFixable: false
        });
      });

      // Check for GPL violations in commercial projects
      const gplViolations = this.detectGPLViolations(licenseData);
      gplViolations.forEach(violation => {
        analysis.issues.push({
          type: 'gpl_license_violation',
          package: violation.package,
          license: violation.license,
          severity: 'high',
          message: `GPL licensed dependency may require source code disclosure`,
          recommendation: 'Review GPL requirements or find alternative',
          autoFixable: false
        });
      });

    } catch (error) {
      analysis.issues.push({
        type: 'license_analysis_failed',
        severity: 'medium',
        message: 'Unable to analyze license compliance',
        recommendation: 'Install license-checker: npm install -g license-checker'
      });
    }

    return analysis;
  }

  async detectUnusedDependencies() {
    console.log('🗑️ Detecting unused dependencies...');
    const issues = [];

    try {
      // Use depcheck or similar tool
      let depcheckOutput;
      try {
        depcheckOutput = execSync('npx depcheck --json', {
          cwd: this.engine.projectRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch (error) {
        // Try manual analysis if depcheck fails
        return await this.manualUnusedDependencyCheck();
      }

      const depcheckData = JSON.parse(depcheckOutput);
      
      // Unused dependencies
      if (depcheckData.dependencies && depcheckData.dependencies.length > 0) {
        depcheckData.dependencies.forEach(dep => {
          issues.push({
            type: 'unused_dependency',
            package: dep,
            severity: 'medium',
            message: `Unused dependency: ${dep}`,
            recommendation: `Remove unused dependency: npm uninstall ${dep}`,
            autoFixable: true,
            fix: {
              type: 'remove_dependency',
              package: dep
            }
          });
        });
      }

      // Missing dependencies (used but not declared)
      if (depcheckData.missing) {
        Object.keys(depcheckData.missing).forEach(dep => {
          issues.push({
            type: 'missing_dependency',
            package: dep,
            files: depcheckData.missing[dep],
            severity: 'high',
            message: `Missing dependency: ${dep}`,
            recommendation: `Install missing dependency: npm install ${dep}`,
            autoFixable: true,
            fix: {
              type: 'install_dependency',
              package: dep
            }
          });
        });
      }

    } catch (error) {
      issues.push({
        type: 'unused_dependency_analysis_failed',
        severity: 'low',
        message: 'Unable to analyze unused dependencies',
        recommendation: 'Install depcheck: npm install -g depcheck'
      });
    }

    return issues;
  }

  async detectCircularDependencies() {
    console.log('🔄 Detecting circular dependencies...');
    const issues = [];

    try {
      // Use madge or manual analysis to detect circular dependencies
      const circularDeps = await this.findCircularDependencies();
      
      circularDeps.forEach(cycle => {
        issues.push({
          type: 'circular_dependency',
          cycle: cycle,
          severity: 'high',
          message: `Circular dependency detected: ${cycle.join(' -> ')}`,
          recommendation: 'Refactor code to break circular dependencies',
          autoFixable: false,
          impact: 'bundle_size_and_performance'
        });
      });

    } catch (error) {
      // Manual fallback analysis
      const manualCircular = await this.manualCircularDependencyCheck();
      issues.push(...manualCircular);
    }

    return issues;
  }

  async analyzeVersionConflicts() {
    console.log('⚔️ Analyzing version conflicts...');
    const issues = [];

    try {
      // Check for duplicate packages with different versions
      const duplicates = await this.findDuplicatePackages();
      
      duplicates.forEach(duplicate => {
        issues.push({
          type: 'version_conflict',
          package: duplicate.name,
          versions: duplicate.versions,
          severity: 'medium',
          message: `Version conflict: ${duplicate.name} has multiple versions`,
          recommendation: 'Use resolutions to force a single version',
          autoFixable: true,
          fix: {
            type: 'resolve_version_conflict',
            package: duplicate.name,
            recommendedVersion: duplicate.recommendedVersion
          }
        });
      });

    } catch (error) {
      issues.push({
        type: 'version_conflict_analysis_failed',
        severity: 'low',
        message: 'Unable to analyze version conflicts'
      });
    }

    return issues;
  }

  async analyzeSupplyChainSecurity() {
    console.log('🔐 Analyzing supply chain security...');
    const issues = [];

    try {
      const packageJsonPath = path.join(this.engine.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Check for suspicious packages
      Object.keys(allDeps).forEach(packageName => {
        const suspiciousIndicators = this.checkSuspiciousPackage(packageName);
        
        suspiciousIndicators.forEach(indicator => {
          issues.push({
            type: 'suspicious_package',
            package: packageName,
            indicator: indicator.type,
            severity: indicator.severity,
            message: `Potentially suspicious package: ${packageName} - ${indicator.reason}`,
            recommendation: 'Review package source and maintainer credibility',
            autoFixable: false
          });
        });
      });

      // Check for recently published packages with high privileges
      const recentHighPrivPackages = await this.findRecentHighPrivilegePackages(allDeps);
      recentHighPrivPackages.forEach(pkg => {
        issues.push({
          type: 'recent_high_privilege_package',
          package: pkg.name,
          published: pkg.publishDate,
          privileges: pkg.privileges,
          severity: 'medium',
          message: `Recently published package with high privileges: ${pkg.name}`,
          recommendation: 'Review package necessity and permissions',
          autoFixable: false
        });
      });

    } catch (error) {
      issues.push({
        type: 'supply_chain_analysis_failed',
        severity: 'low',
        message: 'Unable to analyze supply chain security'
      });
    }

    return issues;
  }

  async analyzeBundleImpact() {
    console.log('📊 Analyzing bundle impact...');
    const issues = [];

    try {
      // Get bundle size information
      const bundleImpact = await this.calculatePackageBundleImpact();
      
      bundleImpact.heavyPackages.forEach(pkg => {
        if (pkg.size > 500000) { // 500KB+
          issues.push({
            type: 'heavy_package_impact',
            package: pkg.name,
            size: pkg.size,
            severity: 'high',
            message: `Package ${pkg.name} adds ${Math.round(pkg.size/1000)}KB to bundle`,
            recommendation: 'Consider lighter alternatives or lazy loading',
            autoFixable: false,
            impact: 'bundle_size'
          });
        }
      });

      // Tree shaking issues
      bundleImpact.nonTreeShakeable.forEach(pkg => {
        issues.push({
          type: 'non_tree_shakeable_package',
          package: pkg,
          severity: 'medium',
          message: `Package ${pkg} doesn't support tree shaking`,
          recommendation: 'Import specific functions or find tree-shakeable alternative',
          autoFixable: false,
          impact: 'bundle_size'
        });
      });

    } catch (error) {
      issues.push({
        type: 'bundle_impact_analysis_failed',
        severity: 'low',
        message: 'Unable to analyze bundle impact'
      });
    }

    return issues;
  }

  async analyzePackageMaintenance() {
    console.log('🔧 Analyzing package maintenance status...');
    const issues = [];

    try {
      const packageJsonPath = path.join(this.engine.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Check for unmaintained packages (simplified)
      const unmaintainedIndicators = [
        'colors', 'node-uuid', 'request', 'bower', 'grunt'
      ];

      Object.keys(deps).forEach(packageName => {
        if (unmaintainedIndicators.includes(packageName)) {
          issues.push({
            type: 'unmaintained_package',
            package: packageName,
            severity: 'medium',
            message: `Package ${packageName} is no longer maintained`,
            recommendation: this.getMaintenanceRecommendation(packageName),
            autoFixable: false
          });
        }
      });

    } catch (error) {
      // Ignore maintenance analysis errors
    }

    return issues;
  }

  generateDependencyRecommendations(issues) {
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
          actionItems: this.getCategoryActionItems(category, categoryIssues),
          estimatedEffort: this.estimateEffort(category, categoryIssues.length)
        });
      }
    });
    
    return recommendations.sort((a, b) => this.priorityScore(b.priority) - this.priorityScore(a.priority));
  }

  calculateDependencyRiskScore(results) {
    let score = 100;
    
    // Deduct points based on different risk factors
    const deductions = {
      'critical': 25,
      'high': 15,
      'medium': 10,
      'low': 5
    };
    
    results.issues.forEach(issue => {
      score -= deductions[issue.severity] || 5;
    });
    
    // Additional deductions for high-risk scenarios
    if (results.metrics.vulnerableDependencies > 10) score -= 20;
    if (results.metrics.outdatedDependencies > results.metrics.totalDependencies * 0.5) score -= 15;
    if (results.metrics.unusedDependencies > 10) score -= 10;
    
    return Math.max(0, score);
  }

  // Auto-fix capabilities
  async autoFix(issue) {
    console.log(`📦 Auto-fixing dependency issue: ${issue.type}`);
    
    const fixers = {
      'init_package_json': () => this.initPackageJson(),
      'add_package_name': () => this.addPackageName(issue),
      'add_package_version': () => this.addPackageVersion(issue),
      'update_package': () => this.updatePackage(issue),
      'remove_dependency': () => this.removeDependency(issue),
      'install_dependency': () => this.installDependency(issue),
      'move_to_dev_dependencies': () => this.moveToDev(issue),
      'move_to_prod_dependencies': () => this.moveToProd(issue)
    };
    
    const fixer = fixers[issue.fix?.type];
    if (fixer) {
      return await fixer();
    }
    
    throw new Error(`No auto-fix available for ${issue.type}`);
  }

  async updatePackage(issue) {
    try {
      execSync(`npm install ${issue.package}@${issue.fix.version}`, {
        cwd: this.engine.projectRoot,
        stdio: 'pipe'
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to update ${issue.package}: ${error.message}`);
    }
  }

  async removeDependency(issue) {
    try {
      execSync(`npm uninstall ${issue.fix.package}`, {
        cwd: this.engine.projectRoot,
        stdio: 'pipe'
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to remove ${issue.fix.package}: ${error.message}`);
    }
  }

  // Utility methods
  determineUpdateType(current, latest) {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    
    if (latestParts[0] > currentParts[0]) return 'major';
    if (latestParts[1] > currentParts[1]) return 'minor';
    if (latestParts[2] > currentParts[2]) return 'patch';
    return 'none';
  }

  getUpdateSeverity(updateType) {
    const severityMap = {
      'major': 'high',
      'minor': 'medium',
      'patch': 'low',
      'none': 'low'
    };
    return severityMap[updateType] || 'medium';
  }

  findMisplacedDependencies(deps, type) {
    const devOnlyPackages = [
      '@types/', 'eslint', 'prettier', 'jest', 'webpack', 'babel',
      'typescript', 'ts-node', 'nodemon', 'concurrently'
    ];

    if (type === 'production') {
      return Object.keys(deps).filter(dep => 
        devOnlyPackages.some(pattern => dep.includes(pattern))
      );
    }
    
    return []; // Simplified for demo
  }

  findPermissiveVersions(deps, devDeps) {
    const permissive = [];
    const allDeps = { ...deps, ...devDeps };
    
    Object.entries(allDeps).forEach(([pkg, version]) => {
      if (version.includes('*') || version.includes('^0.') || version.includes('~0.')) {
        permissive.push({
          package: pkg,
          version: version,
          reason: version.includes('*') ? 'wildcard' : 'pre-1.0 range'
        });
      }
    });
    
    return permissive;
  }

  checkSuspiciousPackage(packageName) {
    const suspicious = [];
    
    // Check for typosquatting patterns
    const commonPackages = ['react', 'lodash', 'express', 'axios', 'moment'];
    commonPackages.forEach(common => {
      if (this.isTyposquatting(packageName, common)) {
        suspicious.push({
          type: 'potential_typosquatting',
          reason: `Similar to popular package: ${common}`,
          severity: 'high'
        });
      }
    });
    
    // Check for suspicious naming patterns
    if (packageName.includes('test') && packageName.includes('dep')) {
      suspicious.push({
        type: 'test_dependency',
        reason: 'Looks like a test/temporary package',
        severity: 'medium'
      });
    }
    
    return suspicious;
  }

  isTyposquatting(packageName, targetPackage) {
    // Simple Levenshtein distance check
    const distance = this.levenshteinDistance(packageName, targetPackage);
    return distance === 1 && packageName !== targetPackage;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
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
      'outdated_package': 'maintenance',
      'unused_dependency': 'cleanup',
      'missing_dependency': 'correctness',
      'license_conflict': 'compliance',
      'security_vulnerability': 'security',
      'circular_dependency': 'architecture',
      'version_conflict': 'stability'
    };
    
    return categoryMap[type] || 'other';
  }

  priorityScore(priority) {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[priority] || 0;
  }
}

module.exports = { DependencyAgent };