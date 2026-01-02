# Jupiter Swap

Complete guide to implementing gasless token swaps using Jupiter Aggregator v6 API with LazorKit Smart Wallets.

## Overview

Jupiter Swap integration enables users to swap tokens on decentralized exchanges (DEX) without paying gas fees. The integration uses Jupiter Aggregator v6 API to find the best swap routes and executes swaps through LazorKit Smart Wallets with automatic gas sponsorship.

### Key Features

- ✅ **Gasless Swaps** - Zero transaction fees for users
- ✅ **Best Price Routing** - Jupiter finds optimal swap routes
- ✅ **Versioned Transactions** - Supports v0 transactions with Address Lookup Tables
- ✅ **Multiple DEX Support** - Aggregates liquidity from multiple DEXs
- ✅ **Slippage Protection** - Configurable slippage tolerance

## Prerequisites

- Wallet connected via `useAuth()` or `useSmartWallet()`
- Paymaster URL configured
- Sufficient token balance for swap amount

## Quick Start

### Basic Token Swap

```tsx
'use client';

import { useJupiterSwap, useAuth } from '@lazor-starter/core';

export default function SwapPage() {
  const { pubkey } = useAuth();
  const { executeSwap, getQuote, loading } = useJupiterSwap();
  
  const [inputMint, setInputMint] = useState('So11111111111111111111111111111111111111112'); // SOL
  const [outputMint, setOutputMint] = useState('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
  const [amount, setAmount] = useState('1.0');
  const [quote, setQuote] = useState(null);

  const handleGetQuote = async () => {
    try {
      const quoteData = await getQuote({
        inputMint,
        outputMint,
        amount: parseFloat(amount),
        slippageBps: 50, // 0.5% slippage
      });
      
      setQuote(quoteData);
    } catch (error) {
      console.error('Quote failed:', error);
    }
  };

  const handleSwap = async () => {
    try {
      const signature = await executeSwap({
        inputMint,
        outputMint,
        amount: parseFloat(amount),
        slippageBps: 50,
      });
      
      console.log('Swap transaction:', signature);
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  return (
    <div>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
      />
      <button onClick={handleGetQuote}>Get Quote</button>
      {quote && (
        <div>
          <p>Output: {quote.outAmount}</p>
          <button onClick={handleSwap} disabled={loading}>
            {loading ? 'Swapping...' : 'Execute Swap'}
          </button>
        </div>
      )}
    </div>
  );
}
```

## API Reference

### `useJupiterSwap()` Hook

Provides methods for getting quotes and executing token swaps.

#### Returns

```typescript
{
  // Methods
  getQuote: (params: SwapParams) => Promise<SwapQuote>;
  executeSwap: (params: SwapParams) => Promise<string>;
  
  // State
  loading: boolean;
  error: Error | null;
}
```

#### Methods

**`getQuote(params)`**

Gets a quote for a token swap without executing it.

```typescript
const quote = await getQuote({
  inputMint: 'So11111111111111111111111111111111111111112', // SOL
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amount: 1.0, // Amount in input token units
  slippageBps: 50, // Slippage in basis points (50 = 0.5%)
});
```

**Parameters:**
- `inputMint` (string): Token mint address to swap from
- `outputMint` (string): Token mint address to swap to
- `amount` (number): Amount in input token units
- `slippageBps` (number, optional): Slippage tolerance in basis points (default: 50)

**Returns:** `SwapQuote` object with swap details

**`executeSwap(params)`**

Executes a token swap transaction.

```typescript
const signature = await executeSwap({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: 1.0,
  slippageBps: 50,
});
```

**Parameters:** Same as `getQuote()`

**Returns:** Transaction signature (base58 string)

### SwapQuote Interface

```typescript
interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string; // Amount in smallest unit
  outAmount: string; // Output amount in smallest unit
  priceImpactPct: number; // Price impact percentage
  routePlan: any; // Jupiter route plan
}
```

## Step-by-Step Guide

### Step 1: Token Selection

```tsx
import { TOKEN_MINTS } from '@lazor-starter/core';

const TOKENS = [
  { 
    symbol: 'SOL', 
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9 
  },
  { 
    symbol: 'USDC', 
    mint: TOKEN_MINTS.USDC_MAINNET,
    decimals: 6 
  },
];

function TokenSelector({ value, onChange, label }) {
  return (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {TOKENS.map((token) => (
          <option key={token.mint} value={token.mint}>
            {token.symbol}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Step 2: Complete Swap Form

```tsx
'use client';

import { useState } from 'react';
import { 
  useJupiterSwap, 
  useAuth,
  formatTransactionError,
  TOKEN_MINTS,
  useNetworkStore
} from '@lazor-starter/core';

