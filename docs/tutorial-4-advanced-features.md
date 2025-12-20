# Tutorial 4: Advanced Features

Learn about advanced features including wallet balance checking, airdrops, and network switching.

## Overview

This tutorial covers:
- **Wallet Balance**: Check SOL and USDC balances
- **Airdrops**: Request test tokens on devnet
- **Network Switching**: Switch between mainnet and devnet
- **Address Formatting**: Format wallet addresses for display

## Step 1: Wallet Balance

### 1.1 Web Implementation

**File: `apps/web/app/balance/page.tsx`**

```tsx
'use client';

import { useWalletBalance, useAuth, TOKEN_MINTS } from '@lazor-starter/core';
import { useNetworkStore } from '@lazor-starter/core';

export default function BalancePage() {
  const { pubkey } = useAuth();
  const { network } = useNetworkStore();
  
  // Select USDC mint based on network
  const usdcMint = network === 'devnet' 
    ? TOKEN_MINTS.USDC_DEVNET 
    : TOKEN_MINTS.USDC_MAINNET;

  const { 
    solBalance, 
    usdcBalance, 
    solBalanceText, 
    usdcBalanceText,
    loading,
    error,
    refreshBalances 
  } = useWalletBalance(pubkey, usdcMint);

  if (!pubkey) {
    return <div>Please login first</div>;
  }

  return (
    <div>
      <h1>Wallet Balance</h1>
      
      {loading && <p>Loading...</p>}
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      <div>
        <h2>SOL Balance</h2>
        <p>{solBalanceText || '0'} SOL</p>
        <p>Raw: {solBalance?.toFixed(9)} SOL</p>
      </div>
      
      <div>
        <h2>USDC Balance</h2>
        <p>{usdcBalanceText || '0'} USDC</p>
        <p>Raw: {usdcBalance?.toFixed(6)} USDC</p>
      </div>
      
      <button onClick={refreshBalances}>Refresh</button>
    </div>
  );
}
```

### 1.2 Mobile Implementation

**File: `apps/mobile/app/balance.tsx`**

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useWalletBalance, useMobileAuth, TOKEN_MINTS } from '@lazor-starter/core';
import { useNetworkStore } from '@lazor-starter/core';

