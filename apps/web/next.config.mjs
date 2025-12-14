/** @type {import('next').NextConfig} */
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);

const nextConfig = {
  reactStrictMode: true,
  // Ensure all Lazorkit packages are transpiled for Next.js bundler
  transpilePackages: ['@lazor-starter/core', '@lazor-starter/ui', '@lazorkit/wallet'],
  // Fix workspace root detection when multiple lockfiles exist
  outputFileTracingRoot: path.join(process.cwd(), '../..'),
  // Explicit dist dir to avoid Turbopack path resolution issues on Windows
  distDir: '.next',
  // Note: Next.js 16 uses Turbopack by default
  // Webpack config below will be used when Turbopack is disabled via --no-turbo flag
  // Webpack config to exclude expo modules (they're only for mobile)
  webpack: (config, { isServer, webpack }) => {
    // Ensure webpack resolves .tsx files (not .native.tsx) for web platform
    config.resolve.extensions = ['.web.tsx', '.web.ts', '.tsx', '.ts', '.jsx', '.js', '.json'];
    
    // Exclude .native.tsx and .native.ts files from web build
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force web versions by excluding native extensions
      // Version 1.8.4 has prebuilt dist, use default resolution
    };
    
    // Add rule to ignore .native.* files
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.native\.(tsx?|jsx?)$/,
      use: 'ignore-loader',
    });
    // Exclude React Native and NativeWind packages from web build
    const reactNativePackages = [
      'react-native',
      'react-native-css-interop',
      'nativewind',
      'react-native-reanimated',
      'react-native-screens',
      'react-native-svg',
      'lucide-react-native',
      '@rn-primitives/avatar',
      '@rn-primitives/checkbox',
      '@rn-primitives/dialog',
      '@rn-primitives/label',
      '@rn-primitives/progress',
      '@rn-primitives/separator',
      '@rn-primitives/slot',
      '@rn-primitives/toggle',
      'expo-constants',
      'expo-modules-core',
    ];

    // Create alias to exclude React Native packages
    reactNativePackages.forEach((pkg) => {
      config.resolve.alias = {
        ...config.resolve.alias,
        [pkg]: false,
      };
    });

    // Use webpack.IgnorePlugin to completely ignore react-native packages
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(react-native|react-native-css-interop|nativewind|react-native-reanimated|react-native-screens|react-native-svg|lucide-react-native|@rn-primitives\/.*)$/,
      })
    );

    if (!isServer) {
      // Fix for bufferutil/utf-8-validate in Solana WebSocket
      // These are optional native modules for WebSocket optimization
      // In browser, we need to use pure JS implementation
      config.resolve.fallback = {
        ...config.resolve.fallback,
        bufferutil: false,
        'utf-8-validate': false,
        buffer: require.resolve('buffer/'),
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
      };
      
      // Provide buffer as global for browser
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        })
      );
    } else {
      // Server-side: allow native modules but still fallback
      config.resolve.fallback = {
        ...config.resolve.fallback,
        bufferutil: false,
        'utf-8-validate': false,
      };
    }
    
    // Ignore warnings about optional dependencies and React Native packages
    config.ignoreWarnings = [
      { module: /bufferutil/ },
      { module: /utf-8-validate/ },
      { module: /react-native-css-interop/ },
      { module: /nativewind/ },
      { module: /react-native/ },
    ];
    
    return config;
  },
  // Load env vars from root .env.local
  env: {
    NEXT_PUBLIC_LAZORKIT_RPC_URL: process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL,
    NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL,
    NEXT_PUBLIC_LAZORKIT_PORTAL_URL: process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    RPC_URL: process.env.RPC_URL,
    LAZORKIT_RPC_URL: process.env.LAZORKIT_RPC_URL,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    SMART_WALLET_INIT_LAMPORTS: process.env.SMART_WALLET_INIT_LAMPORTS,
    MIN_FEE_LAMPORTS: process.env.MIN_FEE_LAMPORTS,
    AIRDROP_LAMPORTS: process.env.AIRDROP_LAMPORTS,
  },
};

export default nextConfig;
