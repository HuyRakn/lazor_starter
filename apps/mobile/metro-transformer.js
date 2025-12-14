/**
 * Custom Metro transformer to fix @lazorkit/wallet missing LazorkitProvider
 */
const upstreamTransformer = require('@expo/metro-config/babel-transformer');

module.exports.transform = function ({ src, filename, options }) {
  // Fix @lazorkit/wallet dist/index.js import of missing LazorkitProvider
  if (filename.includes('@lazorkit/wallet') && filename.includes('dist/index.js')) {
    src = src.replace(
      /export\s*{\s*LazorkitProvider\s*}\s*from\s*['"]\.\/react\/LazorkitProvider['"];?/g,
      '// LazorkitProvider export removed - using useWalletStore directly instead'
    );
  }
  
  // Fix react/index.js import of missing LazorkitProvider
  if (filename.includes('@lazorkit/wallet') && filename.includes('react/index.js')) {
    src = src.replace(
      /export\s*\*\s*from\s*['"]\.\/LazorkitProvider['"];?/g,
      '// LazorkitProvider export removed - using useWalletStore directly instead'
    );
  }

  return upstreamTransformer.transform({ src, filename, options });
};

