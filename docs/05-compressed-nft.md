# Compressed NFT (cNFT)

Complete guide to minting compressed NFTs using Metaplex Bubblegum with LazorKit Smart Wallets.

## Overview

Compressed NFTs (cNFTs) are a revolutionary NFT format on Solana that dramatically reduces storage costs by storing NFT data in a Merkle tree instead of individual on-chain accounts. This enables truly gasless minting with zero rent costs.

### Key Features

- ✅ **Zero Rent Costs** - No on-chain account rent required
- ✅ **Truly Gasless** - Minimal transaction fees (covered by Paymaster)
- ✅ **Scalable** - Can mint millions of NFTs efficiently
- ✅ **Metaplex Bubblegum** - Full Metaplex compatibility
- ✅ **Marketplace Ready** - Works with cNFT-compatible marketplaces

## Prerequisites

- Wallet connected via `useAuth()` or `useSmartWallet()`
- Paymaster URL configured
- Merkle tree address (can use demo tree for testing)
- NFT metadata prepared

## Quick Start

### Basic cNFT Minting

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
  buildCNftMintInstruction,
  extractCNftAssetId,
  storeNftMetadata,
  DEMO_MERKLE_TREE,
  CNFT_SYMBOL
} from '@/lib/nft-utils';

export default function CompressedNftPage() {
  const { pubkey } = useAuth();
  const { wallet, signAndSendTransaction } = useSmartWallet();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');
  const [mintedNft, setMintedNft] = useState<{
    assetId: string;
    treeAddress: string;
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
      // Generate unique mint ID
      const mintId = generateMintId('cnft');
      
      // Store metadata on IPFS
      const metadataUri = await storeNftMetadata(mintId, {
        name: name.trim(),
        description: description.trim(),
      });

      // Build cNFT mint instruction
      const instructions = buildCNftMintInstruction(
        pubkey,
        DEMO_MERKLE_TREE, // Merkle tree address
        name.trim(),
        metadataUri,
        CNFT_SYMBOL
      );

      // Add smart wallet to instructions (required for LazorKit validation)
      addSmartWalletToInstructions(instructions, pubkey);

      // Send transaction (gasless!)
      const signature = await signAndSendTransaction({
        instructions,
        transactionOptions: {
          computeUnitLimit: 400_000,
        },
      });

      // Extract asset ID from transaction logs
      const assetId = await extractCNftAssetId(signature);

      setMintedNft({
        assetId: assetId || 'Unknown',
        treeAddress: DEMO_MERKLE_TREE,
        signature,
      });

      setName('');
      setDescription('');
    } catch (err: any) {
      setError(formatTransactionError(err, 'cNFT Minting'));
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
          <p>Compressed NFT Minted!</p>
          <p>Asset ID: {mintedNft.assetId}</p>
          <p>Tree: {mintedNft.treeAddress}</p>
          <a href={`https://explorer.solana.com/tx/${mintedNft.signature}`}>
            View Transaction
          </a>
        </div>
      )}

      <button 
        onClick={handleMint} 
        disabled={minting || !name || !description}
      >
        {minting ? 'Minting...' : 'Mint Compressed NFT'}
      </button>
    </div>
  );
}
```

## API Reference

### cNFT Utilities

**`buildCNftMintInstruction(walletAddress, merkleTreeAddress, name, metadataUri, symbol?)`**

Builds Bubblegum mint instruction for compressed NFT.

```typescript
const instructions = buildCNftMintInstruction(
  walletAddress,
  merkleTreeAddress,
  'My cNFT',
  metadataUri,
  'cLKST' // Optional symbol
);
```

**Parameters:**
- `walletAddress` (string): Wallet address (owner of cNFT)
- `merkleTreeAddress` (string): Merkle tree address
- `name` (string): NFT name
- `metadataUri` (string): IPFS metadata URI
- `symbol` (string, optional): Token symbol (default: 'cLKST')

**Returns:** Array of `TransactionInstruction`

**`extractCNftAssetId(signature)`**

Extracts cNFT asset ID from transaction signature.

```typescript
const assetId = await extractCNftAssetId(signature);
// Returns: Asset ID string or null
```

**`DEMO_MERKLE_TREE`**

Pre-configured merkle tree address for testing.

```typescript
import { DEMO_MERKLE_TREE } from '@/lib/nft-utils';

// Use demo tree for testing
const instructions = buildCNftMintInstruction(
  walletAddress,
  DEMO_MERKLE_TREE,
  name,
  metadataUri
);
```

## Step-by-Step Guide

### Step 1: Create Merkle Tree (Production)

For production, create your own merkle tree:

```typescript
import { 
  createTree, 
  getMerkleTreeAccountSize 
} from '@metaplex-foundation/mpl-bubblegum';

