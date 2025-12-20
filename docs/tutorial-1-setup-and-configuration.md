# Tutorial 1: Setup and Configuration

This tutorial will guide you through setting up the Lazor Starter project for both **Web (Next.js)** and **Mobile (Expo/React Native)** platforms.

## Prerequisites

- **Node.js** 18+ installed
- **pnpm** 8+ installed
- **iOS Simulator** or **Android Emulator** (for mobile development)
- **Expo Go** app on your phone (for testing mobile app)

## ⚠️ Important: HTTPS Requirement

**This project REQUIRES HTTPS, even for local development.**

**Why?**
- **WebAuthn/Passkey** authentication requires HTTPS (browser security policy)
- Passkey will **NOT work** on HTTP, even on `localhost`
- This is a security requirement from the WebAuthn specification

**What this means:**
- Always access the web app via `https://localhost:3000` (not `http://`)
- The dev server automatically uses HTTPS via `--experimental-https` flag
- You'll need to accept a self-signed SSL certificate warning (safe for local development)

**Mobile apps** don't have this restriction - they use native biometric APIs.

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd lazor-starter

# Install all dependencies
pnpm install
```

## Step 2: Environment Configuration

Create a `.env.local` file in the **root directory** (not in apps/web or apps/mobile):

```env
# ===== MAINNET (PUBLIC) =====
# Replace with your own RPC URL (e.g., from Helius, QuickNode, or Alchemy)
NEXT_PUBLIC_LAZORKIT_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY_HERE
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://kora.lazorkit.com
# Get your API key from Lazorkit dashboard
NEXT_PUBLIC_LAZORKIT_API_KEY=YOUR_LAZORKIT_API_KEY_HERE

# ===== DEVNET (PUBLIC) =====
# Replace with your own devnet RPC URL
NEXT_PUBLIC_LAZORKIT_RPC_URL_DEVNET=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY_HERE
NEXT_PUBLIC_LAZORKIT_PORTAL_URL_DEVNET=https://portal.lazor.sh
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL_DEVNET=https://kora.devnet.lazorkit.com
```

**Important Notes:**
- All environment variables use `NEXT_PUBLIC_` prefix for client-side access
- Mobile app reads from the same `.env.local` file via `app.config.js`
- Both Web and Mobile share the same configuration
- **Replace placeholders** (`YOUR_API_KEY_HERE`, `YOUR_LAZORKIT_API_KEY_HERE`) with your actual keys:
  - **RPC URLs**: Get from [Helius](https://helius.dev), [QuickNode](https://quicknode.com), or [Alchemy](https://alchemy.com)
  - **Lazorkit API Key**: Get from [Lazorkit Dashboard](https://lazorkit.com) (required for mainnet gasless transactions)

## Step 3: Build Core Package

Before running the apps, build the shared core package:

```bash
# From root directory
cd packages/lazor-core
pnpm build
cd ../..
```

## Step 4: Web Setup (Next.js)

### 4.1 Provider Configuration

The Web app uses `WalletProviderWrapper` which automatically configures the Lazorkit SDK:

**File: `apps/web/app/layout.tsx`**

```tsx
import { WalletProviderWrapper } from '../components/WalletProviderWrapper';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WalletProviderWrapper>
          {children}
        </WalletProviderWrapper>
      </body>
    </html>
  );
}
```

The `WalletProviderWrapper` component:
- Automatically loads environment variables
- Configures RPC URL based on selected network (mainnet/devnet)
- Sets up Paymaster URL for gasless transactions
- Handles Buffer polyfills for Solana Web3.js

### 4.2 Run Web App

```bash
# From root directory
pnpm dev

# Or from apps/web
cd apps/web
pnpm dev
```

**⚠️ IMPORTANT: HTTPS Required**

Web app will be available at: **https://localhost:3000** (note: **HTTPS**, not HTTP)

**Why HTTPS is Required:**
- **WebAuthn/Passkey** requires HTTPS for security (browser security policy)
- Passkey authentication will **NOT work** on HTTP, even on localhost
- The dev server is configured with `--experimental-https` flag

**First Time Setup:**
If you see SSL certificate warnings:
1. Click "Advanced" in your browser
2. Click "Proceed to localhost (unsafe)" or "Accept the Risk"
3. This is safe for local development - the certificate is self-signed

**Note:** The dev script automatically uses HTTPS. Make sure you access the app via `https://localhost:3000`, not `http://localhost:3000`.

