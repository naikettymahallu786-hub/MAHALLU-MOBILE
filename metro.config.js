const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;

let workspaceRoot = path.resolve(projectRoot, '../..');
if (!fs.existsSync(path.join(workspaceRoot, 'package.json'))) {
  workspaceRoot = path.resolve(projectRoot, '..');
}
if (!fs.existsSync(path.join(workspaceRoot, 'package.json'))) {
  workspaceRoot = projectRoot;
}

const config = getDefaultConfig(projectRoot);

if (workspaceRoot !== projectRoot && fs.existsSync(workspaceRoot)) {
  config.watchFolders = [workspaceRoot];
}

// Ensure audio extensions are in assetExts
if (!config.resolver.assetExts.includes('mp3')) {
  config.resolver.assetExts.push('mp3', 'wav', 'm4a', 'aac');
}

// Map shared package names to local package directories inside apps/mobile/packages
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@mahallu/shared-types': path.resolve(projectRoot, 'packages/shared-types'),
  '@mahallu/shared-config': path.resolve(projectRoot, 'packages/shared-config'),
};

module.exports = withNativeWind(config, { input: './global.css' });
