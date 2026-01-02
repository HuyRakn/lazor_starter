# Passkey Wallet Basics

Complete guide to implementing Passkey authentication and Smart Wallet connection with LazorKit.

## Overview

Passkey authentication enables users to create and access Solana Smart Wallets using biometric authentication (Face ID / Touch ID) without seed phrases or browser extensions. This provides a seamless, secure onboarding experience.

### Key Features

- ✅ **Biometric Authentication** - Face ID / Touch ID support
- ✅ **No Seed Phrases** - Users never see or manage private keys
- ✅ **Smart Wallet** - Account abstraction with PDA (Program Derived Address)
- ✅ **Cross-Platform** - Works on Web (WebAuthn) and Mobile (Native Biometrics)
- ✅ **Automatic Wallet Creation** - Wallets are created on-demand during first login

## Prerequisites

- Lazorkit SDK configured with RPC URL and Paymaster URL
- HTTPS enabled (required for WebAuthn on web)
- `WalletProvider` wrapped around your app

## Quick Start

### 1. Setup Wallet Provider

```tsx
// app/layout.tsx or _app.tsx
import { WalletProviderWrapper } from '@/components/WalletProviderWrapper';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WalletProviderWrapper>
          {children}
        </WalletProviderWrapper>
      </body>
    </html>
  );
}
```

### 2. Connect Wallet

```tsx
'use client';

import { useAuth } from '@lazor-starter/core';

export default function LoginPage() {
  const { 
    registerNewWallet, 
    loginWithPasskey, 
    isLoggedIn, 
    pubkey,
    isInitialized 
  } = useAuth();

  const handleLogin = async () => {
    try {
      // For new users: create wallet with passkey
      await registerNewWallet();
      
      // For existing users: login with existing passkey
      // await loginWithPasskey();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isLoggedIn && pubkey) {
    return <div>Wallet: {pubkey}</div>;
  }

  return (
    <button onClick={handleLogin}>
      Login with Passkey
    </button>
  );
}
```

## API Reference

### `useAuth()` Hook

The `useAuth` hook provides authentication state and methods.

#### Returns

```typescript
{
  // State
  pubkey: string | null;              // Smart wallet PDA address
  isLoggedIn: boolean;                // Authentication status
  isInitialized: boolean;             // SDK initialization status
  passkeyData: PasskeyData | null;    // Passkey credential data
  
  // Methods
  registerNewWallet: () => Promise<void>;  // Create new wallet with passkey
  loginWithPasskey: () => Promise<void>;   // Login with existing passkey
  logout: () => void;                      // Disconnect wallet
  createSmartWallet: () => Promise<void>;   // Manually create smart wallet
}
```

#### Methods

**`registerNewWallet()`**

Creates a new Smart Wallet with Passkey authentication. This is the primary method for onboarding new users.

```typescript
await registerNewWallet();
```

**Behavior:**
- Prompts user for biometric authentication (Face ID / Touch ID)
- Creates a new Passkey credential
- Generates a Smart Wallet PDA address
- Stores credential data securely
- Returns wallet address in `pubkey`

**`loginWithPasskey()`**

Logs in with an existing Passkey credential.

```typescript
await loginWithPasskey();
```

**Behavior:**
- Prompts user for biometric authentication
- Validates existing Passkey credential
- Restores Smart Wallet connection
- Returns wallet address in `pubkey`

**`logout()`**

Disconnects the current wallet session.

```typescript
logout();
```

**Behavior:**
- Clears wallet state
- Removes session data
- User must re-authenticate to reconnect

### `useSmartWallet()` Hook

Provides Smart Wallet connection and transaction signing capabilities.

#### Returns

```typescript
{
  // State
  wallet: SmartWallet | null;         // Wallet object with smartWallet and publicKey
  isConnected: boolean;               // Connection status
  connecting: boolean;                // Connection in progress
  error: Error | null;                // Error state
  
  // Methods
  connect: () => Promise<void>;       // Connect wallet
  disconnect: () => Promise<void>;    // Disconnect wallet
  signAndSendTransaction: (params) => Promise<string>;  // Sign and send transaction
}
```

#### Example Usage

```tsx
import { useSmartWallet } from '@lazor-starter/core';
import { TransactionInstruction, SystemProgram, PublicKey } from '@solana/web3.js';

function MyComponent() {
  const { 
    wallet, 
    connect, 
    disconnect, 
    isConnected,
    signAndSendTransaction 
  } = useSmartWallet();

  const handleTransfer = async () => {
    if (!wallet) return;

    const recipient = new PublicKey('...');
    const amount = 0.1 * 1e9; // 0.1 SOL in lamports

    const instruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(wallet.smartWallet),
      toPubkey: recipient,
      lamports: amount,
    });

    const signature = await signAndSendTransaction({
      instructions: [instruction],
      transactionOptions: {
        computeUnitLimit: 200_000,
      },
    });

    console.log('Transaction:', signature);
  };

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Wallet: {wallet.smartWallet}</p>
          <button onClick={handleTransfer}>Transfer</button>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

## Step-by-Step Guide

### Step 1: Environment Configuration

Create `.env.local` with Lazorkit credentials:

```bash
# RPC URLs
NEXT_PUBLIC_LAZORKIT_RPC_URL=https://your-mainnet-rpc-url
NEXT_PUBLIC_LAZORKIT_RPC_URL_DEVNET=https://your-devnet-rpc-url

