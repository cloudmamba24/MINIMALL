/**
 * Deployment Agent - Advanced deployment and infrastructure validation
 * 
 * Capabilities:
 * - Environment configuration validation
 * - CI/CD pipeline analysis and optimization
 * - Docker and containerization best practices
 * - Cloud infrastructure security and compliance
 * - Build process optimization
 * - Environment variable management
 * - Secret management validation
 * - Production readiness assessment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');

class DeploymentAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'Deployment';
    this.capabilities = [
      'environment_validation',
      'cicd_analysis',
      'containerization_audit',
      'infrastructure_security',
      'build_optimization',
      'secret_management',
      'production_readiness',
      'monitoring_setup'
    ];
    
    this.productionStandards = {
      environment: {
        requiredVars: ['NODE_ENV', 'PORT', 'DATABASE_URL'],
        forbiddenInProduction: ['DEBUG', 'DEVELOPMENT', 'TEST_'],
        secretPatterns: [/API_KEY/, /SECRET/, /PASSWORD/, /TOKEN/, /PRIVATE_KEY/]
      },
      
      docker: {
        bestPractices: [
          { pattern: /FROM node:latest/, violation: 'use_specific_version', severity: 'medium' },
          { pattern: /RUN.*npm.*install.*-g/, violation: 'global_npm_install', severity: 'low' },
          { pattern: /USER root/, violation: 'running_as_root', severity: 'high' },
          { pattern: /COPY \. \./, violation: 'copy_entire_context', severity: 'medium' },
          { pattern: /RUN.*apt.*update.*&&.*apt.*install/s, violation: 'missing_cleanup', severity: 'low' }
        ],
        
        securityChecks: [
          { pattern: /--privileged/, violation: 'privileged_container', severity: 'critical' },
          { pattern: /--user.*0/, violation: 'root_user', severity: 'high' },
          { pattern: /ADD.*http/, violation: 'add_remote_content', severity: 'medium' }
        ]
      },

      cicd: {
        requiredStages: ['test', 'build', 'deploy'],
        securityChecks: [
          'secret_scanning',
          'dependency_check',
          'container_scanning',
          'code_quality_gate'
        ],
        
        performanceChecks: [
          'build_time',
          'test_coverage',
          'artifact_size'
        ]
      },

      infrastructure: {
        securityHeaders: [
          'X-Frame-Options',
          'X-Content-Type-Options',
          'X-XSS-Protection',
          'Strict-Transport-Security',
          'Content-Security-Policy'
        ],
        
        monitoring: [
          'health_checks',
          'metrics_collection',
          'log_aggregation',
          'alerting'
        ]
      }
    };

    this.deploymentPatterns = {
      kubernetes: {
        files: ['*.yaml', '*.yml', 'k8s/**/*', 'kubernetes/**/*'],
        checks: [
          { pattern: /resources:\s*\{\}/, type: 'missing_resource_limits', severity: 'medium' },
          { pattern: /securityContext:\s*\{\}/, type: 'missing_security_context', severity: 'high' },
          { pattern: /image:.*:latest/, type: 'latest_tag_usage', severity: 'medium' },
          { pattern: /privileged:\s*true/, type: 'privileged_container', severity: 'critical' }
        ]
      },
      
      docker: {
        files: ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
        checks: this.productionStandards.docker.bestPractices.concat(this.productionStandards.docker.securityChecks)
      },
      
      terraform: {
        files: ['*.tf', 'terraform/**/*'],
        checks: [
          { pattern: /resource.*".*".*\{[^}]*\}/, type: 'missing_tags', severity: 'low' },
          { pattern: /0\.0\.0\.0\/0/, type: 'overly_permissive_cidr', severity: 'high' },
          { pattern: /password.*=.*".*"/, type: 'hardcoded_password', severity: 'critical' }
        ]
      }
    };
  }

  async analyze() {
    console.log('🚀 Deployment Agent: Infrastructure and deployment analysis starting...');
    
    const results = {
      issues: [],
      metrics: {
        environmentsFound: 0,
        cicdPipelinesFound: 0,
        dockerFilesFound: 0,
        deploymentReadiness: 0,
        securityScore: 100,
        infrastructureCompliance: 0
      },
      recommendations: [],
      environments: [],
      deploymentMethods: []
    };

    // 1. Detect deployment methods and infrastructure
    const deploymentMethods = await this.detectDeploymentMethods();
    results.deploymentMethods = deploymentMethods;

    // 2. Environment configuration analysis
    const envAnalysis = await this.analyzeEnvironmentConfig();
    results.issues.push(...envAnalysis.issues);
    results.environments = envAnalysis.environments;
    results.metrics.environmentsFound = envAnalysis.environments.length;

    // 3. CI/CD pipeline analysis
    const cicdAnalysis = await this.analyzeCICDPipelines();
    results.issues.push(...cicdAnalysis.issues);
    results.metrics.cicdPipelinesFound = cicdAnalysis.pipelineCount;

    // 4. Docker and containerization analysis
    const dockerAnalysis = await this.analyzeDockerConfiguration();
    results.issues.push(...dockerAnalysis.issues);
    results.metrics.dockerFilesFound = dockerAnalysis.fileCount;

    // 5. Infrastructure as Code analysis
    const iacAnalysis = await this.analyzeInfrastructureAsCode();
    results.issues.push(...iacAnalysis.issues);

    // 6. Secret management analysis
    const secretAnalysis = await this.analyzeSecretManagement();
    results.issues.push(...secretAnalysis.issues);

    // 7. Build process optimization
    const buildAnalysis = await this.analyzeBuildProcess();
    results.issues.push(...buildAnalysis.issues);

    // 8. Production readiness assessment
    const readinessAnalysis = await this.assessProductionReadiness();
    results.issues.push(...readinessAnalysis.issues);
    results.metrics.deploymentReadiness = readinessAnalysis.readinessScore;

    // 9. Security and compliance checks
    const securityAnalysis = await this.analyzeDeploymentSecurity();
    results.issues.push(...securityAnalysis.issues);
    results.metrics.securityScore = securityAnalysis.securityScore;

    // 10. Infrastructure monitoring setup
    const monitoringAnalysis = await this.analyzeMonitoringSetup();
    results.issues.push(...monitoringAnalysis.issues);

    // Calculate compliance score
    results.metrics.infrastructureCompliance = this.calculateComplianceScore(results);

    // Generate recommendations
    results.recommendations = this.generateDeploymentRecommendations(results.issues);

    console.log(`✅ Deployment Agent: Found ${results.deploymentMethods.length} deployment methods. Readiness: ${results.metrics.deploymentReadiness}%`);
    
    return results;
  }

  async detectDeploymentMethods() {
    console.log('🔍 Detecting deployment methods...');
    const methods = [];

    const detectionRules = [
      { files: ['Dockerfile'], method: 'docker', confidence: 'high' },
      { files: ['docker-compose.yml', 'docker-compose.yaml'], method: 'docker-compose', confidence: 'high' },
      { files: ['k8s/**/*', 'kubernetes/**/*', '*.k8s.yaml'], method: 'kubernetes', confidence: 'high' },
      { files: ['*.tf', 'terraform/**/*'], method: 'terraform', confidence: 'high' },
      { files: ['.github/workflows/*'], method: 'github-actions', confidence: 'high' },
      { files: ['.gitlab-ci.yml'], method: 'gitlab-ci', confidence: 'high' },
      { files: ['Jenkinsfile', 'jenkins/**/*'], method: 'jenkins', confidence: 'high' },
      { files: ['azure-pipelines.yml'], method: 'azure-devops', confidence: 'high' },
      { files: ['buildspec.yml'], method: 'aws-codebuild', confidence: 'high' },
      { files: ['vercel.json', 'now.json'], method: 'vercel', confidence: 'high' },
      { files: ['netlify.toml', '_redirects'], method: 'netlify', confidence: 'high' },
      { files: ['app.yaml', 'app.yml'], method: 'google-cloud', confidence: 'medium' },
      { files: ['heroku.yml', 'Procfile'], method: 'heroku', confidence: 'high' }
    ];

    for (const rule of detectionRules) {
      const hasFiles = await this.checkFilesExist(rule.files);
      if (hasFiles.length > 0) {
        methods.push({
          method: rule.method,
          confidence: rule.confidence,
          files: hasFiles,
          detected: true
        });
      }
    }

    return methods;
  }

  async analyzeEnvironmentConfig() {
    console.log('⚙️ Analyzing environment configuration...');
    const analysis = { issues: [], environments: [] };

    // Check for environment files
    const envFiles = [
      '.env',
      '.env.local',
      '.env.development', 
      '.env.production',
      '.env.test',
      '.env.example'
    ];

    for (const envFile of envFiles) {
      const envPath = path.join(this.engine.projectRoot, envFile);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envAnalysis = this.analyzeEnvironmentFile(envContent, envFile);
        
        analysis.environments.push({
          file: envFile,
          variables: envAnalysis.variables,
          issues: envAnalysis.issues
        });
        
        analysis.issues.push(...envAnalysis.issues);
      }
    }

    // Check for missing .env.example
    if (fs.existsSync(path.join(this.engine.projectRoot, '.env')) && 
        !fs.existsSync(path.join(this.engine.projectRoot, '.env.example'))) {
      analysis.issues.push({
        type: 'missing_env_example',
        severity: 'medium',
        message: '.env.example file missing',
        recommendation: 'Create .env.example with sample values for team reference',
        autoFixable: true,
        fix: { type: 'create_env_example' }
      });
    }

    // Check if .env is in gitignore
    const gitignorePath = path.join(this.engine.projectRoot, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignoreContent.includes('.env')) {
        analysis.issues.push({
          type: 'env_not_gitignored',
          severity: 'critical',
          message: '.env file not in .gitignore',
          recommendation: 'Add .env to .gitignore to prevent committing secrets',
          autoFixable: true,
          fix: { type: 'add_env_to_gitignore' }
        });
      }
    }

    return analysis;
  }

  analyzeEnvironmentFile(content, fileName) {
    const analysis = { variables: [], issues: [] };
    const lines = content.split('\n');

    lines.forEach((line, lineNumber) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return;

      const [key, value] = trimmedLine.split('=', 2);
      if (!key || !value) return;

      analysis.variables.push({ key: key.trim(), value: value.trim() });

      // Check for secrets in non-example files
      if (!fileName.includes('example')) {
        this.productionStandards.environment.secretPatterns.forEach(pattern => {
          if (pattern.test(key) && value.length > 10) {
            analysis.issues.push({
              type: 'hardcoded_secret_in_env',
              file: fileName,
              line: lineNumber + 1,
              variable: key,
              severity: 'high',
              message: `Potential secret hardcoded in ${fileName}`,
              recommendation: 'Use environment-specific secrets management',
              autoFixable: false
            });
          }
        });
      }

      // Check for production anti-patterns
      if (fileName.includes('production')) {
        this.productionStandards.environment.forbiddenInProduction.forEach(forbidden => {
          if (key.includes(forbidden)) {
            analysis.issues.push({
              type: 'forbidden_production_var',
              file: fileName,
              variable: key,
              severity: 'medium',
              message: `${key} should not be set in production environment`,
              recommendation: `Remove or rename ${key} for production use`,
              autoFixable: false
            });
          }
        });
      }

      // Check for empty values
      if (!value.trim()) {
        analysis.issues.push({
          type: 'empty_environment_variable',
          file: fileName,
          variable: key,
          severity: 'low',
          message: `Environment variable ${key} has empty value`,
          recommendation: 'Provide default value or remove unused variable',
          autoFixable: false
        });
      }
    });

    return analysis;
  }

  async analyzeCICDPipelines() {
    console.log('🔄 Analyzing CI/CD pipelines...');
    const analysis = { issues: [], pipelineCount: 0 };

    // GitHub Actions
    const githubWorkflowsDir = path.join(this.engine.projectRoot, '.github/workflows');
    if (fs.existsSync(githubWorkflowsDir)) {
      const workflows = fs.readdirSync(githubWorkflowsDir);
      analysis.pipelineCount += workflows.length;
      
      for (const workflow of workflows) {
        const workflowPath = path.join(githubWorkflowsDir, workflow);
        const workflowContent = fs.readFileSync(workflowPath, 'utf8');
        const workflowIssues = this.analyzeGitHubWorkflow(workflowContent, workflow);
        analysis.issues.push(...workflowIssues);
      }
    }

    // GitLab CI
    const gitlabCiPath = path.join(this.engine.projectRoot, '.gitlab-ci.yml');
    if (fs.existsSync(gitlabCiPath)) {
      analysis.pipelineCount++;
      const gitlabContent = fs.readFileSync(gitlabCiPath, 'utf8');
      const gitlabIssues = this.analyzeGitLabCI(gitlabContent);
      analysis.issues.push(...gitlabIssues);
    }

    // Jenkins
    const jenkinsfilePath = path.join(this.engine.projectRoot, 'Jenkinsfile');
    if (fs.existsSync(jenkinsfilePath)) {
      analysis.pipelineCount++;
      const jenkinsContent = fs.readFileSync(jenkinsfilePath, 'utf8');
      const jenkinsIssues = this.analyzeJenkinsfile(jenkinsContent);
      analysis.issues.push(...jenkinsIssues);
    }

    // Check for missing CI/CD
    if (analysis.pipelineCount === 0) {
      analysis.issues.push({
        type: 'missing_cicd_pipeline',
        severity: 'high',
        message: 'No CI/CD pipeline configuration found',
        recommendation: 'Set up CI/CD pipeline for automated testing and deployment',
        autoFixable: true,
        fix: { type: 'create_basic_cicd' }
      });
    }

    return analysis;
  }

  analyzeGitHubWorkflow(content, fileName) {
    const issues = [];
    
    try {
      const workflow = yaml.load(content);
      
      // Check for required stages
      const jobs = workflow.jobs || {};
      const hasTest = Object.keys(jobs).some(job => 
        job.includes('test') || jobs[job].name?.includes('test')
      );
      const hasBuild = Object.keys(jobs).some(job => 
        job.includes('build') || jobs[job].name?.includes('build')
      );
      
      if (!hasTest) {
        issues.push({
          type: 'missing_test_stage',
          file: fileName,
          severity: 'high',
          message: 'GitHub workflow missing test stage',
          recommendation: 'Add test job to ensure code quality',
          autoFixable: true,
          fix: { type: 'add_test_job' }
        });
      }

      if (!hasBuild) {
        issues.push({
          type: 'missing_build_stage',
          file: fileName,
          severity: 'medium',
          message: 'GitHub workflow missing build stage',
          recommendation: 'Add build job to validate compilation',
          autoFixable: true,
          fix: { type: 'add_build_job' }
        });
      }

      // Check for security issues
      Object.values(jobs).forEach(job => {
        if (job.steps) {
          job.steps.forEach((step, stepIndex) => {
            if (step.uses && !step.uses.includes('@')) {
              issues.push({
                type: 'action_without_version',
                file: fileName,
                step: stepIndex,
                severity: 'medium',
                message: 'GitHub Action used without version pinning',
                recommendation: 'Pin action to specific version or SHA',
                autoFixable: false
              });
            }

            if (step.run && step.run.includes('${{')) {
              // Check for potential injection
              const potentialInjection = /\$\{\{\s*github\.event\.(issue|pull_request)\.(title|body)/.test(step.run);
              if (potentialInjection) {
                issues.push({
                  type: 'potential_script_injection',
                  file: fileName,
                  step: stepIndex,
                  severity: 'critical',
                  message: 'Potential script injection vulnerability',
                  recommendation: 'Sanitize user input in workflow commands',
                  autoFixable: false
                });
              }
            }
          });
        }
      });

    } catch (error) {
      issues.push({
        type: 'invalid_workflow_yaml',
        file: fileName,
        severity: 'high',
        message: 'Invalid YAML in GitHub workflow',
        error: error.message,
        recommendation: 'Fix YAML syntax errors',
        autoFixable: false
      });
    }

    return issues;
  }

  async analyzeDockerConfiguration() {
    console.log('🐳 Analyzing Docker configuration...');
    const analysis = { issues: [], fileCount: 0 };

    // Analyze Dockerfile
    const dockerfilePath = path.join(this.engine.projectRoot, 'Dockerfile');
    if (fs.existsSync(dockerfilePath)) {
      analysis.fileCount++;
      const dockerContent = fs.readFileSync(dockerfilePath, 'utf8');
      const dockerIssues = this.analyzeDockerfile(dockerContent);
      analysis.issues.push(...dockerIssues);
    }

    // Analyze docker-compose.yml
    const composeFiles = ['docker-compose.yml', 'docker-compose.yaml'];
    for (const composeFile of composeFiles) {
      const composePath = path.join(this.engine.projectRoot, composeFile);
      if (fs.existsSync(composePath)) {
        analysis.fileCount++;
        const composeContent = fs.readFileSync(composePath, 'utf8');
        const composeIssues = this.analyzeDockerCompose(composeContent, composeFile);
        analysis.issues.push(...composeIssues);
      }
    }

    // Check for .dockerignore
    const dockerignorePath = path.join(this.engine.projectRoot, '.dockerignore');
    if (fs.existsSync(dockerfilePath) && !fs.existsSync(dockerignorePath)) {
      analysis.issues.push({
        type: 'missing_dockerignore',
        severity: 'medium',
        message: '.dockerignore file missing',
        recommendation: 'Create .dockerignore to optimize build context',
        autoFixable: true,
        fix: { type: 'create_dockerignore' }
      });
    }

    return analysis;
  }

  analyzeDockerfile(content) {
    const issues = [];
    const lines = content.split('\n');

    // Apply best practice checks
    this.productionStandards.docker.bestPractices.forEach(check => {
      if (check.pattern.test(content)) {
        issues.push({
          type: check.violation,
          severity: check.severity,
          message: this.getDockerViolationMessage(check.violation),
          recommendation: this.getDockerViolationRecommendation(check.violation),
          autoFixable: this.isDockerViolationAutoFixable(check.violation),
          fix: this.getDockerViolationFix(check.violation)
        });
      }
    });

    // Apply security checks
    this.productionStandards.docker.securityChecks.forEach(check => {
      if (check.pattern.test(content)) {
        issues.push({
          type: check.violation,
          severity: check.severity,
          message: this.getDockerViolationMessage(check.violation),
          recommendation: this.getDockerViolationRecommendation(check.violation),
          autoFixable: false
        });
      }
    });

    // Check for multi-stage build optimization
    const hasMultiStage = content.includes('AS ') && content.includes('FROM ');
    if (!hasMultiStage && content.split('RUN').length > 5) {
      issues.push({
        type: 'missing_multistage_build',
        severity: 'medium',
        message: 'Dockerfile could benefit from multi-stage build',
        recommendation: 'Use multi-stage build to reduce image size',
        autoFixable: false
      });
    }

    // Check for health check
    if (!content.includes('HEALTHCHECK')) {
      issues.push({
        type: 'missing_healthcheck',
        severity: 'low',
        message: 'Dockerfile missing HEALTHCHECK instruction',
        recommendation: 'Add HEALTHCHECK for container monitoring',
        autoFixable: true,
        fix: { type: 'add_healthcheck' }
      });
    }

    return issues;
  }

  async analyzeSecretManagement() {
    console.log('🔐 Analyzing secret management...');
    const issues = [];

    // Check for hardcoded secrets in code
    const sourceFiles = await this.getSourceFiles();
    
    const secretPatterns = [
      { pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/, type: 'hardcoded_password' },
      { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/, type: 'hardcoded_api_key' },
      { pattern: /secret\s*[:=]\s*['"][^'"]{10,}['"]/, type: 'hardcoded_secret' },
      { pattern: /token\s*[:=]\s*['"][^'"]{20,}['"]/, type: 'hardcoded_token' },
      { pattern: /-----BEGIN [A-Z ]+-----/, type: 'hardcoded_private_key' }
    ];

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      secretPatterns.forEach(({ pattern, type }) => {
        const matches = content.match(pattern);
        if (matches) {
          issues.push({
            type: type,
            file: file,
            severity: 'critical',
            message: `${type.replace('_', ' ')} found in source code`,
            recommendation: 'Move secrets to environment variables or secure vault',
            autoFixable: false
          });
        }
      });
    }

    // Check for secret scanning in CI/CD
    const hasSecretScanning = await this.checkSecretScanningInCI();
    if (!hasSecretScanning) {
      issues.push({
        type: 'missing_secret_scanning',
        severity: 'medium',
        message: 'No secret scanning configured in CI/CD',
        recommendation: 'Add secret scanning to prevent credential leaks',
        autoFixable: true,
        fix: { type: 'add_secret_scanning' }
      });
    }

    return issues;
  }

  async assessProductionReadiness() {
    console.log('📈 Assessing production readiness...');
    const analysis = { issues: [], readinessScore: 0 };

    const readinessChecks = [
      { check: 'health_checks', weight: 15 },
      { check: 'error_handling', weight: 20 },
      { check: 'logging', weight: 15 },
      { check: 'monitoring', weight: 15 },
      { check: 'security_headers', weight: 10 },
      { check: 'environment_config', weight: 10 },
      { check: 'build_optimization', weight: 10 },
      { check: 'backup_strategy', weight: 5 }
    ];

    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const { check, weight } of readinessChecks) {
      const score = await this.evaluateReadinessCheck(check);
      totalScore += score * weight;
      maxPossibleScore += 100 * weight;

      if (score < 50) {
        analysis.issues.push({
          type: 'production_readiness_gap',
          check: check,
          score: score,
          severity: score < 25 ? 'high' : 'medium',
          message: `Production readiness gap: ${check} (${score}/100)`,
          recommendation: this.getReadinessRecommendation(check),
          autoFixable: this.isReadinessAutoFixable(check)
        });
      }
    }

    analysis.readinessScore = Math.round((totalScore / maxPossibleScore) * 100);

    return analysis;
  }

  generateDeploymentRecommendations(issues) {
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
          estimatedEffort: this.estimateImplementationEffort(category, categoryIssues.length)
        });
      }
    });
    
    return recommendations.sort((a, b) => this.priorityScore(b.priority) - this.priorityScore(a.priority));
  }

  calculateComplianceScore(results) {
    let score = 100;
    
    // Deduct points for different issue types
    const deductions = {
      'critical': 30,
      'high': 20,
      'medium': 10,
      'low': 5
    };
    
    results.issues.forEach(issue => {
      score -= deductions[issue.severity] || 5;
    });
    
    // Bonus for having deployment methods
    if (results.deploymentMethods.length > 0) score += 10;
    if (results.metrics.cicdPipelinesFound > 0) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  // Auto-fix capabilities
  async autoFix(issue) {
    console.log(`🚀 Auto-fixing deployment issue: ${issue.type}`);
    
    const fixers = {
      'create_env_example': () => this.createEnvExample(),
      'add_env_to_gitignore': () => this.addEnvToGitignore(),
      'create_basic_cicd': () => this.createBasicCICD(),
      'create_dockerignore': () => this.createDockerignore(),
      'add_healthcheck': () => this.addDockerHealthcheck(issue)
    };
    
    const fixer = fixers[issue.fix?.type];
    if (fixer) {
      return await fixer();
    }
    
    throw new Error(`No auto-fix available for ${issue.type}`);
  }

  async createEnvExample() {
    const envPath = path.join(this.engine.projectRoot, '.env');
    const examplePath = path.join(this.engine.projectRoot, '.env.example');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const exampleContent = envContent.replace(/=.*/g, '=');
      fs.writeFileSync(examplePath, exampleContent);
      return true;
    }
    
    return false;
  }

  // Utility methods
  async checkFilesExist(patterns) {
    const existingFiles = [];
    
    for (const pattern of patterns) {
      try {
        const files = execSync(`find . -path "./node_modules" -prune -o -name "${pattern}" -print`, {
          cwd: this.engine.projectRoot,
          encoding: 'utf8'
        }).split('\n').filter(Boolean);
        
        existingFiles.push(...files);
      } catch (error) {
        // Continue if pattern doesn't match any files
      }
    }
    
    return existingFiles;
  }

  getDockerViolationMessage(violation) {
    const messages = {
      'use_specific_version': 'Using latest tag in FROM instruction',
      'global_npm_install': 'Installing packages globally in container',
      'running_as_root': 'Running container as root user',
      'copy_entire_context': 'Copying entire build context',
      'privileged_container': 'Running privileged container',
      'add_remote_content': 'Using ADD with remote URLs'
    };
    
    return messages[violation] || 'Docker best practice violation';
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
      'missing_env_example': 'environment',
      'env_not_gitignored': 'security',
      'hardcoded_secret': 'security',
      'missing_cicd_pipeline': 'automation',
      'missing_test_stage': 'quality',
      'use_specific_version': 'docker',
      'running_as_root': 'security',
      'missing_healthcheck': 'monitoring',
      'production_readiness_gap': 'readiness'
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

  getCategoryPriority(category) {
    const priorities = {
      'security': 'critical',
      'automation': 'high',
      'quality': 'high',
      'readiness': 'medium',
      'docker': 'medium',
      'environment': 'low',
      'monitoring': 'low'
    };
    
    return priorities[category] || 'low';
  }

  isDockerViolationAutoFixable(violation) {
    const autoFixable = [
      'use_specific_version',
      'copy_entire_context',
      'missing_healthcheck'
    ];
    
    return autoFixable.includes(violation);
  }

  estimateImplementationEffort(category, issueCount) {
    const baseEfforts = {
      'security': 240,      // 4 hours
      'automation': 480,    // 8 hours  
      'docker': 120,        // 2 hours
      'environment': 60,    // 1 hour
      'monitoring': 180,    // 3 hours
      'readiness': 360      // 6 hours
    };

    const baseEffort = baseEfforts[category] || 120;
    return Math.round(baseEffort + (issueCount - 1) * (baseEffort * 0.3));
  }
}

module.exports = { DeploymentAgent };