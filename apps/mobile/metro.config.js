// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// In monorepo, Metro should only watch the mobile app directory
// Ignore web app's .next build directory and other build artifacts
config.watchFolders = [
  path.resolve(__dirname, '../../'),
];

// Block Metro from watching .next directories (Next.js build output)
// Fix: Ensure blockList is an array and handle undefined
const existingBlockList = config.resolver?.blockList;
let blockList = [];
if (Array.isArray(existingBlockList)) {
  blockList = [...existingBlockList];
} else if (existingBlockList) {
  // If it's not an array but exists, try to convert
  blockList = [existingBlockList];
}

config.resolver = {
  ...config.resolver,
  blockList: [
    ...blockList,
    // Ignore Next.js .next directories
    /.*\/\.next\/.*/,
    // Ignore node_modules in web app (if any)
    /.*\/apps\/web\/node_modules\/.*/,
    // Ignore .next directories anywhere
    /\.next\/.*/,
  ],
  // Ensure proper module resolution in pnpm monorepo
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '../../node_modules'),
  ],
};

// Also filter watchFolders to exclude .next directories
if (Array.isArray(config.watchFolders)) {
  config.watchFolders = config.watchFolders.filter((folder) => {
    return folder && !folder.includes('.next');
  });
}

module.exports = config;

