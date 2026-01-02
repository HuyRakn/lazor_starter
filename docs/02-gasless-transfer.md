# Gasless Transfer

Complete guide to implementing gasless token transfers (SOL and SPL tokens) using LazorKit Paymaster.

## Overview

Gasless transfers allow users to send SOL or SPL tokens (like USDC) without paying transaction fees. The LazorKit Paymaster automatically covers all gas costs, providing a seamless user experience.

### Key Features

- ✅ **Zero Gas Fees** - Users never pay for transactions
- ✅ **SOL & SPL Tokens** - Support for native SOL and any SPL token
- ✅ **Automatic Fee Sponsoring** - Paymaster handles all transaction costs
- ✅ **Smart Wallet Integration** - Works seamlessly with Passkey wallets
- ✅ **Network Support** - Works on both Mainnet and Devnet

## Prerequisites

- Wallet connected via `useAuth()` or `useSmartWallet()`
- Paymaster URL configured in environment variables
- Sufficient token balance for transfer (not gas fees)

## Quick Start

### Basic SOL Transfer

```tsx
'use client';

import { useGaslessTx, useAuth } from '@lazor-starter/core';

export default function TransferPage() {
  const { pubkey } = useAuth();
  const { transferSOL } = useGaslessTx();
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    try {
      setLoading(true);
      
      // Transfer 0.1 SOL (no gas fees!)
      const signature = await transferSOL(
        'RecipientWalletAddress...', // Recipient address
        0.1 // Amount in SOL
      );
      
      console.log('Transaction:', signature);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleTransfer} disabled={loading}>
      {loading ? 'Sending...' : 'Transfer 0.1 SOL'}
    </button>
  );
}
```

### USDC Transfer

```tsx
import { useGaslessTx } from '@lazor-starter/core';
import { TOKEN_MINTS } from '@lazor-starter/core';

function USDCTransfer() {
  const { transferSPLToken } = useGaslessTx();
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    try {
      setLoading(true);
      
      // Transfer 10 USDC (no gas fees!)
      const signature = await transferSPLToken(
        'RecipientWalletAddress...', // Recipient
        10, // Amount in USDC
        TOKEN_MINTS.USDC_MAINNET, // USDC mint address
        6 // USDC decimals
      );
      
      console.log('Transaction:', signature);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleTransfer} disabled={loading}>
      Transfer 10 USDC
    </button>
  );
}
```

## API Reference

### `useGaslessTx()` Hook

Provides methods for executing gasless transactions.

#### Returns

```typescript
{
  // Methods
  transferSOL: (recipient: string, amount: number, options?: GaslessTxOptions) => Promise<string>;
  transferSPLToken: (
    recipient: string, 
    amount: number, 
    tokenMint: string, 
    decimals?: number, 
    options?: GaslessTxOptions
  ) => Promise<string>;
  sendTransaction: (
    instructions: TransactionInstruction[], 
    options?: GaslessTxOptions
  ) => Promise<string>;
}
```

#### Methods

**`transferSOL(recipient, amount, options?)`**

Transfers native SOL tokens without gas fees.

```typescript
const signature = await transferSOL(
  'RecipientWalletAddress...', // Solana address
  0.1, // Amount in SOL
  {
    computeUnitLimit: 200_000, // Optional: compute unit limit
  }
);
```

**Parameters:**
- `recipient` (string): Solana wallet address to receive SOL
- `amount` (number): Amount in SOL (e.g., 0.1 for 0.1 SOL)
- `options` (optional): Transaction options

**Returns:** Transaction signature (base58 string)

**`transferSPLToken(recipient, amount, tokenMint, decimals?, options?)`**

Transfers SPL tokens (USDC, etc.) without gas fees.

```typescript
const signature = await transferSPLToken(
  'RecipientWalletAddress...', // Recipient address
  10, // Amount in token units
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mint
  6, // USDC decimals
  {
    computeUnitLimit: 200_000,
  }
);
```

**Parameters:**
- `recipient` (string): Solana wallet address
- `amount` (number): Amount in token units (e.g., 10 for 10 USDC)
- `tokenMint` (string): Token mint address
- `decimals` (number, optional): Token decimals (default: 6)
- `options` (optional): Transaction options

**Returns:** Transaction signature (base58 string)

**`sendTransaction(instructions, options?)`**

Sends custom transaction instructions with gasless execution.

```typescript
import { TransactionInstruction, SystemProgram, PublicKey } from '@solana/web3.js';

const instructions: TransactionInstruction[] = [
  SystemProgram.transfer({
    fromPubkey: new PublicKey(walletAddress),
    toPubkey: new PublicKey(recipient),
    lamports: 0.1 * 1e9,
  }),
];

const signature = await sendTransaction(instructions, {
  computeUnitLimit: 200_000,
});
```

## Step-by-Step Guide

### Step 1: Validate Recipient Address

```tsx
import { validateRecipientAddress } from '@lazor-starter/core';

function TransferForm() {
  const [recipient, setRecipient] = useState('');
  const [error, setError] = useState('');

  const handleRecipientChange = (value: string) => {
    setRecipient(value);
    
    if (value && !validateRecipientAddress(value)) {
      setError('Invalid Solana address');
    } else {
      setError('');
    }
  };

  return (
    <div>
      <input
        value={recipient}
        onChange={(e) => handleRecipientChange(e.target.value)}
        placeholder="Enter recipient address"
      />
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Step 2: Validate Amount

```tsx
import { validateTransferAmount } from '@lazor-starter/core';