export default function SwapForm() {
  const { pubkey } = useAuth();
  const { network } = useNetworkStore();
  const { executeSwap, getQuote, loading, error } = useJupiterSwap();
  
  const [inputMint, setInputMint] = useState('So11111111111111111111111111111111111111112');
  const [outputMint, setOutputMint] = useState(TOKEN_MINTS.USDC_MAINNET);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(50); // 0.5%
  const [quote, setQuote] = useState<any>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const handleGetQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setQuoteLoading(true);
    setQuote(null);

    try {
      const quoteData = await getQuote({
        inputMint,
        outputMint,
        amount: parseFloat(amount),
        slippageBps: slippage,
      });
      
      setQuote(quoteData);
    } catch (err: any) {
      console.error('Quote error:', err);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quote) return;

    setSignature(null);

    try {
      const txSignature = await executeSwap({
        inputMint,
        outputMint,
        amount: parseFloat(amount),
        slippageBps: slippage,
      });

      setSignature(txSignature);
      setAmount('');
      setQuote(null);
    } catch (err: any) {
      console.error('Swap error:', formatTransactionError(err, 'Swap'));
    }
  };

  return (
    <div>
      <div>
        <label>From</label>
        <TokenSelector 
          value={inputMint} 
          onChange={setInputMint}
          label="Input Token"
        />
      </div>

      <div>
        <label>To</label>
        <TokenSelector 
          value={outputMint} 
          onChange={setOutputMint}
          label="Output Token"
        />
      </div>

      <div>
        <label>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
        <button onClick={handleGetQuote} disabled={quoteLoading}>
          {quoteLoading ? 'Getting quote...' : 'Get Quote'}
        </button>
      </div>

      <div>
        <label>Slippage (%)</label>
        <input
          type="number"
          value={slippage / 100}
          onChange={(e) => setSlippage(parseFloat(e.target.value) * 100)}
          step="0.1"
        />
      </div>

      {quote && (
        <div>
          <p>You will receive: {quote.outAmount}</p>
          <p>Price impact: {quote.priceImpactPct}%</p>
          <button onClick={handleSwap} disabled={loading}>
            {loading ? 'Swapping...' : 'Execute Swap'}
          </button>
        </div>
      )}

      {error && <p className="error">{error.message}</p>}
      
      {signature && (
        <div>
          <p>Swap successful!</p>
          <a 
            href={`https://explorer.solana.com/tx/${signature}${network === 'devnet' ? '?cluster=devnet' : ''}`}
            target="_blank"
          >
            View Transaction
          </a>
        </div>
      )}
    </div>
  );
}
```

## Advanced Usage

### Swap Direction Toggle

```tsx
function SwapDirectionToggle({ inputMint, outputMint, onSwap }) {
  return (
    <button onClick={onSwap}>
      ⇅ Swap Direction
    </button>
  );
}

// Usage
const handleSwapDirection = () => {
  setInputMint(outputMint);
  setOutputMint(inputMint);
  setQuote(null); // Clear quote when direction changes
};
```

### Price Impact Warning

```tsx
function PriceImpactWarning({ priceImpactPct }) {
  if (priceImpactPct > 5) {
    return (
      <div className="warning">
        ⚠️ High price impact: {priceImpactPct}%
      </div>
    );
  }
  
  if (priceImpactPct > 1) {
    return (
      <div className="info">
        Price impact: {priceImpactPct}%
      </div>
    );
  }
  
  return null;
}
```

### Auto-refresh Quote

```tsx
import { useEffect } from 'react';

function AutoQuote({ inputMint, outputMint, amount, onQuote }) {
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) return;

    const timer = setTimeout(() => {
      onQuote();
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [inputMint, outputMint, amount]);

  return null;
}
```

## Troubleshooting

### Issue: "No route found" error

**Solution:** 
- Check if both tokens are valid and have liquidity
- Try swapping smaller amounts
- Verify token mint addresses are correct

### Issue: High slippage errors

**Solution:** Increase slippage tolerance or reduce swap amount.

```tsx
// Increase slippage to 1%
const quote = await getQuote({
  ...params,
  slippageBps: 100, // 1%
});
```

### Issue: Transaction fails

**Solution:** 
- Check wallet has sufficient balance
- Verify Paymaster URL is configured
- Check network (mainnet vs devnet) matches token addresses

## Best Practices

1. **Always get quote first** - Show users expected output before executing
2. **Display price impact** - Warn users about high price impact swaps
3. **Validate amounts** - Check sufficient balance before swap
4. **Handle errors gracefully** - Show user-friendly error messages
5. **Use appropriate slippage** - Balance between protection and execution success

## Related Documentation

- [Passkey Wallet Basics](./01-passkey-wallet-basics.md) - Wallet connection
- [Gasless Transfer](./02-gasless-transfer.md) - Token transfers
- [NFT Minting](./04-nft-minting.md) - Mint NFTs

