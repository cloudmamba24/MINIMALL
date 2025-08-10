/**
 * Infrastructure Agent - Docker, CI/CD, and configuration generation
 * 
 * Capabilities:
 * - Docker configuration (multi-stage builds, optimization)
 * - CI/CD pipelines (GitHub Actions, GitLab CI, Jenkins)
 * - Environment configurations (.env templates, staging/prod)
 * - Deployment scripts (Kubernetes, cloud platforms)
 * - Monitoring and logging setup
 * - Performance and health checks
 * - Security configurations and secrets management
 * - Infrastructure as Code (Terraform, CloudFormation)
 */

const fs = require('fs');
const path = require('path');

class InfrastructureAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'Infrastructure';
    this.capabilities = [
      'docker_configuration',
      'cicd_pipeline_generation',
      'environment_configuration',
      'deployment_scripts',
      'monitoring_setup',
      'health_checks',
      'security_configuration',
      'infrastructure_as_code'
    ];

    this.deploymentTargets = {
      'vercel': {
        framework: 'next.js',
        files: ['vercel.json', '.vercelignore'],
        features: ['serverless', 'edge-functions', 'automatic-deployments']
      },
      'netlify': {
        framework: 'any',
        files: ['netlify.toml', '_redirects', '_headers'],
        features: ['static-site', 'functions', 'form-handling']
      },
      'heroku': {
        framework: 'any',
        files: ['Procfile', 'app.json'],
        features: ['buildpacks', 'add-ons', 'config-vars']
      },
      'aws': {
        framework: 'any',
        files: ['buildspec.yml', 'cloudformation.yaml'],
        features: ['lambda', 'ecs', 'rds', 'cloudfront']
      },
      'gcp': {
        framework: 'any',
        files: ['app.yaml', 'cloudbuild.yaml'],
        features: ['cloud-run', 'app-engine', 'kubernetes']
      },
      'docker': {
        framework: 'any',
        files: ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
        features: ['containerization', 'orchestration', 'scaling']
      }
    };

    this.cicdProviders = {
      'github-actions': {
        file: '.github/workflows/ci.yml',
        features: ['parallel-jobs', 'matrix-builds', 'caching', 'secrets']
      },
      'gitlab-ci': {
        file: '.gitlab-ci.yml',
        features: ['stages', 'parallel-jobs', 'docker-support', 'artifacts']
      },
      'jenkins': {
        file: 'Jenkinsfile',
        features: ['pipeline-as-code', 'parallel-stages', 'docker-agents']
      },
      'azure-devops': {
        file: 'azure-pipelines.yml',
        features: ['multi-stage', 'conditions', 'templates']
      }
    };

    this.environmentTypes = ['development', 'staging', 'production', 'testing'];
    
    this.monitoringTools = {
      'logging': ['winston', 'pino', 'morgan'],
      'metrics': ['prometheus', 'datadog', 'new-relic'],
      'errors': ['sentry', 'rollbar', 'bugsnag'],
      'uptime': ['pingdom', 'uptime-robot', 'healthchecks']
    };
  }

  async generate(context) {
    console.log('🏗️ Infrastructure Agent: Generating deployment and CI/CD configurations...');
    
    const results = {
      files: [],
      configurations: [],
      deployments: [],
      pipelines: [],
      metrics: {
        configFilesGenerated: 0,
        deploymentsConfigured: 0,
        pipelinesCreated: 0,
        monitoringSetup: 0,
        linesOfCode: 0
      },
      recommendations: []
    };

    // 1. Analyze infrastructure requirements
    const infraRequirements = await this.analyzeInfrastructureRequirements(context);
    
    // 2. Generate Docker configuration
    if (infraRequirements.includeDocker) {
      const dockerResult = await this.generateDockerConfiguration(infraRequirements, context);
      results.files.push(...dockerResult.files);
      results.configurations.push(...dockerResult.configurations);
      results.metrics.configFilesGenerated += dockerResult.files.length;
    }

    // 3. Generate CI/CD pipelines
    for (const provider of infraRequirements.cicdProviders) {
      const pipelineResult = await this.generateCICDPipeline(provider, infraRequirements, context);
      results.files.push(...pipelineResult.files);
      results.pipelines.push(pipelineResult.pipeline);
      results.metrics.pipelinesCreated++;
    }

    // 4. Generate environment configurations
    const envResult = await this.generateEnvironmentConfigurations(infraRequirements, context);
    results.files.push(...envResult.files);
    results.configurations.push(...envResult.configurations);

    // 5. Generate deployment configurations
    for (const target of infraRequirements.deploymentTargets) {
      const deployResult = await this.generateDeploymentConfiguration(target, infraRequirements, context);
      results.files.push(...deployResult.files);
      results.deployments.push(deployResult.deployment);
      results.metrics.deploymentsConfigured++;
    }

    // 6. Generate monitoring and logging
    if (infraRequirements.includeMonitoring) {
      const monitoringResult = await this.generateMonitoringConfiguration(infraRequirements, context);
      results.files.push(...monitoringResult.files);
      results.configurations.push(...monitoringResult.configurations);
      results.metrics.monitoringSetup++;
    }

    // 7. Generate security configurations
    const securityResult = await this.generateSecurityConfigurations(infraRequirements, context);
    results.files.push(...securityResult.files);

    // 8. Generate health checks and scripts
    const healthCheckResult = await this.generateHealthChecks(infraRequirements, context);
    results.files.push(...healthCheckResult.files);

    console.log(`✅ Infrastructure Agent: Generated ${results.metrics.configFilesGenerated} config files, ${results.metrics.pipelinesCreated} pipelines, ${results.metrics.deploymentsConfigured} deployments`);
    
    return results;
  }

  async analyzeInfrastructureRequirements(context) {
    const requirements = {
      includeDocker: true,
      cicdProviders: ['github-actions'],
      deploymentTargets: [],
      includeMonitoring: true,
      includeSecurity: true,
      environments: ['development', 'production'],
      features: []
    };

    // Extract infrastructure requirements from context
    if (context.requirements) {
      context.requirements.forEach(req => {
        if (req.type === 'infrastructure' || req.category === 'deployment') {
          this.parseInfrastructureRequirement(req, requirements);
        }
      });
    }

    // Infer deployment targets from project context
    if (context.projectContext.framework === 'Next.js') {
      requirements.deploymentTargets.push('vercel');
    } else if (context.projectContext.projectType === 'static-site') {
      requirements.deploymentTargets.push('netlify');
    } else {
      requirements.deploymentTargets.push('docker');
    }

    return requirements;
  }

  async generateDockerConfiguration(requirements, context) {
    const files = [];
    const configurations = [];

    // Generate Dockerfile
    const dockerfile = this.generateDockerfile(requirements, context);
    files.push(dockerfile);

    // Generate docker-compose.yml
    const dockerCompose = this.generateDockerCompose(requirements, context);
    files.push(dockerCompose);

    // Generate .dockerignore
    const dockerIgnore = this.generateDockerIgnore(context);
    files.push(dockerIgnore);

    configurations.push({
      name: 'Docker',
      type: 'containerization',
      files: ['Dockerfile', 'docker-compose.yml', '.dockerignore']
    });

    return { files, configurations };
  }

  generateDockerfile(requirements, context) {
    const framework = context.projectContext.framework || 'Node.js';
    const nodeVersion = '18-alpine';
    
    let content = '';

    // Multi-stage build for production optimization
    content += `# Build stage\n`;
    content += `FROM node:${nodeVersion} AS builder\n\n`;
    content += `WORKDIR /app\n\n`;
    content += `# Copy package files\n`;
    content += `COPY package*.json ./\n`;
    if (fs.existsSync(path.join(context.projectRoot, 'yarn.lock'))) {
      content += `COPY yarn.lock ./\n`;
    }
    content += `\n`;
    
    content += `# Install dependencies\n`;
    content += `RUN npm ci --only=production && npm cache clean --force\n\n`;
    
    content += `# Copy source code\n`;
    content += `COPY . .\n\n`;
    
    // Framework-specific build commands
    if (framework === 'Next.js') {
      content += `# Build Next.js application\n`;
      content += `RUN npm run build\n\n`;
    } else if (framework === 'React') {
      content += `# Build React application\n`;
      content += `RUN npm run build\n\n`;
    }

    // Production stage
    content += `# Production stage\n`;
    content += `FROM node:${nodeVersion} AS production\n\n`;
    content += `# Create non-root user\n`;
    content += `RUN addgroup -g 1001 -S nodejs\n`;
    content += `RUN adduser -S nextjs -u 1001\n\n`;
    
    content += `WORKDIR /app\n\n`;
    
    content += `# Copy built application\n`;
    content += `COPY --from=builder --chown=nextjs:nodejs /app ./\n\n`;
    
    content += `# Switch to non-root user\n`;
    content += `USER nextjs\n\n`;
    
    content += `# Expose port\n`;
    content += `EXPOSE 3000\n\n`;
    
    content += `# Health check\n`;
    content += `HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\\n`;
    content += `  CMD curl -f http://localhost:3000/api/health || exit 1\n\n`;
    
    content += `# Start application\n`;
    if (framework === 'Next.js') {
      content += `CMD ["npm", "start"]\n`;
    } else {
      content += `CMD ["npm", "run", "start"]\n`;
    }

    return {
      path: 'Dockerfile',
      content,
      type: 'docker-config'
    };
  }

  generateDockerCompose(requirements, context) {
    let content = '';

    content += `version: '3.8'\n\n`;
    content += `services:\n`;
    content += `  app:\n`;
    content += `    build: .\n`;
    content += `    ports:\n`;
    content += `      - "3000:3000"\n`;
    content += `    environment:\n`;
    content += `      - NODE_ENV=development\n`;
    content += `    volumes:\n`;
    content += `      - .:/app\n`;
    content += `      - /app/node_modules\n`;
    content += `    depends_on:\n`;

    // Add database service if needed
    if (context.database) {
      const dbType = context.database.type || 'postgresql';
      
      if (dbType === 'postgresql') {
        content += `      - postgres\n\n`;
        content += `  postgres:\n`;
        content += `    image: postgres:15-alpine\n`;
        content += `    environment:\n`;
        content += `      POSTGRES_DB: app_db\n`;
        content += `      POSTGRES_USER: app_user\n`;
        content += `      POSTGRES_PASSWORD: app_password\n`;
        content += `    ports:\n`;
        content += `      - "5432:5432"\n`;
        content += `    volumes:\n`;
        content += `      - postgres_data:/var/lib/postgresql/data\n\n`;
      } else if (dbType === 'mongodb') {
        content += `      - mongo\n\n`;
        content += `  mongo:\n`;
        content += `    image: mongo:6\n`;
        content += `    environment:\n`;
        content += `      MONGO_INITDB_ROOT_USERNAME: admin\n`;
        content += `      MONGO_INITDB_ROOT_PASSWORD: password\n`;
        content += `    ports:\n`;
        content += `      - "27017:27017"\n`;
        content += `    volumes:\n`;
        content += `      - mongo_data:/data/db\n\n`;
      }
    } else {
      content += `      []\n\n`;
    }

    // Add Redis for caching
    content += `  redis:\n`;
    content += `    image: redis:7-alpine\n`;
    content += `    ports:\n`;
    content += `      - "6379:6379"\n`;
    content += `    volumes:\n`;
    content += `      - redis_data:/data\n\n`;

    content += `volumes:\n`;
    if (context.database?.type === 'postgresql') {
      content += `  postgres_data:\n`;
    } else if (context.database?.type === 'mongodb') {
      content += `  mongo_data:\n`;
    }
    content += `  redis_data:\n`;

    return {
      path: 'docker-compose.yml',
      content,
      type: 'docker-config'
    };
  }

  generateDockerIgnore(context) {
    const ignoreItems = [
      'node_modules',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      '.next',
      '.nuxt',
      'dist',
      'build',
      '.env*',
      '.git',
      '.gitignore',
      'README.md',
      'Dockerfile',
      'docker-compose.yml',
      '.dockerignore',
      'coverage',
      '.nyc_output',
      '.vscode',
      '.idea'
    ];

    return {
      path: '.dockerignore',
      content: ignoreItems.join('\n') + '\n',
      type: 'docker-config'
    };
  }

  async generateCICDPipeline(provider, requirements, context) {
    const providerConfig = this.cicdProviders[provider];
    if (!providerConfig) {
      throw new Error(`Unknown CI/CD provider: ${provider}`);
    }

    let pipelineContent = '';
    
    switch (provider) {
      case 'github-actions':
        pipelineContent = this.generateGitHubActionsPipeline(requirements, context);
        break;
      case 'gitlab-ci':
        pipelineContent = this.generateGitLabCIPipeline(requirements, context);
        break;
      case 'jenkins':
        pipelineContent = this.generateJenkinsfile(requirements, context);
        break;
      default:
        pipelineContent = `# ${provider} configuration\n# TODO: Implement ${provider} pipeline`;
    }

    const pipelineFile = {
      path: providerConfig.file,
      content: pipelineContent,
      type: 'cicd-pipeline'
    };

    return {
      files: [pipelineFile],
      pipeline: {
        name: provider,
        provider: provider,
        features: providerConfig.features
      }
    };
  }

  generateGitHubActionsPipeline(requirements, context) {
    let content = '';

    content += `name: CI/CD Pipeline\n\n`;
    content += `on:\n`;
    content += `  push:\n`;
    content += `    branches: [ main, develop ]\n`;
    content += `  pull_request:\n`;
    content += `    branches: [ main ]\n\n`;

    content += `env:\n`;
    content += `  NODE_VERSION: '18'\n`;
    content += `  REGISTRY: ghcr.io\n`;
    content += `  IMAGE_NAME: \${{ github.repository }}\n\n`;

    content += `jobs:\n`;
    
    // Test job
    content += `  test:\n`;
    content += `    runs-on: ubuntu-latest\n`;
    content += `    steps:\n`;
    content += `      - name: Checkout code\n`;
    content += `        uses: actions/checkout@v4\n\n`;
    
    content += `      - name: Setup Node.js\n`;
    content += `        uses: actions/setup-node@v4\n`;
    content += `        with:\n`;
    content += `          node-version: \${{ env.NODE_VERSION }}\n`;
    content += `          cache: 'npm'\n\n`;
    
    content += `      - name: Install dependencies\n`;
    content += `        run: npm ci\n\n`;
    
    content += `      - name: Run linting\n`;
    content += `        run: npm run lint\n\n`;
    
    content += `      - name: Run type checking\n`;
    content += `        run: npm run type-check\n`;
    content += `        if: hashFiles('tsconfig.json') != ''\n\n`;
    
    content += `      - name: Run tests\n`;
    content += `        run: npm run test:coverage\n\n`;
    
    content += `      - name: Upload coverage reports\n`;
    content += `        uses: codecov/codecov-action@v3\n`;
    content += `        with:\n`;
    content += `          token: \${{ secrets.CODECOV_TOKEN }}\n\n`;

    // Build job
    content += `  build:\n`;
    content += `    needs: test\n`;
    content += `    runs-on: ubuntu-latest\n`;
    content += `    steps:\n`;
    content += `      - name: Checkout code\n`;
    content += `        uses: actions/checkout@v4\n\n`;
    
    content += `      - name: Setup Node.js\n`;
    content += `        uses: actions/setup-node@v4\n`;
    content += `        with:\n`;
    content += `          node-version: \${{ env.NODE_VERSION }}\n`;
    content += `          cache: 'npm'\n\n`;
    
    content += `      - name: Install dependencies\n`;
    content += `        run: npm ci\n\n`;
    
    content += `      - name: Build application\n`;
    content += `        run: npm run build\n\n`;
    
    content += `      - name: Upload build artifacts\n`;
    content += `        uses: actions/upload-artifact@v3\n`;
    content += `        with:\n`;
    content += `          name: build-files\n`;
    content += `          path: |\n`;
    if (context.projectContext.framework === 'Next.js') {
      content += `            .next\n`;
    } else {
      content += `            dist\n`;
      content += `            build\n`;
    }
    content += `          retention-days: 1\n\n`;

    // Docker build and push
    if (requirements.includeDocker) {
      content += `  docker:\n`;
      content += `    needs: build\n`;
      content += `    runs-on: ubuntu-latest\n`;
      content += `    if: github.ref == 'refs/heads/main'\n`;
      content += `    permissions:\n`;
      content += `      contents: read\n`;
      content += `      packages: write\n`;
      content += `    steps:\n`;
      content += `      - name: Checkout code\n`;
      content += `        uses: actions/checkout@v4\n\n`;
      
      content += `      - name: Log in to Container Registry\n`;
      content += `        uses: docker/login-action@v3\n`;
      content += `        with:\n`;
      content += `          registry: \${{ env.REGISTRY }}\n`;
      content += `          username: \${{ github.actor }}\n`;
      content += `          password: \${{ secrets.GITHUB_TOKEN }}\n\n`;
      
      content += `      - name: Extract metadata\n`;
      content += `        id: meta\n`;
      content += `        uses: docker/metadata-action@v5\n`;
      content += `        with:\n`;
      content += `          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}\n\n`;
      
      content += `      - name: Build and push Docker image\n`;
      content += `        uses: docker/build-push-action@v5\n`;
      content += `        with:\n`;
      content += `          context: .\n`;
      content += `          push: true\n`;
      content += `          tags: \${{ steps.meta.outputs.tags }}\n`;
      content += `          labels: \${{ steps.meta.outputs.labels }}\n\n`;
    }

    // Deploy job
    content += `  deploy:\n`;
    content += `    needs: [test, build]\n`;
    content += `    runs-on: ubuntu-latest\n`;
    content += `    if: github.ref == 'refs/heads/main'\n`;
    content += `    environment: production\n`;
    content += `    steps:\n`;
    content += `      - name: Deploy to production\n`;
    content += `        run: |\n`;
    content += `          echo "Deploying to production..."\n`;
    content += `          # Add deployment commands here\n`;

    return content;
  }

  async generateEnvironmentConfigurations(requirements, context) {
    const files = [];
    const configurations = [];

    // Generate .env.example
    const envExample = this.generateEnvExample(context);
    files.push(envExample);

    // Generate environment-specific configs
    for (const env of requirements.environments) {
      const envConfig = this.generateEnvironmentConfig(env, context);
      files.push(envConfig);
    }

    configurations.push({
      name: 'Environment Configuration',
      type: 'environment',
      environments: requirements.environments
    });

    return { files, configurations };
  }

  generateEnvExample(context) {
    let content = '';

    content += `# Environment Configuration\n`;
    content += `# Copy this file to .env and fill in the values\n\n`;

    // Basic configuration
    content += `# Application\n`;
    content += `NODE_ENV=development\n`;
    content += `PORT=3000\n`;
    content += `APP_URL=http://localhost:3000\n\n`;

    // Database configuration
    if (context.database) {
      content += `# Database\n`;
      if (context.database.type === 'postgresql') {
        content += `DATABASE_URL=postgresql://user:password@localhost:5432/dbname\n`;
      } else if (context.database.type === 'mongodb') {
        content += `MONGODB_URI=mongodb://localhost:27017/dbname\n`;
      }
      content += `\n`;
    }

    // API keys and secrets
    content += `# Security\n`;
    content += `JWT_SECRET=your-super-secret-jwt-key\n`;
    content += `SESSION_SECRET=your-session-secret\n`;
    content += `ENCRYPTION_KEY=your-32-character-encryption-key\n\n`;

    // External services
    content += `# External Services\n`;
    content += `# SMTP_HOST=smtp.gmail.com\n`;
    content += `# SMTP_PORT=587\n`;
    content += `# SMTP_USER=your-email@gmail.com\n`;
    content += `# SMTP_PASS=your-app-password\n\n`;

    // Monitoring and logging
    content += `# Monitoring\n`;
    content += `# SENTRY_DSN=your-sentry-dsn\n`;
    content += `# LOG_LEVEL=info\n\n`;

    return {
      path: '.env.example',
      content,
      type: 'env-template'
    };
  }

  // Utility methods
  parseInfrastructureRequirement(requirement, requirements) {
    if (requirement.cicd) {
      requirements.cicdProviders = requirement.cicd.providers || requirements.cicdProviders;
    }
    
    if (requirement.deployment) {
      requirements.deploymentTargets = requirement.deployment.targets || requirements.deploymentTargets;
    }
    
    if (requirement.docker !== undefined) {
      requirements.includeDocker = requirement.docker;
    }
    
    if (requirement.monitoring !== undefined) {
      requirements.includeMonitoring = requirement.monitoring;
    }
  }
}

module.exports = { InfrastructureAgent };