// Load environment variables from root .env.local
// Expo will automatically load .env files from the project root
require('dotenv').config({ path: '../../.env.local' });

export default {
  expo: {
    name: 'Lazor Starter',
    slug: 'lazor-starter',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.lazorstarter.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      package: 'com.lazorstarter.app',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    scheme: 'lazor-starter',
    plugins: ['expo-router'],
    extra: {
      // These will be available via Constants.expoConfig.extra
      lazorkitRpcUrl:
        process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL ||
        process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL_DEVNET ||
        '',
      lazorkitPaymasterUrl:
        process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL ||
        process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL_DEVNET ||
        '',
      lazorkitPortalUrl:
        process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL ||
        process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL_DEVNET ||
        '',
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    },
  },
};