# Paymaster URLs
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://your-paymaster-url
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL_DEVNET=https://your-devnet-paymaster-url

# Portal URL (for IPFS/metadata)
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://your-portal-url
NEXT_PUBLIC_LAZORKIT_PORTAL_URL_DEVNET=https://your-devnet-portal-url

# API Key (optional, for mainnet)
NEXT_PUBLIC_LAZORKIT_API_KEY=your-api-key
```

### Step 2: Configure WalletProvider

```tsx
// components/WalletProviderWrapper.tsx
'use client';

import { WalletProvider, useNetworkStore } from '@lazor-starter/core';

export function WalletProviderWrapper({ children }) {
  const network = useNetworkStore((state) => state.network);
  const isDevnet = network === 'devnet';

  return (
    <WalletProvider
      rpcUrl={
        isDevnet
          ? process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL_DEVNET
          : process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL
      }
      paymasterUrl={
        isDevnet
          ? process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL_DEVNET
          : process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL
      }
      portalUrl={
        isDevnet
          ? process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL_DEVNET
          : process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL
      }
      apiKey={isDevnet ? '' : process.env.NEXT_PUBLIC_LAZORKIT_API_KEY}
      network={network}
    >
      {children}
    </WalletProvider>
  );
}
```

### Step 3: Implement Login Flow

```tsx
'use client';

import { useState } from 'react';
import { useAuth, useWalletBalance } from '@lazor-starter/core';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    registerNewWallet, 
    isLoggedIn, 
    pubkey 
  } = useAuth();
  
  // Fetch balances when wallet is connected
  const { solBalance, usdcBalance, solBalanceText, usdcBalanceText } = useWalletBalance(
    pubkey,
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC mint
  );

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await registerNewWallet();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn && pubkey) {
    return (
      <div>
        <h2>Wallet Connected</h2>
        <p>Address: {pubkey}</p>
        <p>SOL Balance: {solBalanceText || '0'}</p>
        <p>USDC Balance: {usdcBalanceText || '0'}</p>
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Connecting...' : 'Login with Passkey'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

## Advanced Usage

### Checking Wallet Balance

```tsx
import { useWalletBalance } from '@lazor-starter/core';

function BalanceDisplay({ walletAddress }: { walletAddress: string }) {
  const { 
    solBalance, 
    usdcBalance, 
    solBalanceText, 
    usdcBalanceText,
    loading,
    error,
    refreshBalances 
  } = useWalletBalance(
    walletAddress,
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC mint
  );

  if (loading) return <p>Loading balances...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <p>SOL: {solBalanceText}</p>
      <p>USDC: {usdcBalanceText}</p>
      <button onClick={refreshBalances}>Refresh</button>
    </div>
  );
}
```

### Network Switching

```tsx
import { useNetworkStore } from '@lazor-starter/core';

function NetworkSwitcher() {
  const { network, setNetwork } = useNetworkStore();

  return (
    <div>
      <label>
        <input
          type="radio"
          checked={network === 'mainnet'}
          onChange={() => setNetwork('mainnet')}
        />
        Mainnet
      </label>
      <label>
        <input
          type="radio"
          checked={network === 'devnet'}
          onChange={() => setNetwork('devnet')}
        />
        Devnet
      </label>
    </div>
  );
}
```

## Troubleshooting

### Issue: "Popup blocked" error

**Solution:** Ensure your app is served over HTTPS. WebAuthn requires HTTPS even for localhost.

```bash
# Use HTTPS for local development
npm run dev  # Automatically uses HTTPS via --experimental-https
```

### Issue: "Wallet not connected" error

**Solution:** Ensure `WalletProvider` is properly configured and user has authenticated.

```tsx
// Check initialization status
const { isInitialized, isLoggedIn } = useAuth();

if (!isInitialized) {
  return <div>Initializing...</div>;
}
```

### Issue: Biometric prompt not appearing

**Solution:** 
- On Web: Ensure HTTPS is enabled
- On Mobile: Check device biometric settings
- Clear browser cache and try again

### Issue: Balance not updating

**Solution:** Use `refreshBalances()` method or check RPC URL configuration.

```tsx
const { refreshBalances } = useWalletBalance(pubkey, usdcMint);

// Manually refresh
await refreshBalances();
```

## Best Practices

1. **Always check `isInitialized`** before using auth methods
2. **Handle errors gracefully** - Show user-friendly error messages
3. **Use loading states** - Provide feedback during async operations
4. **Cache wallet state** - Avoid unnecessary re-authentication
5. **Test on both networks** - Ensure devnet and mainnet work correctly

## Related Documentation

- [Gasless Transfer](./02-gasless-transfer.md) - Send tokens without gas fees
- [Jupiter Swap](./03-jupiter-swap.md) - DEX token swaps
- [NFT Minting](./04-nft-minting.md) - Mint standard NFTs
- [Compressed NFT](./05-compressed-nft.md) - Mint compressed NFTs

