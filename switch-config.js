#!/usr/bin/env node

/**
 * Script to switch between public and admin Vercel configurations
 * Usage: node switch-config.js public|admin
 */

const fs = require("node:fs");
const _path = require("node:path");

const configType = process.argv[2];

if (!configType || !["public", "admin"].includes(configType)) {
  console.error("Usage: node switch-config.js public|admin");
  process.exit(1);
}

const publicConfig = "vercel-public.json";
const adminConfig = "vercel-admin.json";
const activeConfig = "vercel.json";

try {
  // Remove existing vercel.json if it exists
  if (fs.existsSync(activeConfig)) {
    fs.unlinkSync(activeConfig);
  }

  // Copy the appropriate config to vercel.json
  const sourceConfig = configType === "public" ? publicConfig : adminConfig;

  if (!fs.existsSync(sourceConfig)) {
    console.error(`Configuration file ${sourceConfig} not found!`);
    process.exit(1);
  }

  fs.copyFileSync(sourceConfig, activeConfig);

  console.log(`✅ Switched to ${configType} configuration (${sourceConfig} -> ${activeConfig})`);

  // Show the active config
  const config = JSON.parse(fs.readFileSync(activeConfig, "utf8"));
  console.log(`📦 Active build command: ${config.buildCommand}`);
  console.log(`📁 Active output directory: ${config.outputDirectory}`);
} catch (error) {
  console.error("Error switching configuration:", error.message);
  process.exit(1);
}
