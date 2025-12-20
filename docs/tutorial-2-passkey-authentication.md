# Tutorial 2: Passkey Authentication

Learn how to implement Passkey authentication (Face ID / Touch ID) for both **Web** and **Mobile** platforms using Lazorkit SDK.

## Overview

Passkey authentication provides a secure, passwordless login experience:
- **Web**: Uses WebAuthn API (Face ID / Touch ID / Windows Hello)
- **Mobile**: Uses native biometric authentication (Face ID / Touch ID)

Both platforms share the same authentication logic from `@lazor-starter/core`.

## ⚠️ Critical: HTTPS Requirement for Web

**WebAuthn/Passkey on Web REQUIRES HTTPS, even for localhost.**

- ✅ **Use**: `https://localhost:3000`
- ❌ **Don't use**: `http://localhost:3000`

**Why?**
- WebAuthn specification requires secure context (HTTPS)
- Browsers block WebAuthn on HTTP for security
- Passkey will **fail silently** or show errors on HTTP

**Note:** Mobile apps don't have this restriction - they use native APIs.

## Step 1: Web Implementation

### 1.1 Use the Auth Hook

**File: `apps/web/app/page.tsx`** (or any component)

```tsx
'use client';

import { useAuth } from '@lazor-starter/core';
import { useState } from 'react';

export default function LoginPage() {
  const { 
    isLoggedIn, 
    pubkey, 
    registerNewWallet, 
    logout,
    isInitialized 
  } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { walletAddress } = await registerNewWallet();
      console.log('Wallet created:', walletAddress);
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  if (isLoggedIn) {
    return (
      <div>
        <p>Wallet: {pubkey}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Connecting...' : 'Login with Passkey'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### 1.2 How It Works (Web)

1. **User clicks "Login with Passkey"**
2. **Browser prompts** for Face ID / Touch ID / Windows Hello
3. **WebAuthn API** creates a credential
4. **Backend API** creates a Solana smart wallet linked to the passkey
5. **Session persists** in localStorage

## Step 2: Mobile Implementation

### 2.1 Use the Mobile Auth Hook

**File: `apps/mobile/app/index.tsx`** (or any screen)

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useMobileAuth } from '../src/hooks/useMobileAuth';
import { useState } from 'react';

export default function LoginScreen() {
  const { 
    isLoggedIn, 
    pubkey, 
    registerNewWallet, 
    logout,
    isInitialized 
  } = useMobileAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { walletAddress } = await registerNewWallet();
      console.log('Wallet created:', walletAddress);
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text>Wallet: {pubkey}</Text>
        <TouchableOpacity onPress={logout}>
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={handleLogin} 
        disabled={loading}
        style={[styles.button, loading && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Connecting...' : 'Login with Passkey'}
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: '#7857ff',
    padding: 16,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    marginTop: 12,
  },
});
```

### 2.2 How It Works (Mobile)

1. **User taps "Login with Passkey"**
2. **Native biometric prompt** appears (Face ID / Touch ID)
3. **Mobile adapter** creates a credential
4. **Backend API** creates a Solana smart wallet
5. **Session persists** in AsyncStorage

## Step 3: Understanding the Auth Hook

### 3.1 Hook API

Both `useAuth` (Web) and `useMobileAuth` (Mobile) provide the same interface:

```typescript
{
  // State
  isLoggedIn: boolean;        // True if user has both passkey and wallet
  hasPasskey: boolean;        // True if passkey exists
  hasWallet: boolean;         // True if smart wallet is created
  pubkey?: string;            // Wallet public key address
  passkeyData?: PasskeyData;  // Passkey credential data
  isInitialized: boolean;     // True when initial state is loaded

  // Methods
  loginWithPasskey(): Promise<PasskeyData>;              // Create/authenticate with passkey
  createSmartWallet(passkeyData): Promise<string>;       // Create smart wallet from passkey
  registerNewWallet(): Promise<{passkeyData, walletAddress}>; // Register new wallet (passkey + smart wallet)
  logout(): Promise<void>;                               // Clear session and logout
}
```

### 3.2 Registration Flow

The `registerNewWallet()` function does two things:

1. **Creates Passkey**: Calls `loginWithPasskey()` to create/authenticate with biometrics
2. **Creates Smart Wallet**: Calls `createSmartWallet()` to create onchain wallet

```typescript
const { walletAddress } = await registerNewWallet();
// Now you have:
// - Passkey stored locally
// - Smart wallet created onchain
// - Session persisted
```

### 3.3 Session Persistence

Both platforms automatically persist session:

- **Web**: Uses `localStorage`
- **Mobile**: Uses `AsyncStorage`

When the app reloads, the hook automatically:
1. Loads session from storage
2. Reconnects wallet if passkey exists
3. Restores `isLoggedIn` state

## Step 4: Network Selection

Users can switch between **mainnet** and **devnet** before logging in:

```tsx
import { useNetworkStore } from '@lazor-starter/core';

function NetworkSelector() {
  const { network, setNetwork } = useNetworkStore();

  return (
    <div>
      <button 
        onClick={() => setNetwork('mainnet')}
        className={network === 'mainnet' ? 'active' : ''}
      >
        Mainnet
      </button>
      <button 
        onClick={() => setNetwork('devnet')}
        className={network === 'devnet' ? 'active' : ''}
      >
        Devnet
      </button>
    </div>
  );
}
```

**Important**: Network selection affects:
- RPC URL (mainnet vs devnet)
- Paymaster URL
- Wallet addresses (separate wallets for each network)

## Step 5: Error Handling

### Common Errors

**"Passkey login not available"**
- Ensure `WalletProvider` (Web) or `LazorKitProvider` (Mobile) is wrapping your app
- Check environment variables are set correctly

**"Failed to create smart wallet"**
- Ensure backend API is running (if using custom backend)
- Check network connection
- Verify RPC URL is correct

**"User cancelled"**
- User cancelled biometric prompt (normal behavior)
- Handle gracefully in your UI

### Error Handling Example

```tsx
const handleLogin = async () => {
  try {
    const { walletAddress } = await registerNewWallet();
    // Success!
  } catch (error: any) {
    if (error.message.includes('User cancelled')) {
      // User cancelled - don't show error
      return;
    }
    
    if (error.message.includes('not available')) {
      // Provider not set up correctly
      console.error('Setup error:', error);
    }
    
    // Show error to user
    setError(error.message);
  }
};
```

## Step 6: Testing

### Web Testing

1. Open **https://localhost:3000** (⚠️ **HTTPS required**, not HTTP)
   - Accept SSL certificate warning if prompted (safe for local development)
   - **Passkey will NOT work on HTTP** - WebAuthn requires HTTPS
2. Click "Login with Passkey"
3. Use Face ID / Touch ID when prompted
4. Verify wallet address is displayed
5. Refresh page - should stay logged in

**⚠️ Critical:** Always use `https://localhost:3000` for Passkey authentication. HTTP will fail silently or show errors.

### Mobile Testing

1. Open app in Expo Go
2. Tap "Login with Passkey"
3. Use Face ID / Touch ID when prompted
4. Verify wallet address is displayed
5. Close and reopen app - should stay logged in

## Summary

✅ **Web**: Uses `useAuth` hook with WebAuthn API  
✅ **Mobile**: Uses `useMobileAuth` hook with native biometrics  
✅ **Shared Logic**: Both use the same core authentication logic  
✅ **Session Persistence**: Automatic across app reloads  
✅ **Network Support**: Switch between mainnet/devnet  

**Ready for [Tutorial 3: Gasless Transactions](./tutorial-3-gasless-transactions.md)?** 🚀

