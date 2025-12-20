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
    scheme: 'lazor-starter',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.lazorstarter.app',
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ['lazor-starter'],
          },
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      package: 'com.lazorstarter.app',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'lazor-starter',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-router'],
    extra: {
      // Mainnet configuration
      lazorkitRpcUrlMain: process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL || '',
      lazorkitPaymasterUrlMain: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || '',
      // Devnet configuration
      lazorkitRpcUrlDev: process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL_DEVNET || '',
      lazorkitPaymasterUrlDev: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL_DEVNET || '',
      // Portal is the same for both networks
      lazorkitPortalUrl:
        process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL ||
        process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL_DEVNET ||
        '',
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    },
  },
};
