#!/usr/bin/env node

const fs = require('fs');
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

// Basic semver validation
const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
if (!semverPattern.test(newVersion)) {
  console.error(`Error: Invalid version format: ${newVersion}`);
  console.error('Expected format: x.y.z or x.y.z-prerelease or x.y.z+build');
  process.exit(1);
}

function updatePackageVersion(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const packageJson = JSON.parse(content);
    
    if (packageJson.version) {
      const oldVersion = packageJson.version;
      packageJson.version = newVersion;
      fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`Updated ${filePath}: ${oldVersion} -> ${newVersion}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Validate we're in the repository root
if (!fs.existsSync('package.json') || !fs.existsSync('frontend-nx')) {
  console.error('Error: This script must be run from the repository root');
  process.exit(1);
}

// Update root package.json
updatePackageVersion('package.json');

// Update frontend-nx package.json
updatePackageVersion('frontend-nx/package.json');

// Find and update all function package.json files
try {
  const functionDirs = execSync('find functions -name "package.json" 2>/dev/null || true', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(line => line.trim() && line.endsWith('package.json'));

  if (functionDirs.length > 0 && functionDirs[0] !== '') {
    functionDirs.forEach(updatePackageVersion);
  } else {
    console.log('No function package.json files found');
  }
} catch (error) {
  console.error('Error finding function package.json files:', error.message);
}

console.log(`Version update complete: ${newVersion}`);