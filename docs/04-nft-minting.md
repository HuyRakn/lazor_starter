# NFT Minting

Complete guide to minting standard NFTs using Metaplex Token Metadata with LazorKit Smart Wallets.

## Overview

This guide covers minting standard NFTs (non-fungible tokens) on Solana using Metaplex Token Metadata program. NFTs are minted with full on-chain metadata and can be traded on NFT marketplaces.

### Key Features

- ✅ **Gasless Minting** - Zero transaction fees for users
- ✅ **Metaplex Integration** - Full Token Metadata support
- ✅ **On-chain Metadata** - Metadata stored on IPFS with on-chain references
- ✅ **Master Edition** - True 1/1 NFTs with no prints
- ✅ **Marketplace Ready** - Compatible with all Solana NFT marketplaces

## Prerequisites

- Wallet connected via `useAuth()` or `useSmartWallet()`
- Paymaster URL configured
- Sufficient SOL balance for rent (covered by Paymaster)
- NFT metadata prepared (name, description, image)

## Quick Start

### Basic NFT Minting

```tsx
'use client';

import { useState } from 'react';
import { 
  useSmartWallet,
  useAuth,
  validateNftMetadata,
  generateMintId,
  addSmartWalletToInstructions,
  formatTransactionError
} from '@lazor-starter/core';
import { 
  buildMetaplexInstructions,
  storeNftMetadata,
  REGULAR_NFT_SYMBOL
} from '@/lib/nft-utils';
import { 
  PublicKey, 
  SystemProgram, 
  TransactionInstruction 
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
} from '@solana/spl-token';
import { getConnection } from '@lazor-starter/core';

export default function NftMintingPage() {
  const { pubkey } = useAuth();
  const { wallet, signAndSendTransaction } = useSmartWallet();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');
  const [mintedNft, setMintedNft] = useState<{
    mintAddress: string;
    signature: string;
  } | null>(null);

  const handleMint = async () => {
    if (!pubkey || !wallet) return;

    // Validate metadata
    const validation = validateNftMetadata(name, description);
    if (!validation.valid) {
      setError(validation.error || 'Invalid input');
      return;
    }

    setMinting(true);
    setError('');
    setMintedNft(null);

    try {
      const connection = getConnection();
      const walletPubkey = new PublicKey(pubkey);

      // Generate unique mint ID
      const mintId = generateMintId('nft');
      
      // Store metadata on IPFS
      const metadataUri = await storeNftMetadata(mintId, {
        name: name.trim(),
        description: description.trim(),
      });

      // Create mint account with seed
      const mintSeed = `nft-${mintId}`;
      const mintPubkey = await PublicKey.createWithSeed(
        walletPubkey,
        mintSeed,
        TOKEN_PROGRAM_ID
      );

      // Calculate rent for mint account
      const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
      
      // Get associated token address
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPubkey,
        walletPubkey,
        true
      );

      const instructions: TransactionInstruction[] = [];

      // 1. Create mint account
      instructions.push(
        SystemProgram.createAccountWithSeed({
          fromPubkey: walletPubkey,
          basePubkey: walletPubkey,
          seed: mintSeed,
          newAccountPubkey: mintPubkey,
          lamports,
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // 2. Initialize mint (0 decimals for NFT)
      instructions.push(
        createInitializeMintInstruction(
          mintPubkey,
          0, // NFTs have 0 decimals
          walletPubkey, // Mint authority
          walletPubkey  // Freeze authority
        )
      );

      // 3. Create associated token account
      instructions.push(
        createAssociatedTokenAccountInstruction(
          walletPubkey, // Payer
          associatedTokenAddress,
          walletPubkey, // Owner
          mintPubkey   // Mint
        )
      );

      // 4. Mint 1 token to owner
      instructions.push(
        createMintToInstruction(
          mintPubkey,
          associatedTokenAddress,
          walletPubkey, // Mint authority
          1, // Amount (1 NFT)
          []
        )
      );

      // 5. Build Metaplex metadata instructions
      const metaplexInstructions = await buildMetaplexInstructions(
        pubkey,
        mintPubkey.toBase58(),
        name.trim(),
        metadataUri,
        REGULAR_NFT_SYMBOL
      );
      instructions.push(...metaplexInstructions);

      // 6. Add smart wallet to all instructions (required for LazorKit validation)
      addSmartWalletToInstructions(instructions, pubkey);

      // 7. Send transaction (gasless!)
      const signature = await signAndSendTransaction({
        instructions,
        transactionOptions: {
          computeUnitLimit: 400_000,
        },
      });

      setMintedNft({
        mintAddress: mintPubkey.toBase58(),
        signature,
      });

      setName('');
      setDescription('');
    } catch (err: any) {
      setError(formatTransactionError(err, 'NFT Minting'));
    } finally {
      setMinting(false);
    }
  };

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="NFT Name"
        maxLength={32}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        maxLength={200}
      />
      
      {error && <p className="error">{error}</p>}
      
      {mintedNft && (
        <div>
          <p>NFT Minted!</p>
          <p>Mint: {mintedNft.mintAddress}</p>
          <a href={`https://explorer.solana.com/tx/${mintedNft.signature}`}>
            View Transaction
          </a>
        </div>
      )}

      <button 
        onClick={handleMint} 
        disabled={minting || !name || !description}
      >
        {minting ? 'Minting...' : 'Mint NFT'}
      </button>
    </div>
  );
}
```

## API Reference

### NFT Utilities

**`validateNftMetadata(name, description)`**

Validates NFT metadata before minting.

```typescript
const validation = validateNftMetadata(name, description);
if (!validation.valid) {
  console.error(validation.error);
}
```

**Returns:**
```typescript
{
  valid: boolean;
  error?: string;
}
```

**`generateMintId(prefix)`**

Generates a unique mint ID for the NFT.

```typescript
const mintId = generateMintId('nft'); // e.g., "nft-abc123..."
```

**`storeNftMetadata(mintId, metadata)`**

Stores NFT metadata on IPFS and returns URI.

```typescript
const metadataUri = await storeNftMetadata(mintId, {
  name: 'My NFT',
  description: 'A cool NFT',
});
// Returns: "https://ipfs.io/ipfs/..."
```

**`buildMetaplexInstructions(walletAddress, mintAddress, name, metadataUri, symbol?)`**

Builds Metaplex Token Metadata instructions.

```typescript
const instructions = await buildMetaplexInstructions(
  walletAddress,
  mintAddress,
  'My NFT',
  metadataUri,
  'LKST' // Optional symbol
);
```

**`addSmartWalletToInstructions(instructions, smartWalletAddress)`**

Adds smart wallet to instructions for LazorKit validation.

```typescript
addSmartWalletToInstructions(instructions, wallet.smartWallet);
```

## Step-by-Step Guide

### Step 1: Prepare Metadata

```tsx
function MetadataForm({ onMetadataReady }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    const validation = validateNftMetadata(name, description);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const mintId = generateMintId('nft');
    const metadataUri = await storeNftMetadata(mintId, {
      name: name.trim(),
      description: description.trim(),
    });

    onMetadataReady({ name, description, metadataUri, mintId });
  };

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="NFT Name (max 32 chars)"
        maxLength={32}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (max 200 chars)"
        maxLength={200}
      />
      <button onClick={handleSubmit}>Prepare Metadata</button>
    </div>
  );
}
```

### Step 2: Build Mint Instructions

```tsx
async function buildNftMintInstructions(
  walletAddress: string,
  mintId: string,
  metadataUri: string,
  name: string
): Promise<TransactionInstruction[]> {
  const connection = getConnection();
  const walletPubkey = new PublicKey(walletAddress);
  
  const mintSeed = `nft-${mintId}`;
  const mintPubkey = await PublicKey.createWithSeed(
    walletPubkey,
    mintSeed,
    TOKEN_PROGRAM_ID
  );

  const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
  const associatedTokenAddress = await getAssociatedTokenAddress(
    mintPubkey,
    walletPubkey,
    true
  );

  const instructions: TransactionInstruction[] = [];

  // Create mint account
  instructions.push(
    SystemProgram.createAccountWithSeed({
      fromPubkey: walletPubkey,
      basePubkey: walletPubkey,
      seed: mintSeed,
      newAccountPubkey: mintPubkey,
      lamports,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  // Initialize mint
  instructions.push(
    createInitializeMintInstruction(
      mintPubkey,
      0,
      walletPubkey,
      walletPubkey
    )
  );

  // Create ATA
  instructions.push(
    createAssociatedTokenAccountInstruction(
      walletPubkey,
      associatedTokenAddress,
      walletPubkey,
      mintPubkey
    )
  );

  // Mint token
  instructions.push(
    createMintToInstruction(
      mintPubkey,
      associatedTokenAddress,
      walletPubkey,
      1,
      []
    )
  );

  // Add Metaplex metadata
  const metaplexInstructions = await buildMetaplexInstructions(
    walletAddress,
    mintPubkey.toBase58(),
    name,
    metadataUri
  );
  instructions.push(...metaplexInstructions);

  return instructions;
}
```

### Step 3: Execute Mint Transaction

```tsx
async function executeMint(
  wallet: SmartWallet,
  instructions: TransactionInstruction[]
) {
  // Add smart wallet to instructions
  addSmartWalletToInstructions(instructions, wallet.smartWallet);

  // Send transaction
  const signature = await signAndSendTransaction({
    instructions,
    transactionOptions: {
      computeUnitLimit: 400_000,
    },
  });

  return signature;
}
```

## Advanced Usage

### Custom Metadata Fields

```tsx
// Extend metadata with custom fields
const metadataUri = await storeNftMetadata(mintId, {
  name: 'My NFT',
  description: 'A cool NFT',
  // Custom fields
  attributes: [
    { trait_type: 'Color', value: 'Blue' },
    { trait_type: 'Rarity', value: 'Common' },
  ],
  external_url: 'https://mywebsite.com/nft',
  image: 'https://mywebsite.com/image.png',
});
```

### Collection Support

```tsx
// Add NFT to a collection (requires collection NFT)
const collectionMetadata = findMetadataPda(umi, { 
  mint: collectionMintPublicKey 
});

// Include in metadata creation
const metaplexInstructions = await buildMetaplexInstructions(
  walletAddress,
  mintAddress,
  name,
  metadataUri,
  symbol,
  collectionMetadata // Collection metadata PDA
);
```

## Troubleshooting

### Issue: "Invalid metadata" error

**Solution:** Ensure name and description meet requirements:
- Name: 1-32 characters
- Description: 1-200 characters

### Issue: Transaction fails

**Solution:**
- Check wallet has sufficient balance (rent is covered by Paymaster)
- Verify Paymaster URL is configured
- Ensure compute unit limit is sufficient (400,000 recommended)

### Issue: Metadata not appearing

**Solution:**
- Verify IPFS URI is accessible
- Check metadata format matches Metaplex standard
- Wait for blockchain confirmation

## Best Practices

1. **Validate metadata early** - Check before storing on IPFS
2. **Use unique mint IDs** - Prevent collisions
3. **Store metadata on IPFS** - Decentralized storage
4. **Set appropriate compute limits** - 400,000 for standard NFTs
5. **Handle errors gracefully** - Show user-friendly messages

## Related Documentation

- [Passkey Wallet Basics](./01-passkey-wallet-basics.md) - Wallet connection
- [Compressed NFT](./05-compressed-nft.md) - Mint compressed NFTs
- [Gasless Transfer](./02-gasless-transfer.md) - Token transfers

