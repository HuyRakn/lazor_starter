'use client';

import { useState } from 'react';
import { useAuth, useSmartWallet, formatTransactionError, validateNftMetadata, generateMintId, addSmartWalletToInstructions } from '@lazor-starter/core';
import {
  buildCNftMintInstruction,
  extractCNftAssetId,
  storeNftMetadata,
  DEMO_MERKLE_TREE,
  CNFT_SYMBOL,
} from '@/lib/nft-utils';
import { Card, Button, Input, Label, Alert, AlertDescription } from '@lazor-starter/ui';
import { useRouter } from 'next/navigation';

export default function CompressedNftPage() {
  const router = useRouter();
  const { pubkey } = useAuth();
  const { wallet, signAndSendTransaction } = useSmartWallet();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minting, setMinting] = useState(false);
  const [mintedNft, setMintedNft] = useState<{
    assetId: string;
    treeAddress: string;
    name: string;
    description: string;
    signature: string;
  } | null>(null);
  const [error, setError] = useState('');

  const handleMint = async () => {
    if (!pubkey || !wallet) {
      router.push('/dashboard');
      return;
    }

    const validation = validateNftMetadata(name, description);
    if (!validation.valid) {
      setError(validation.error || 'Invalid input');
      return;
    }

    setMinting(true);
    setError('');
    setMintedNft(null);

    try {
      // Store metadata
      const mintId = generateMintId('cnft');
      const metadataUri = await storeNftMetadata(mintId, {
        name: name.trim(),
        description: description.trim(),
      });

      // Build cNFT mint instruction
      const instructions = buildCNftMintInstruction(
        pubkey,
        DEMO_MERKLE_TREE,
        name.trim(),
        metadataUri,
        CNFT_SYMBOL
      );
      addSmartWalletToInstructions(instructions, pubkey);

      // Send transaction
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
        name: name.trim(),
        description: description.trim(),
        signature,
      });

      setName('');
      setDescription('');
    } catch (err) {
      setError(formatTransactionError(err, 'cNFT Minting'));
    } finally {
      setMinting(false);
    }
  };

  if (!pubkey) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please login first</p>
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white transition"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-white">Compressed NFT</h1>
          </div>

          <Card className="p-6 md:p-7 space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300/90">
                  NFT Name
                </Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Compressed NFT"
                  className="w-full"
                  maxLength={32}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300/90">
                  Description
                </Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your compressed NFT..."
                  className="w-full rounded-2xl border-[2px] border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 min-h-[100px]"
                  maxLength={200}
                />
              </div>

              <Button
                onClick={handleMint}
                disabled={minting || !name || !description}
                className="w-full h-12 text-base"
              >
                {minting ? 'Minting...' : 'Mint cNFT (100% Gasless!)'}
              </Button>

              {error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription className="text-red-200 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {mintedNft && (
                <Alert className="mt-2">
                  <AlertDescription className="text-green-400/90 text-sm space-y-2">
                    <p>✅ Compressed NFT minted successfully!</p>
                    <div className="space-y-1 text-xs">
                      <p>Asset ID: {mintedNft.assetId.slice(0, 20)}...</p>
                      <a
                        href={`https://explorer.solana.com/tx/${mintedNft.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-200 underline"
                      >
                        View on Explorer →
                      </a>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