export default function BalanceScreen() {
  const { pubkey } = useMobileAuth();
  const { network } = useNetworkStore();
  
  const usdcMint = network === 'devnet' 
    ? TOKEN_MINTS.USDC_DEVNET 
    : TOKEN_MINTS.USDC_MAINNET;

  const { 
    solBalance, 
    usdcBalance, 
    solBalanceText, 
    usdcBalanceText,
    loading,
    error,
    refreshBalances 
  } = useWalletBalance(pubkey, usdcMint);

  if (!pubkey) {
    return (
      <View style={styles.container}>
        <Text>Please login first</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet Balance</Text>
      
      {loading && <Text>Loading...</Text>}
      
      {error && <Text style={styles.error}>Error: {error}</Text>}
      
      <View style={styles.balanceCard}>
        <Text style={styles.label}>SOL Balance</Text>
        <Text style={styles.amount}>{solBalanceText || '0'} SOL</Text>
      </View>
      
      <View style={styles.balanceCard}>
        <Text style={styles.label}>USDC Balance</Text>
        <Text style={styles.amount}>{usdcBalanceText || '0'} USDC</Text>
      </View>
      
      <TouchableOpacity onPress={refreshBalances} style={styles.button}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  balanceCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  button: {
    backgroundColor: '#7857ff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    marginBottom: 12,
  },
});
```

### 1.3 Hook API

```typescript
const {
  solBalance,        // SOL balance as number (undefined if loading)
  usdcBalance,       // USDC balance as number (undefined if loading)
  solBalanceText,    // Formatted SOL balance string (e.g., "1.5")
  usdcBalanceText,   // Formatted USDC balance string (e.g., "100.5")
  loading,           // True while fetching balances
  error,             // Error message if fetch fails
  refreshBalances    // Function to manually refresh balances
} = useWalletBalance(
  walletAddress,     // Wallet public key address
  usdcMintAddress,   // USDC mint address (optional)
  rpcUrl             // RPC URL (optional, uses env if not provided)
);
```

## Step 2: Airdrops (Devnet Only)

### 2.1 Web Implementation

**File: `apps/web/app/airdrop/page.tsx`**

```tsx
'use client';

import { useAirdrop, useAuth, useNetworkStore } from '@lazor-starter/core';
import { useState } from 'react';

export default function AirdropPage() {
  const { pubkey } = useAuth();
  const { network } = useNetworkStore();
  const { requestSOLAirdrop, requestUSDCAirdrop, loading, error } = useAirdrop();
  
  const [amount, setAmount] = useState('1');
  const [signature, setSignature] = useState<string | null>(null);

  const handleSOLAirdrop = async () => {
    if (!pubkey) {
      alert('Please login first');
      return;
    }

    try {
      const txSignature = await requestSOLAirdrop(pubkey, parseFloat(amount));
      setSignature(txSignature);
      alert(`Airdrop requested! ${amount} SOL will arrive shortly.`);
    } catch (e: any) {
      alert(`Airdrop failed: ${e.message}`);
    }
  };

  const handleUSDCAirdrop = async () => {
    if (!pubkey) {
      alert('Please login first');
      return;
    }

    try {
      await requestUSDCAirdrop(pubkey, 1);
      alert('Circle Faucet opened in new tab. Please complete the request there.');
    } catch (e: any) {
      alert(`Airdrop failed: ${e.message}`);
    }
  };

  if (network !== 'devnet') {
    return <div>Airdrops are only available on devnet</div>;
  }

  return (
    <div>
      <h1>Request Airdrop (Devnet)</h1>
      
      <div>
        <h2>SOL Airdrop</h2>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (SOL)"
        />
        <button onClick={handleSOLAirdrop} disabled={loading}>
          {loading ? 'Requesting...' : 'Request SOL Airdrop'}
        </button>
        {signature && <p>Transaction: {signature.slice(0, 16)}...</p>}
      </div>
      
      <div>
        <h2>USDC Airdrop</h2>
        <button onClick={handleUSDCAirdrop} disabled={loading}>
          {loading ? 'Opening...' : 'Open Circle Faucet'}
        </button>
        <p>Opens Circle Faucet website (1 USDC per request, 2 hour cooldown)</p>
      </div>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### 2.2 Mobile Implementation

**File: `apps/mobile/app/airdrop.tsx`**

```tsx
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAirdrop, useMobileAuth, useNetworkStore } from '@lazor-starter/core';
import { useState } from 'react';

export default function AirdropScreen() {
  const { pubkey } = useMobileAuth();
  const { network } = useNetworkStore();
  const { requestSOLAirdrop, requestUSDCAirdrop, loading, error } = useAirdrop();
  
  const [amount, setAmount] = useState('1');

  const handleSOLAirdrop = async () => {
    if (!pubkey) {
      alert('Please login first');
      return;
    }

    try {
      await requestSOLAirdrop(pubkey, parseFloat(amount));
      alert(`Airdrop requested! ${amount} SOL will arrive shortly.`);
    } catch (e: any) {
      alert(`Airdrop failed: ${e.message}`);
    }
  };

  const handleUSDCAirdrop = async () => {
    if (!pubkey) {
      alert('Please login first');
      return;
    }

    try {
      await requestUSDCAirdrop(pubkey, 1);
      alert('Circle Faucet opened. Please complete the request there.');
    } catch (e: any) {
      alert(`Airdrop failed: ${e.message}`);
    }
  };

  if (network !== 'devnet') {
    return (
      <View style={styles.container}>
        <Text>Airdrops are only available on devnet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Request Airdrop (Devnet)</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SOL Airdrop</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="Amount (SOL)"
          keyboardType="decimal-pad"
        />
        <TouchableOpacity 
          onPress={handleSOLAirdrop} 
          disabled={loading}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Requesting...' : 'Request SOL Airdrop'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>USDC Airdrop</Text>
        <TouchableOpacity 
          onPress={handleUSDCAirdrop} 
          disabled={loading}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Opening...' : 'Open Circle Faucet'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          Opens Circle Faucet website (1 USDC per request, 2 hour cooldown)
        </Text>
      </View>
      
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#7857ff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  error: {
    color: 'red',
    marginTop: 12,
  },
});
```

## Step 3: Address Formatting

### 3.1 Format Functions

```tsx
import { formatAddress, truncateAddress } from '@lazor-starter/core';

function AddressDisplay({ address }: { address: string }) {
  // Format: "5xA1...9KpQ" (4 chars visible at start/end)
  const shortAddress = formatAddress(address, 4);
  
  // Same as formatAddress
  const truncated = truncateAddress(address, 6); // "5xA1B2...9KpQ"

  return (
    <div>
      <p>Full: {address}</p>
      <p>Short: {shortAddress}</p>
      <p>Truncated: {truncated}</p>
    </div>
  );
}
```

### 3.2 Explorer URLs

```tsx
import { getExplorerUrl } from '@lazor-starter/core';
import { useNetworkStore } from '@lazor-starter/core';

function ExplorerLink({ address }: { address: string }) {
  const { network } = useNetworkStore();
  const explorerUrl = getExplorerUrl(address, network);

  return (
    <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
      View on Solana Explorer →
    </a>
  );
}
```

## Step 4: Network Switching

### 4.1 Web Implementation

```tsx
import { useNetworkStore } from '@lazor-starter/core';

function NetworkSwitcher() {
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

### 4.2 Mobile Implementation

```tsx
import { useNetworkStore } from '@lazor-starter/core';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

function NetworkSwitcher() {
  const { network, setNetwork } = useNetworkStore();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setNetwork('mainnet')}
        style={[
          styles.button,
          network === 'mainnet' && styles.buttonActive
        ]}
      >
        <Text style={[
          styles.buttonText,
          network === 'mainnet' && styles.buttonTextActive
        ]}>
          Mainnet
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => setNetwork('devnet')}
        style={[
          styles.button,
          network === 'devnet' && styles.buttonActive
        ]}
      >
        <Text style={[
          styles.buttonText,
          network === 'devnet' && styles.buttonTextActive
        ]}>
          Devnet
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonActive: {
    backgroundColor: '#7857ff',
    borderColor: '#7857ff',
  },
  buttonText: {
    color: '#999',
  },
  buttonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

**Important Notes:**
- Network switching affects RPC URL, Paymaster URL, and wallet addresses
- Each network has separate wallets (mainnet wallet ≠ devnet wallet)
- Network state persists in Zustand store

## Step 5: Complete Example

Here's a complete dashboard example combining all features:

**File: `apps/web/app/dashboard/page.tsx`**

```tsx
'use client';

import { 
  useAuth, 
  useGaslessTx, 
  useWalletBalance, 
  useAirdrop,
  useNetworkStore,
  formatAddress,
  TOKEN_MINTS 
} from '@lazor-starter/core';
import { useState } from 'react';

export default function DashboardPage() {
  const { pubkey, logout, isLoggedIn } = useAuth();
  const { network, setNetwork } = useNetworkStore();
  const { transferSOL } = useGaslessTx();
  const { solBalance, usdcBalance, solBalanceText, usdcBalanceText } = useWalletBalance(
    pubkey,
    network === 'devnet' ? TOKEN_MINTS.USDC_DEVNET : TOKEN_MINTS.USDC_MAINNET
  );
  const { requestSOLAirdrop } = useAirdrop();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  if (!isLoggedIn || !pubkey) {
    return <div>Please login first</div>;
  }

  const handleTransfer = async () => {
    try {
      const signature = await transferSOL(recipient, parseFloat(amount));
      alert(`Transaction sent! ${signature.slice(0, 16)}...`);
    } catch (error: any) {
      alert(`Transfer failed: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Network Switcher */}
      <div>
        <button onClick={() => setNetwork('mainnet')}>Mainnet</button>
        <button onClick={() => setNetwork('devnet')}>Devnet</button>
      </div>
      
      {/* Wallet Info */}
      <div>
        <h2>Wallet</h2>
        <p>Address: {formatAddress(pubkey)}</p>
        <p>SOL: {solBalanceText || '0'}</p>
        <p>USDC: {usdcBalanceText || '0'}</p>
      </div>
      
      {/* Transfer */}
      <div>
        <h2>Transfer SOL</h2>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Recipient"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
        />
        <button onClick={handleTransfer}>Send (Gasless)</button>
      </div>
      
      {/* Airdrop (Devnet only) */}
      {network === 'devnet' && (
        <div>
          <h2>Airdrop</h2>
          <button onClick={() => requestSOLAirdrop(pubkey, 1)}>
            Request 1 SOL
          </button>
        </div>
      )}
      
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Summary

✅ **Wallet Balance**: Check SOL and USDC balances with `useWalletBalance`  
✅ **Airdrops**: Request test tokens on devnet with `useAirdrop`  
✅ **Network Switching**: Switch between mainnet/devnet with `useNetworkStore`  
✅ **Address Formatting**: Format addresses for display with `formatAddress`  
✅ **Explorer Links**: Generate explorer URLs with `getExplorerUrl`  

**Congratulations! You've mastered all the features of Lazor Starter!** 🎉

