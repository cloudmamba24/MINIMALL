// Quick script to create and publish a test config
const { createDefaultSiteConfig } = require('@minimall/core');

async function createTestConfig() {
  const config = createDefaultSiteConfig('cloudmamba.myshopify.com');
  
  console.log('Created config with ID:', config.id);
  console.log('\nYou can view this config at:');
  console.log(`https://minimall-tau.vercel.app/g/${config.id}`);
  
  // Save config to a JSON file for reference
  const fs = require('fs');
  fs.writeFileSync(`test-config-${config.id}.json`, JSON.stringify(config, null, 2));
  console.log(`\nConfig saved to test-config-${config.id}.json`);
  
  // Now you could manually upload this to R2 or database
  console.log('\nTo publish this config:');
  console.log('1. Upload the JSON file to R2 at path: configs/' + config.id + '/live.json');
  console.log('2. Or insert into database manually');
}

createTestConfig().catch(console.error);