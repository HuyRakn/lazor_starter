# Tutorial 2: Gasless Transactions in 3 Lines

Learn how to send tokens without paying gas fees using Lazorkit's Paymaster.

## Prerequisites

- Completed [Tutorial 1](./tutorial-1-passkey-wallet.md)
- Wallet created and logged in

## What is Gasless?

Traditional Solana transactions require users to pay SOL for gas fees. With Lazorkit's Paymaster, transactions are sponsored - users pay **zero gas fees**.

## Step 1: Use the Hook

Import `useGaslessTx` in your component:

```tsx
import { useGaslessTx } from '@lazor-starter/core';
```

## Step 2: Send SOL (Gasless)

```tsx
'use client';

import { useGaslessTx } from '@lazor-starter/core';
import { useState } from 'react';

export default function TransferPage() {
  const { transferSOL } = useGaslessTx();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = async () => {
    try {
      // That's it! Just 3 lines:
      const signature = await transferSOL(recipient, parseFloat(amount));
      console.log('Transaction sent:', signature);
      alert('Success! Transaction: ' + signature.slice(0, 16) + '...');
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  return (
    <div>
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
      <button onClick={handleSend}>Send SOL (Gasless)</button>
    </div>
  );
}
```

## Step 3: Send SPL Tokens (Gasless)

For USDC, USDT, or other SPL tokens:

```tsx
const { transferSPLToken } = useGaslessTx();

const handleSendUSDC = async () => {
  const signature = await transferSPLToken(
    recipient,
    10.5, // amount
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mint
    6 // decimals
  );
  console.log('USDC sent:', signature);
};
```

## How It Works

1. **User Signs Intent**: You create a transaction instruction
2. **SDK Routes to Paymaster**: Lazorkit SDK automatically sends the transaction to your configured Paymaster URL
3. **Paymaster Pays Gas**: The Paymaster signs and submits the transaction, paying all gas fees
4. **User Receives Confirmation**: Transaction completes with zero cost to the user

## Configuration

The Paymaster URL is configured in `LazorProvider`:

```tsx
<LazorProvider
  paymasterUrl="https://your-paymaster-url.com"
>
  {children}
</LazorProvider>
```

Or via environment variable:

```env
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://your-paymaster-url.com
```

## Benefits

- 🎉 **Better UX**: Users don't need SOL to transact
- 📱 **Mobile Friendly**: No need to airdrop SOL to new users
- 💰 **Cost Effective**: Businesses can sponsor transactions
- 🚀 **Faster Adoption**: Lower barrier to entry

## Advanced: Custom Transactions

You can also send custom transaction instructions:

```tsx
const { sendTransaction } = useGaslessTx();
import { SystemProgram, TransactionInstruction } from '@solana/web3.js';

const instruction = SystemProgram.transfer({
  fromPubkey: walletAddress,
  toPubkey: recipientAddress,
  lamports: amount * 1e9,
});

const signature = await sendTransaction([instruction]);
```

## Summary

With just 3 lines of code, you've:
- ✅ Sent SOL without paying gas
- ✅ Used Lazorkit Paymaster
- ✅ Improved user experience

**That's the power of Lazorkit!** 🚀

