# Tutorial 3: Gasless Transactions

Learn how to send tokens **without paying gas fees** using Lazorkit's Paymaster. Works on both **Web** and **Mobile** platforms.

## Overview

Gasless transactions allow users to send SOL and SPL tokens without needing SOL for gas fees. The Paymaster sponsors all transaction costs.

**Benefits:**
- 🎉 Better UX - Users don't need SOL to transact
- 📱 Mobile Friendly - No need to airdrop SOL to new users
- 💰 Cost Effective - Businesses can sponsor transactions
- 🚀 Faster Adoption - Lower barrier to entry

## How It Works

1. **User Signs Intent**: You create a transaction instruction
2. **SDK Routes to Paymaster**: Lazorkit SDK automatically sends the transaction to your configured Paymaster URL
3. **Paymaster Pays Gas**: The Paymaster signs and submits the transaction, paying all gas fees
4. **User Receives Confirmation**: Transaction completes with zero cost to the user

## Step 1: Web Implementation

### 1.1 Use the Gasless Hook

**File: `apps/web/app/transfer/page.tsx`**

```tsx
'use client';

import { useGaslessTx } from '@lazor-starter/core';
import { useState } from 'react';

export default function TransferPage() {
  const { transferSOL, transferSPLToken } = useGaslessTx();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendSOL = async () => {
    if (!recipient || !amount) {
      setError('Please enter recipient and amount');
      return;
    }

    setLoading(true);
    setError(null);
    setSignature(null);

    try {
      // That's it! Just one line:
      const txSignature = await transferSOL(recipient, parseFloat(amount));
      setSignature(txSignature);
      console.log('Transaction sent:', txSignature);
    } catch (e: any) {
      setError(e?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Send SOL (Gasless)</h1>
      
      <input
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Recipient address"
      />
      
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (SOL)"
      />
      
      <button onClick={handleSendSOL} disabled={loading}>
        {loading ? 'Sending...' : 'Send SOL (Gasless)'}
      </button>

      {signature && (
        <div>
          <p>✅ Success! Transaction: {signature.slice(0, 16)}...</p>
          <a 
            href={`https://solscan.io/tx/${signature}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Solscan →
          </a>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### 1.2 Send SPL Tokens (USDC, USDT, etc.)

```tsx
import { useGaslessTx } from '@lazor-starter/core';
import { TOKEN_MINTS } from '@lazor-starter/core';

function SendUSDC() {
  const { transferSPLToken } = useGaslessTx();

  const handleSendUSDC = async () => {
    try {
      const signature = await transferSPLToken(
        recipientAddress,    // Recipient wallet address
        10.5,                 // Amount in USDC
        TOKEN_MINTS.USDC_DEVNET, // USDC mint address (devnet)
        6                     // Decimals (6 for USDC)
      );
      console.log('USDC sent:', signature);
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  return <button onClick={handleSendUSDC}>Send 10.5 USDC</button>;
}
```

## Step 2: Mobile Implementation

### 2.1 Use the Mobile Gasless Hook

**File: `apps/mobile/app/transfer.tsx`**

```tsx
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useMobileGaslessTx } from '../src/hooks/useMobileGaslessTx';
import { useState } from 'react';

export default function TransferScreen() {
  const { transferSOL, transferSPLToken } = useMobileGaslessTx();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendSOL = async () => {
    if (!recipient || !amount) {
      setError('Please enter recipient and amount');
      return;
    }

    setLoading(true);
    setError(null);
    setSignature(null);

    try {
      // Same API as Web!
      const txSignature = await transferSOL(recipient, parseFloat(amount));
      setSignature(txSignature);
      console.log('Transaction sent:', txSignature);
    } catch (e: any) {
      setError(e?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={recipient}
        onChangeText={setRecipient}
        placeholder="Recipient address"
      />
      
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="Amount (SOL)"
        keyboardType="decimal-pad"
      />
      
      <TouchableOpacity 
        onPress={handleSendSOL} 
        disabled={loading}
        style={[styles.button, loading && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send SOL (Gasless)'}
        </Text>
      </TouchableOpacity>

      {signature && (
        <View>
          <Text>✅ Success! Transaction: {signature.slice(0, 16)}...</Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  error: {
    color: 'red',
    marginTop: 12,
  },
});
```

## Step 3: Understanding the Gasless Hook