async function createMerkleTree(
  walletAddress: string,
  maxDepth: number = 14,
  maxBufferSize: number = 64
) {
  const connection = getConnection();
  const rpcUrl = connection.rpcEndpoint;
  const umi = createUmi(rpcUrl).use(mplBubblegum());
  
  const treeSize = getMerkleTreeAccountSize(maxDepth, maxBufferSize);
  const lamports = await connection.getMinimumBalanceForRentExemption(treeSize);
  
  // Create tree account
  const treeBuilder = createTree(umi, {
    maxDepth,
    maxBufferSize,
    payer: umiPublicKey(walletAddress),
  });
  
  const instructions = treeBuilder.getInstructions();
  // Execute instructions...
  
  return treeBuilder.getTreeAddress();
}
```

### Step 2: Prepare Metadata

```tsx
async function prepareMetadata(name: string, description: string) {
  const validation = validateNftMetadata(name, description);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const mintId = generateMintId('cnft');
  const metadataUri = await storeNftMetadata(mintId, {
    name: name.trim(),
    description: description.trim(),
  });

  return { mintId, metadataUri };
}
```

### Step 3: Build and Execute Mint

```tsx
async function mintCompressedNft(
  wallet: SmartWallet,
  merkleTree: string,
  name: string,
  metadataUri: string
) {
  // Build instructions
  const instructions = buildCNftMintInstruction(
    wallet.smartWallet,
    merkleTree,
    name,
    metadataUri
  );

  // Add smart wallet for validation
  addSmartWalletToInstructions(instructions, wallet.smartWallet);

  // Execute transaction
  const signature = await signAndSendTransaction({
    instructions,
    transactionOptions: {
      computeUnitLimit: 400_000,
    },
  });

  // Extract asset ID
  const assetId = await extractCNftAssetId(signature);

  return { signature, assetId };
}
```

## Advanced Usage

### Batch Minting

```tsx
async function batchMintCNfts(
  wallet: SmartWallet,
  merkleTree: string,
  nfts: Array<{ name: string; description: string }>
) {
  const results = [];

  for (const nft of nfts) {
    const { mintId, metadataUri } = await prepareMetadata(nft.name, nft.description);
    
    const instructions = buildCNftMintInstruction(
      wallet.smartWallet,
      merkleTree,
      nft.name,
      metadataUri
    );

    addSmartWalletToInstructions(instructions, wallet.smartWallet);

    const signature = await signAndSendTransaction({
      instructions,
      transactionOptions: {
        computeUnitLimit: 400_000,
      },
    });

    const assetId = await extractCNftAssetId(signature);
    results.push({ signature, assetId, name: nft.name });
  }

  return results;
}
```

### Custom Metadata

```tsx
// Store extended metadata
const metadataUri = await storeNftMetadata(mintId, {
  name: 'My cNFT',
  description: 'A compressed NFT',
  attributes: [
    { trait_type: 'Color', value: 'Red' },
    { trait_type: 'Rarity', value: 'Legendary' },
  ],
  image: 'https://ipfs.io/ipfs/...',
  external_url: 'https://mywebsite.com/cnft',
});
```

## Troubleshooting

### Issue: "Invalid merkle tree" error

**Solution:** 
- Verify merkle tree address is correct
- Ensure tree has capacity for new NFTs
- Check tree is on correct network (mainnet/devnet)

### Issue: Asset ID extraction fails

**Solution:**
- Wait for transaction confirmation
- Check transaction logs for asset ID
- Verify transaction was successful

### Issue: Transaction fails

**Solution:**
- Check compute unit limit (400,000 recommended)
- Verify Paymaster URL is configured
- Ensure metadata URI is accessible

## Best Practices

1. **Use appropriate merkle tree size** - Plan for expected NFT count
2. **Store metadata on IPFS** - Decentralized and permanent
3. **Validate metadata** - Check before minting
4. **Handle errors gracefully** - Show user-friendly messages
5. **Extract asset ID** - Store for future reference

## cNFT vs Standard NFT

| Feature | Standard NFT | Compressed NFT (cNFT) |
|---------|-------------|----------------------|
| **Rent Cost** | ~0.012 SOL per NFT | Zero (stored in Merkle tree) |
| **Storage** | Individual on-chain account | Merkle tree leaf |
| **Scalability** | Limited by rent costs | Millions of NFTs possible |
| **Gas Fees** | Covered by Paymaster | Covered by Paymaster |
| **Marketplace** | All Solana marketplaces | cNFT-compatible marketplaces |

## Related Documentation

- [Passkey Wallet Basics](./01-passkey-wallet-basics.md) - Wallet connection
- [NFT Minting](./04-nft-minting.md) - Standard NFT minting
- [Gasless Transfer](./02-gasless-transfer.md) - Token transfers