function AmountInput({ balance, onAmountChange }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleAmountChange = (value: string) => {
    setAmount(value);
    
    const validation = validateTransferAmount(value, balance);
    if (!validation.valid) {
      setError(validation.error || 'Invalid amount');
    } else {
      setError('');
    }
    
    onAmountChange(value);
  };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => handleAmountChange(e.target.value)}
        placeholder="Enter amount"
      />
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Step 3: Complete Transfer Form

```tsx
'use client';

import { useState } from 'react';
import { 
  useGaslessTx, 
  useAuth, 
  useWalletBalance,
  validateRecipientAddress,
  validateTransferAmount,
  formatTransactionError,
  TOKEN_MINTS,
  useNetworkStore
} from '@lazor-starter/core';

export default function TransferForm() {
  const { pubkey } = useAuth();
  const { network } = useNetworkStore();
  const { transferSOL, transferSPLToken } = useGaslessTx();
  
  const usdcMint = network === 'devnet' 
    ? TOKEN_MINTS.USDC_DEVNET 
    : TOKEN_MINTS.USDC_MAINNET;
  
  const { solBalance, usdcBalance } = useWalletBalance(pubkey, usdcMint);
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<'SOL' | 'USDC'>('SOL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const handleTransfer = async () => {
    // Validation
    if (!validateRecipientAddress(recipient)) {
      setError('Invalid recipient address');
      return;
    }

    const amountNum = parseFloat(amount);
    const balance = token === 'SOL' ? solBalance : usdcBalance;
    
    if (!validateTransferAmount(amount, balance || 0).valid) {
      setError('Invalid amount');
      return;
    }

    setLoading(true);
    setError(null);
    setSignature(null);

    try {
      let txSignature: string;
      
      if (token === 'SOL') {
        txSignature = await transferSOL(recipient, amountNum);
      } else {
        txSignature = await transferSPLToken(
          recipient,
          amountNum,
          usdcMint,
          6 // USDC decimals
        );
      }

      setSignature(txSignature);
      setRecipient('');
      setAmount('');
    } catch (err: any) {
      setError(formatTransactionError(err, 'Transfer'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <label>Token</label>
        <select value={token} onChange={(e) => setToken(e.target.value as 'SOL' | 'USDC')}>
          <option value="SOL">SOL</option>
          <option value="USDC">USDC</option>
        </select>
      </div>

      <div>
        <label>Recipient</label>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter recipient address"
        />
      </div>

      <div>
        <label>Amount ({token})</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
        <p>Balance: {token === 'SOL' ? solBalance : usdcBalance}</p>
      </div>

      {error && <p className="error">{error}</p>}
      
      {signature && (
        <div>
          <p>Transaction successful!</p>
          <a 
            href={`https://explorer.solana.com/tx/${signature}`}
            target="_blank"
          >
            View on Explorer
          </a>
        </div>
      )}

      <button 
        onClick={handleTransfer} 
        disabled={loading || !recipient || !amount}
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
```

## Advanced Usage

### Custom Transaction Instructions

```tsx
import { useGaslessTx } from '@lazor-starter/core';
import { TransactionInstruction, SystemProgram, PublicKey } from '@solana/web3.js';

function CustomTransfer() {
  const { sendTransaction } = useGaslessTx();
  const { wallet } = useSmartWallet();

  const handleCustomTransfer = async () => {
    if (!wallet) return;

    const instructions: TransactionInstruction[] = [
      SystemProgram.transfer({
        fromPubkey: new PublicKey(wallet.smartWallet),
        toPubkey: new PublicKey('RecipientAddress...'),
        lamports: 0.1 * 1e9,
      }),
      // Add more instructions as needed
    ];

    const signature = await sendTransaction(instructions, {
      computeUnitLimit: 200_000,
    });

    console.log('Transaction:', signature);
  };

  return <button onClick={handleCustomTransfer}>Custom Transfer</button>;
}
```

### Error Handling

```tsx
import { formatTransactionError } from '@lazor-starter/core';

try {
  await transferSOL(recipient, amount);
} catch (error: any) {
  // Format error for user display
  const errorMessage = formatTransactionError(error, 'Transfer');
  console.error(errorMessage);
  
  // Handle specific error types
  if (error.message?.includes('insufficient funds')) {
    // Show balance error
  } else if (error.message?.includes('invalid address')) {
    // Show address error
  }
}
```

## Troubleshooting

### Issue: "Insufficient funds" error

**Solution:** Ensure user has enough token balance (not gas balance - gas is free!).

```tsx
// Check balance before transfer
const { solBalance } = useWalletBalance(pubkey);

if (solBalance < amount) {
  setError('Insufficient balance');
  return;
}
```

### Issue: Transaction fails silently

**Solution:** Check Paymaster URL configuration and network settings.

```bash
# Verify environment variables
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://...
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL_DEVNET=https://...
```

### Issue: "Invalid recipient address"

**Solution:** Validate address before sending.

```tsx
import { validateRecipientAddress } from '@lazor-starter/core';

if (!validateRecipientAddress(recipient)) {
  setError('Invalid address');
  return;
}
```

## Best Practices

1. **Always validate inputs** - Check recipient address and amount before sending
2. **Show loading states** - Provide feedback during transaction processing
3. **Handle errors gracefully** - Display user-friendly error messages
4. **Check balances** - Verify sufficient funds before initiating transfer
5. **Use proper decimals** - Ensure token decimals are correct (USDC = 6, SOL = 9)

## Related Documentation

- [Passkey Wallet Basics](./01-passkey-wallet-basics.md) - Wallet connection
- [Jupiter Swap](./03-jupiter-swap.md) - Token swaps
- [NFT Minting](./04-nft-minting.md) - Mint NFTs