### 3.1 Hook API

Both `useGaslessTx` (Web) and `useMobileGaslessTx` (Mobile) provide the same interface:

```typescript
{
  // Send custom transaction instructions
  sendTransaction(
    instructions: TransactionInstruction[],
    options?: GaslessTxOptions
  ): Promise<string>;

  // Transfer SOL tokens
  transferSOL(
    recipient: string,
    amount: number,
    options?: GaslessTxOptions
  ): Promise<string>;

  // Transfer SPL tokens (USDC, USDT, etc.)
  transferSPLToken(
    recipient: string,
    amount: number,
    tokenMint: string,
    decimals?: number,
    options?: GaslessTxOptions
  ): Promise<string>;
}
```

### 3.2 Transaction Options

```typescript
interface GaslessTxOptions {
  feeToken?: string;              // Token address for gas fees (e.g. USDC)
  computeUnitLimit?: number;      // Max compute units for the transaction
  clusterSimulation?: 'devnet' | 'mainnet'; // Network for simulation
}
```

## Step 4: Custom Transactions

You can send custom transaction instructions:

```tsx
import { useGaslessTx } from '@lazor-starter/core';
import { SystemProgram, TransactionInstruction, PublicKey } from '@solana/web3.js';

function CustomTransaction() {
  const { sendTransaction } = useGaslessTx();

  const handleCustomTx = async () => {
    const instruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(walletAddress),
      toPubkey: new PublicKey(recipientAddress),
      lamports: amount * 1e9, // Convert SOL to lamports
    });

    const signature = await sendTransaction([instruction]);
    console.log('Custom transaction sent:', signature);
  };

  return <button onClick={handleCustomTx}>Send Custom Transaction</button>;
}
```

## Step 5: Configuration

### 5.1 Paymaster URL

The Paymaster URL is automatically configured from environment variables:

**Mainnet:**
```env
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://kora.lazorkit.com
NEXT_PUBLIC_LAZORKIT_API_KEY=kora_live_api_...
```

**Devnet:**
```env
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL_DEVNET=https://kora.devnet.lazorkit.com
```

### 5.2 Provider Configuration

**Web** (`WalletProviderWrapper`):
- Automatically reads from `process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL`
- Switches between mainnet/devnet based on `useNetworkStore`

**Mobile** (`LazorKitProvider`):
- Reads from `Constants.expoConfig.extra.lazorkitPaymasterUrlMain/Dev`
- Configured in `app.config.js` from `.env.local`

## Step 6: Error Handling

### Common Errors

**"signAndSendTransaction not available"**
- Wallet not connected - ensure user is logged in
- Provider not configured correctly

**"No wallet address"**
- User not logged in - call `registerNewWallet()` first

**"Transaction failed"**
- Check network connection
- Verify recipient address is valid
- Ensure sufficient balance (for token transfers)

### Error Handling Example

```tsx
const handleTransfer = async () => {
  try {
    const signature = await transferSOL(recipient, amount);
    // Success!
  } catch (error: any) {
    if (error.message.includes('not available')) {
      // Wallet not connected
      alert('Please login first');
    } else if (error.message.includes('Invalid')) {
      // Invalid recipient address
      alert('Invalid recipient address');
    } else {
      // Other error
      alert(`Transfer failed: ${error.message}`);
    }
  }
};
```

## Step 7: Testing

### Web Testing

1. Login with Passkey
2. Navigate to transfer page
3. Enter recipient address and amount
4. Click "Send SOL (Gasless)"
5. Verify transaction appears on Solscan
6. Check that no SOL was deducted for gas fees

### Mobile Testing

1. Login with Passkey
2. Navigate to transfer screen
3. Enter recipient address and amount
4. Tap "Send SOL (Gasless)"
5. Verify transaction appears on Solscan
6. Check that no SOL was deducted for gas fees

## Summary

✅ **Web**: Uses `useGaslessTx` hook  
✅ **Mobile**: Uses `useMobileGaslessTx` hook  
✅ **Same API**: Both platforms use identical interface  
✅ **Zero Gas Fees**: All transactions sponsored by Paymaster  
✅ **SOL & SPL Tokens**: Support for both native SOL and SPL tokens  

**Ready for [Tutorial 4: Advanced Features](./tutorial-4-advanced-features.md)?** 🚀

