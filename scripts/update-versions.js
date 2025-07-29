#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Updates version field in package.json files
 * Usage: node scripts/update-versions.js <new-version>
 */

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Error: Version argument is required');
  console.error('Usage: node scripts/update-versions.js <new-version>');
  process.exit(1);
}

function updatePackageVersion(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const packageJson = JSON.parse(content);
    
    if (packageJson.version) {
      packageJson.version = newVersion;
      fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`Updated ${filePath}: ${packageJson.version} -> ${newVersion}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Update root package.json
updatePackageVersion('package.json');

// Update frontend-nx package.json
updatePackageVersion('frontend-nx/package.json');

// Find and update all function package.json files
try {
  const functionDirs = execSync('find functions -name "package.json"', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(line => line.trim());

  functionDirs.forEach(updatePackageVersion);
} catch (error) {
  console.error('Error finding function package.json files:', error.message);
}

console.log(`Version update complete: ${newVersion}`);