## Step 5: Mobile Setup (Expo)

### 5.1 Provider Configuration

The Mobile app uses `LazorKitProvider` from `@lazorkit/wallet-mobile-adapter`:

**File: `apps/mobile/app/_layout.tsx`**

```tsx
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';
import { useNetworkStore } from '@lazor-starter/core';
import Constants from 'expo-constants';

export default function RootLayout() {
  const { network } = useNetworkStore();
  const extra = Constants.expoConfig?.extra || {};
  
  const rpcUrl = network === 'devnet' 
    ? extra.lazorkitRpcUrlDev 
    : extra.lazorkitRpcUrlMain;
    
  const paymasterUrl = network === 'devnet'
    ? extra.lazorkitPaymasterUrlDev
    : extra.lazorkitPaymasterUrlMain;
    
  const portalUrl = extra.lazorkitPortalUrl;

  return (
    <LazorKitProvider
      rpcUrl={rpcUrl}
      portalUrl={portalUrl}
      configPaymaster={{ paymasterUrl }}
    >
      {/* Your app screens */}
    </LazorKitProvider>
  );
}
```

### 5.2 Polyfills Setup

Mobile requires polyfills for Solana Web3.js. These are automatically loaded in `apps/mobile/src/polyfills.ts`:

- **Buffer** polyfill
- **WebSocket** polyfill
- **crypto** polyfill (using expo-crypto)
- **localStorage** polyfill (using AsyncStorage)
- **window** object polyfill

**File: `apps/mobile/index.js`**

```javascript
// CRITICAL: Import polyfills FIRST
import './src/polyfills';

// Then import the app
import 'expo-router/entry';
```

### 5.3 Storage Initialization

Mobile uses AsyncStorage for persistent storage. Initialize it in `_layout.tsx`:

```tsx
import { initMobileStorage } from '@lazor-starter/core';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize storage
initMobileStorage(AsyncStorage);
```

### 5.4 Run Mobile App

```bash
# From root directory
cd apps/mobile
pnpm dev

# Or use Expo CLI
npx expo start
```

Scan the QR code with **Expo Go** app on your phone, or press `i` for iOS Simulator / `a` for Android Emulator.

## Step 6: Verify Setup

### Web Verification

1. Open **https://localhost:3000** (⚠️ **HTTPS required**, not HTTP)
2. Accept the SSL certificate warning if prompted (safe for local development)
3. Check browser console for any errors
4. You should see the login screen

**⚠️ Important:** If you use `http://localhost:3000`, Passkey authentication will **NOT work** due to WebAuthn security requirements.

### Mobile Verification

1. Open Expo Go app
2. Scan QR code or connect to development server
3. App should load without errors
4. You should see the login screen

## Troubleshooting

### "Passkey not working" or "WebAuthn error"

**Most common cause: Using HTTP instead of HTTPS**

- ✅ **Solution**: Always use `https://localhost:3000` (not `http://`)
- Check browser address bar - should show `https://` with a lock icon (may show "Not secure" for self-signed cert, which is OK)
- Clear browser cache and try again
- If still not working, check browser console for WebAuthn errors

**Why this happens:**
- WebAuthn/Passkey requires HTTPS for security
- Browsers block WebAuthn on HTTP, even on localhost
- This is a browser security policy, not a bug

### "Missing environment variables"

- Ensure `.env.local` is in the **root directory**
- Check that all `NEXT_PUBLIC_*` variables are set
- Restart the development server after changing `.env.local`

### "Buffer is not defined" (Web)

- Ensure `WalletProviderWrapper` is wrapping your app
- Check that `buffer` package is installed: `pnpm add buffer`

### "Polyfills not loaded" (Mobile)

- Ensure `polyfills.ts` is imported **first** in `index.js`
- Check that all polyfill packages are installed:
  ```bash
  pnpm add react-native-get-random-values react-native-url-polyfill text-encoding-polyfill
  ```

### "AsyncStorage not working" (Mobile)

- Ensure `@react-native-async-storage/async-storage` is installed
- Check that `initMobileStorage()` is called in `_layout.tsx`

## Next Steps

- ✅ Environment configured
- ✅ Web app running
- ✅ Mobile app running

**Ready for [Tutorial 2: Passkey Authentication](./tutorial-2-passkey-authentication.md)?** 🚀

