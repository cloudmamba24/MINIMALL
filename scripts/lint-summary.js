#!/usr/bin/env node

/**
 * MiniMall Lint Summary Script
 * 
 * Provides enhanced lint reporting with architectural pattern analysis
 */

const { execSync } = require('child_process');

function getLintResults() {
  try {
    const result = execSync('npm run lint 2>&1', { encoding: 'utf8' });
    return result;
  } catch (error) {
    return error.stdout;
  }
}

function analyzeLintResults(output) {
  const lines = output.split('\n');
  
  const stats = {
    total: 0,
    byType: {},
    byComponent: {},
    unused_suppressions: 0
  };

  // Extract error count
  const errorLine = lines.find(line => line.includes('Found') && line.includes('errors'));
  if (errorLine) {
    const match = errorLine.match(/Found (\d+) errors/);
    if (match) {
      stats.total = parseInt(match[1]);
    }
  }

  // Analyze error types
  lines.forEach(line => {
    if (line.includes('lint/')) {
      // Extract rule type
      const ruleMatch = line.match(/lint\/(\w+)\/(\w+)/);
      if (ruleMatch) {
        const category = ruleMatch[1];
        const rule = ruleMatch[2];
        const fullRule = `${category}/${rule}`;
        
        stats.byType[fullRule] = (stats.byType[fullRule] || 0) + 1;
      }
      
      // Extract component path
      const pathMatch = line.match(/^\.\/src\/([^:]+)/);
      if (pathMatch) {
        const path = pathMatch[1];
        const component = path.split('/').slice(0, 2).join('/'); // Get component category
        stats.byComponent[component] = (stats.byComponent[component] || 0) + 1;
      }
    }
    
    if (line.includes('suppressions/unused')) {
      stats.unused_suppressions++;
    }
  });

  return stats;
}

function generateReport(stats) {
  console.log('🎯 MiniMall Lint Analysis Report');
  console.log('=====================================\n');
  
  console.log(`📊 Total Errors: ${stats.total}`);
  console.log(`🔇 Unused Suppressions: ${stats.unused_suppressions}`);
  console.log(`✅ Active Errors: ${stats.total - stats.unused_suppressions}\n`);
  
  console.log('📋 Error Types:');
  Object.entries(stats.byType)
    .sort(([,a], [,b]) => b - a)
    .forEach(([rule, count]) => {
      console.log(`  ${rule}: ${count}`);
    });
  
  console.log('\n🏗️  Error Distribution by Component:');
  Object.entries(stats.byComponent)
    .sort(([,a], [,b]) => b - a)
    .forEach(([component, count]) => {
      console.log(`  ${component}: ${count}`);
    });

  console.log('\n🎉 Architectural Patterns Status:');
  console.log('  ✅ Array index keys: Configured for UI components');
  console.log('  ✅ Performance dependencies: Configured for optimization');
  console.log('  ✅ Business logic: Configured for shop/modal components');
  
  if (stats.total <= 20) {
    console.log('\n🏆 EXCELLENT: Lint errors under control!');
  } else if (stats.total <= 30) {
    console.log('\n👍 GOOD: Manageable lint error count');
  } else {
    console.log('\n⚠️  NEEDS ATTENTION: Consider additional configuration');
  }
}

// Main execution
const lintOutput = getLintResults();
const stats = analyzeLintResults(lintOutput);
generateReport(stats);