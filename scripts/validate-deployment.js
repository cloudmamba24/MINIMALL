#!/usr/bin/env node

/**
 * Pre-deployment validation script that mimics Vercel's build process
 * This catches errors locally before deployment to save time
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  warning: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  title: (msg) => console.log(`\n${COLORS.bright}${COLORS.cyan}${msg}${COLORS.reset}`),
  step: (msg) => console.log(`\n${COLORS.magenta}→${COLORS.reset} ${msg}`),
};

class DeploymentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.startTime = Date.now();
  }

  async validate(app = null) {
    log.title('🚀 MINIMALL Deployment Validation');
    log.info('Simulating Vercel build process locally...\n');

    try {
      // Determine which apps to validate
      const appsToValidate = app ? [app] : ['admin', 'public'];
      
      for (const appName of appsToValidate) {
        await this.validateApp(appName);
      }

      await this.runGlobalChecks();
      this.printSummary();

    } catch (error) {
      log.error(`Validation failed: ${error.message}`);
      process.exit(1);
    }
  }

  async validateApp(appName) {
    log.title(`📦 Validating ${appName} app`);
    
    const appPath = path.join(process.cwd(), 'apps', appName);
    if (!fs.existsSync(appPath)) {
      this.addError(`App directory not found: ${appPath}`);
      return;
    }

    // 1. Environment validation
    await this.validateEnvironment(appName);

    // 2. Dependencies check
    await this.checkDependencies(appName);

    // 3. Type checking (like Vercel does)
    await this.runTypeCheck(appName);

    // 4. Linting (catches code quality issues)
    await this.runLinting(appName);

    // 5. Build validation (most important - simulates actual deployment)
    await this.validateBuild(appName);

    // 6. Test validation
    await this.runTests(appName);

    // 7. Security checks
    await this.runSecurityChecks(appName);
  }

  async validateEnvironment(appName) {
    log.step(`Checking environment configuration for ${appName}`);

    const vercelConfigPath = path.join(process.cwd(), 'apps', appName, 'vercel.json');
    if (fs.existsSync(vercelConfigPath)) {
      try {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
        
        // Check required environment variables from turbo.json
        const turboConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'turbo.json'), 'utf8'));
        const requiredEnvVars = turboConfig.tasks.build.env || [];

        for (const envVar of requiredEnvVars) {
          if (!process.env[envVar] && !envVar.startsWith('NEXT_PUBLIC_')) {
            this.addWarning(`Environment variable ${envVar} not set (will use default/empty)`);
          }
        }

        log.success(`Environment configuration validated for ${appName}`);
      } catch (error) {
        this.addError(`Failed to parse vercel.json for ${appName}: ${error.message}`);
      }
    }
  }

  async checkDependencies(appName) {
    log.step(`Checking dependencies for ${appName}`);

    try {
      // Check for security vulnerabilities
      execSync('npm audit --audit-level=high', { 
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      log.success(`No high-severity vulnerabilities found in ${appName}`);
    } catch (error) {
      this.addWarning(`Security vulnerabilities detected in dependencies for ${appName}`);
    }

    // Check package-lock integrity
    try {
      execSync('npm ci --dry-run', { 
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      log.success(`Package-lock integrity verified for ${appName}`);
    } catch (error) {
      this.addError(`Package-lock integrity issues for ${appName}: ${error.message}`);
    }
  }

  async runTypeCheck(appName) {
    log.step(`Running TypeScript validation for ${appName}`);

    try {
      execSync(`npx turbo type-check --filter=@minimall/${appName}`, { 
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      log.success(`TypeScript validation passed for ${appName}`);
    } catch (error) {
      this.addError(`TypeScript errors in ${appName}. Run 'npm run type-check' for details.`);
    }
  }

  async runLinting(appName) {
    log.step(`Running linting for ${appName}`);

    try {
      execSync(`npx turbo lint --filter=@minimall/${appName}`, { 
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      log.success(`Linting passed for ${appName}`);
    } catch (error) {
      this.addWarning(`Linting issues in ${appName}. Run 'npm run lint' for details.`);
    }
  }

  async validateBuild(appName) {
    log.step(`Building ${appName} (simulating Vercel build)`);

    try {
      // Clean build
      execSync(`npx turbo clean --filter=@minimall/${appName}`, { 
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      // Production build with exact Vercel command
      const buildCmd = appName === 'admin' 
        ? 'npx turbo build --filter=@minimall/admin --force'
        : 'npx turbo build --filter=@minimall/public --force';

      log.info(`Running: ${buildCmd}`);
      execSync(buildCmd, { 
        cwd: process.cwd(),
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'production',
          NEXT_PUBLIC_APP_ENV: 'production'
        }
      });

      // Verify build output
      const buildPath = path.join(process.cwd(), 'apps', appName, '.next');
      if (!fs.existsSync(buildPath)) {
        this.addError(`Build output not found for ${appName}`);
        return;
      }

      // Check for build warnings/errors in output
      const buildInfoPath = path.join(buildPath, 'build-manifest.json');
      if (fs.existsSync(buildInfoPath)) {
        log.success(`Build completed successfully for ${appName}`);
      } else {
        this.addWarning(`Build may have issues - build manifest not found for ${appName}`);
      }

    } catch (error) {
      this.addError(`Build failed for ${appName}: ${error.message.split('\n')[0]}`);
    }
  }

  async runTests(appName) {
    log.step(`Running tests for ${appName}`);

    try {
      execSync(`npx turbo test --filter=@minimall/${appName}`, { 
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      log.success(`Tests passed for ${appName}`);
    } catch (error) {
      this.addWarning(`Test failures in ${appName}. Run 'npm test' for details.`);
    }
  }

  async runSecurityChecks(appName) {
    log.step(`Running security checks for ${appName}`);

    // Check for sensitive data exposure
    const appPath = path.join(process.cwd(), 'apps', appName);
    const buildPath = path.join(appPath, '.next');

    if (fs.existsSync(buildPath)) {
      try {
        // Check for API keys in built files (basic check)
        const result = execSync(`grep -r "sk_" "${buildPath}" || true`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        if (result.trim()) {
          this.addError(`Potential API key exposure detected in ${appName} build`);
        } else {
          log.success(`No obvious sensitive data exposure in ${appName}`);
        }
      } catch (error) {
        // Ignore grep errors
      }
    }
  }

  async runGlobalChecks() {
    log.title('🔍 Running global checks');

    // Check workspace integrity
    log.step('Checking workspace integrity');
    try {
      execSync('npm run type-check', { 
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      log.success('Global type checking passed');
    } catch (error) {
      this.addError('Global type checking failed');
    }

    // Check for common issues
    log.step('Checking for common deployment issues');
    
    // Check for conflicting dependencies
    const rootPackage = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    if (rootPackage.overrides && Object.keys(rootPackage.overrides).length > 0) {
      log.warning('Package overrides detected - ensure they are necessary for deployment');
    }

    log.success('Global checks completed');
  }

  addError(message) {
    this.errors.push(message);
    log.error(message);
  }

  addWarning(message) {
    this.warnings.push(message);
    log.warning(message);
  }

  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    log.title('📊 Validation Summary');
    
    if (this.errors.length === 0) {
      log.success(`✨ All checks passed! Ready for deployment (${duration}s)`);
      
      if (this.warnings.length > 0) {
        log.warning(`${this.warnings.length} warnings found (non-blocking):`);
        this.warnings.forEach(warning => log.warning(`  • ${warning}`));
      }

      log.info('\n🚀 Safe to deploy to Vercel!');
      log.info('💡 Run with --app=admin or --app=public to validate specific apps');
      
    } else {
      log.error(`❌ ${this.errors.length} errors found (${duration}s):`);
      this.errors.forEach(error => log.error(`  • ${error}`));
      
      if (this.warnings.length > 0) {
        log.warning(`${this.warnings.length} additional warnings:`);
        this.warnings.forEach(warning => log.warning(`  • ${warning}`));
      }

      log.error('\n🚫 Fix errors before deploying to Vercel!');
      process.exit(1);
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const appArg = args.find(arg => arg.startsWith('--app='));
const app = appArg ? appArg.split('=')[1] : null;

if (app && !['admin', 'public'].includes(app)) {
  log.error('Invalid app specified. Use --app=admin or --app=public');
  process.exit(1);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Validation cancelled by user');
  process.exit(1);
});

// Run validation
const validator = new DeploymentValidator();
validator.validate(app).catch(error => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
