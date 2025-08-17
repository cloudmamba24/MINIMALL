#!/usr/bin/env node

/**
 * MINIMALL Setup Validation Script
 * Run this to verify your installation is properly configured
 * Usage: node scripts/validate-setup.js
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}`),
};

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  log.error('.env.local file not found!');
  log.info('Please copy .env.example to .env.local and configure it:');
  console.log('  cp .env.example .env.local');
  process.exit(1);
}

dotenv.config({ path: envPath });

// Track validation results
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

// Validation functions
function checkEnvVar(name, required = true, sensitive = false) {
  const value = process.env[name];
  if (value) {
    if (sensitive) {
      log.success(`${name} is set (***${value.slice(-4)})`);
    } else {
      log.success(`${name} is set: ${value}`);
    }
    results.passed.push(name);
    return true;
  } else {
    if (required) {
      log.error(`${name} is NOT set (required)`);
      results.failed.push(name);
    } else {
      log.warning(`${name} is not set (optional)`);
      results.warnings.push(name);
    }
    return false;
  }
}

async function testDatabaseConnection() {
  log.header('Testing Database Connection...');
  
  if (!process.env.DATABASE_URL) {
    log.error('DATABASE_URL not set - cannot test connection');
    return false;
  }

  try {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    
    // Try a simple query
    const result = await sql`SELECT 1 as test`;
    if (result && result[0]?.test === 1) {
      log.success('Database connection successful!');
      
      // Test if tables exist
      try {
        const tables = await sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          LIMIT 5
        `;
        if (tables.length > 0) {
          log.success(`Found ${tables.length} tables in database`);
          tables.forEach(t => log.info(`  - ${t.table_name}`));
        } else {
          log.warning('No tables found. Run migrations: npm run db:migrate');
        }
      } catch (e) {
        log.warning('Could not query tables');
      }
      
      return true;
    }
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    log.info('Check your DATABASE_URL and ensure the database is accessible');
    return false;
  }
}

async function testR2Connection() {
  log.header('Testing R2 Storage...');
  
  const hasR2 = 
    checkEnvVar('R2_ENDPOINT', true, false) &&
    checkEnvVar('R2_ACCESS_KEY', true, true) &&
    checkEnvVar('R2_SECRET', true, true) &&
    checkEnvVar('R2_BUCKET_NAME', true, false);
  
  if (!hasR2) {
    log.error('R2 configuration incomplete');
    return false;
  }

  // Test actual connectivity
  try {
    const testUrl = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}`;
    log.info(`Testing connection to: ${testUrl}`);
    // Note: Actual R2 connectivity test would require AWS SDK
    log.warning('R2 connectivity test requires running the application');
    return true;
  } catch (error) {
    log.error(`R2 connection test failed: ${error.message}`);
    return false;
  }
}

function checkShopifyConfig() {
  log.header('Checking Shopify Configuration...');
  
  const required = [
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_SECRET',
    'SHOPIFY_DOMAIN',
  ];
  
  const optional = [
    'SHOPIFY_WEBHOOK_SECRET',
    'SHOPIFY_STOREFRONT_ACCESS_TOKEN',
    'SHOPIFY_SCOPES',
  ];
  
  let allRequired = true;
  required.forEach(key => {
    if (!checkEnvVar(key, true, key.includes('SECRET'))) {
      allRequired = false;
    }
  });
  
  optional.forEach(key => {
    checkEnvVar(key, false, key.includes('SECRET') || key.includes('TOKEN'));
  });
  
  return allRequired;
}

function checkAuthConfig() {
  log.header('Checking Authentication Configuration...');
  
  const hasNextAuth = checkEnvVar('NEXTAUTH_SECRET', true, true);
  const hasNextAuthUrl = checkEnvVar('NEXTAUTH_URL', false, false);
  const hasInternalToken = checkEnvVar('INTERNAL_API_TOKEN', true, true);
  
  if (!hasNextAuth) {
    log.info('Generate NEXTAUTH_SECRET with: openssl rand -base64 32');
  }
  
  if (!hasInternalToken) {
    log.info('Generate INTERNAL_API_TOKEN with: openssl rand -hex 32');
  }
  
  return hasNextAuth && hasInternalToken;
}

function checkOptionalServices() {
  log.header('Checking Optional Services...');
  
  checkEnvVar('SENTRY_DSN', false, false);
  checkEnvVar('INSTAGRAM_APP_ID', false, false);
  checkEnvVar('GOOGLE_ANALYTICS_ID', false, false);
  
  // Feature flags
  checkEnvVar('FEATURE_ADVANCED_ANALYTICS', false, false);
  checkEnvVar('FEATURE_SOCIAL_IMPORT', false, false);
}

function checkNodeModules() {
  log.header('Checking Dependencies...');
  
  const nodeModulesExists = fs.existsSync(path.join(__dirname, '..', 'node_modules'));
  if (!nodeModulesExists) {
    log.error('node_modules not found. Run: npm install');
    return false;
  }
  
  // Check if packages are built
  const packagesToCheck = [
    'packages/db/dist',
    'packages/core/dist',
    'packages/ui/dist',
  ];
  
  let allBuilt = true;
  packagesToCheck.forEach(pkg => {
    const pkgPath = path.join(__dirname, '..', pkg);
    if (fs.existsSync(pkgPath)) {
      log.success(`${pkg} is built`);
    } else {
      log.warning(`${pkg} not built. Run: npm run build`);
      allBuilt = false;
    }
  });
  
  return nodeModulesExists && allBuilt;
}

async function testHealthEndpoints() {
  log.header('Testing Health Endpoints...');
  
  try {
    // Check if servers are running
    const adminHealth = await fetch('http://localhost:3001/api/health')
      .then(r => r.json())
      .catch(() => null);
    
    if (adminHealth) {
      log.success(`Admin health check: ${adminHealth.status}`);
      adminHealth.services?.forEach(s => {
        const icon = s.status === 'healthy' ? '✓' : s.status === 'degraded' ? '⚠' : '✗';
        log.info(`  ${icon} ${s.service}: ${s.message}`);
      });
    } else {
      log.warning('Admin server not running (http://localhost:3001)');
      log.info('Start with: npm run dev');
    }
    
    const publicHealth = await fetch('http://localhost:3000/api/health')
      .then(r => r.json())
      .catch(() => null);
    
    if (publicHealth) {
      log.success(`Public health check: ${publicHealth.status}`);
    } else {
      log.warning('Public server not running (http://localhost:3000)');
    }
  } catch (error) {
    log.warning('Could not test health endpoints - servers may not be running');
  }
}

// Main validation
async function validate() {
  console.log(colors.bright + colors.cyan);
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     MINIMALL Setup Validation Script       ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Check .env.local exists
  log.header('Checking Environment File...');
  log.success('.env.local found');

  // Check core environment variables
  log.header('Checking Core Configuration...');
  checkEnvVar('NODE_ENV', false, false);
  checkEnvVar('NEXT_PUBLIC_BASE_URL', false, false);
  checkEnvVar('NEXT_PUBLIC_ADMIN_URL', false, false);

  // Run all checks
  const dbOk = await testDatabaseConnection();
  const r2Ok = await testR2Connection();
  const shopifyOk = checkShopifyConfig();
  const authOk = checkAuthConfig();
  checkOptionalServices();
  const depsOk = checkNodeModules();
  await testHealthEndpoints();

  // Summary
  console.log('\n' + colors.bright + '═══════════════════════════════════════════════' + colors.reset);
  console.log(colors.bright + 'VALIDATION SUMMARY' + colors.reset);
  console.log('═══════════════════════════════════════════════');
  
  const criticalOk = dbOk && r2Ok && authOk;
  const allOk = criticalOk && shopifyOk && depsOk;
  
  if (allOk) {
    console.log(colors.green + colors.bright);
    console.log('✓ All checks passed! Your MINIMALL installation is ready.');
    console.log(colors.reset);
    console.log('\nNext steps:');
    console.log('  1. Run database migrations: npm run db:migrate');
    console.log('  2. Start development servers: npm run dev');
    console.log('  3. Open admin panel: http://localhost:3001');
  } else if (criticalOk) {
    console.log(colors.yellow + colors.bright);
    console.log('⚠ Setup is functional but has some issues:');
    console.log(colors.reset);
    if (!shopifyOk) console.log('  - Shopify configuration incomplete');
    if (!depsOk) console.log('  - Some packages need building');
    console.log('\nThe application will work but some features may be limited.');
  } else {
    console.log(colors.red + colors.bright);
    console.log('✗ Critical configuration issues found:');
    console.log(colors.reset);
    if (!dbOk) console.log('  - Database connection failed');
    if (!r2Ok) console.log('  - R2 storage not configured');
    if (!authOk) console.log('  - Authentication not configured');
    console.log('\nPlease fix these issues before running the application.');
  }
  
  if (results.failed.length > 0) {
    console.log('\n' + colors.red + 'Failed checks:' + colors.reset);
    results.failed.forEach(item => console.log('  - ' + item));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n' + colors.yellow + 'Warnings:' + colors.reset);
    results.warnings.forEach(item => console.log('  - ' + item));
  }
  
  console.log('\n' + colors.cyan + 'For detailed setup instructions, see README.md' + colors.reset);
  
  process.exit(allOk ? 0 : 1);
}

// Run validation
validate().catch(error => {
  console.error(colors.red + 'Validation script error:', error.message + colors.reset);
  process.exit(1);
});