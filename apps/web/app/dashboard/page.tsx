'use client';

import {
  useAuth,
  useGaslessTx,
  useWalletBalance,
  useAirdrop,
  formatAddress,
  useNetworkStore,
  formatTransactionError,
  useSmartWallet,
  getConnection,
  validateNftMetadata,
  generateMintId,
  addSmartWalletToInstructions,
} from '@lazor-starter/core';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button, 
  Input, 
  Label, 
  Alert, 
  AlertDescription, 
  ThreeDMarquee,
  WalletBanner,
} from '@lazor-starter/ui';
import type { TabItem } from '@lazor-starter/ui';
import { CodeExampleCard } from '@/components/CodeExampleCard';
import { codeExamples } from '@/data/codeExamples';
import { useJupiterSwap } from '@lazor-starter/core';
import { Tabs } from '@lazor-starter/ui';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TOKEN_MINTS } from '@lazor-starter/core';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
} from '@solana/spl-token';
import {
  buildMetaplexInstructions,
  buildCNftMintInstruction,
  extractCNftAssetId,
  storeNftMetadata,
  REGULAR_NFT_SYMBOL,
  CNFT_SYMBOL,
  DEMO_MERKLE_TREE,
} from '@/lib/nft-utils';

export default function DashboardPage() {
  const router = useRouter();
  const { 
    pubkey, 
    logout, 
    isInitialized, 
    isLoggedIn,
    registerNewWallet,
    loginWithPasskey,
    createSmartWallet,
    passkeyData,
  } = useAuth();
  const { transferSOL, transferSPLToken } = useGaslessTx();
  const { requestSOLAirdrop, requestUSDCAirdrop, loading: airdropLoading } = useAirdrop();
  const { network, setNetwork } = useNetworkStore();
  const { wallet: smartWallet, signAndSendTransaction } = useSmartWallet();
  
  // Login state
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [networkSwitchLoading, setNetworkSwitchLoading] = useState(false);

  // Select correct USDC mint by network
  const usdcMintAddress = useMemo(
    () => (network === 'devnet' ? TOKEN_MINTS.USDC_DEVNET : TOKEN_MINTS.USDC_MAINNET),
    [network]
  );
  const defaultMint = usdcMintAddress;
  
  // Fetch balances onchain (SOL + network-specific USDC)
  const { solBalance, usdcBalance, solBalanceText, usdcBalanceText } = useWalletBalance(
    pubkey,
    usdcMintAddress
  );
  const solAmountValue = solBalance ?? 0;
  const usdcAmountValue = usdcBalance ?? 0;
  
  // Unified Transfer State
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferToken, setTransferToken] = useState<'SOL' | 'USDC'>('SOL');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [transferSignature, setTransferSignature] = useState<string | null>(null);

  // Airdrop State
  const [airdropAmount, setAirdropAmount] = useState<string>('1');
  const [airdropToken, setAirdropToken] = useState<'SOL' | 'USDC'>('SOL');
  const [airdropError, setAirdropError] = useState<string | null>(null);
  const [airdropSuccess, setAirdropSuccess] = useState<string | null>(null);
  
  // View mode: 'tabs' | 'nft-minting' | 'cnft'
  const [viewMode, setViewMode] = useState<'tabs' | 'nft-minting' | 'cnft'>('tabs');
  
  // Tab state (only used when viewMode === 'tabs')
  const [activeTab, setActiveTab] = useState<string>('transfer');
  
  // NFT Minting state
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [nftMinting, setNftMinting] = useState(false);
  const [nftMinted, setNftMinted] = useState<{
    mintAddress: string;
    name: string;
    description: string;
    signature: string;
  } | null>(null);
  const [nftError, setNftError] = useState<string | null>(null);

  // cNFT Minting state
  const [cnftName, setCnftName] = useState('');
  const [cnftDescription, setCnftDescription] = useState('');
  const [cnftMinting, setCnftMinting] = useState(false);
  const [cnftMinted, setCnftMinted] = useState<{
    assetId: string;
    treeAddress: string;
    name: string;
    description: string;
    signature: string;
  } | null>(null);
  const [cnftError, setCnftError] = useState<string | null>(null);
  
  // Swap state
  const { executeSwap, getQuote, loading: swapLoading, error: swapError } = useJupiterSwap();
  const [swapInputMint, setSwapInputMint] = useState('So11111111111111111111111111111111111111112'); // SOL
  const [swapOutputMint, setSwapOutputMint] = useState('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
  const [swapAmount, setSwapAmount] = useState('');
  const [swapSlippage, setSwapSlippage] = useState(50);
  const [swapQuote, setSwapQuote] = useState<any>(null);
  const [swapLoadingQuote, setSwapLoadingQuote] = useState(false);
  const [swapSignature, setSwapSignature] = useState<string | null>(null);
  const [swapMessage, setSwapMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Local images for 3D Marquee from public/images
  const marqueeImageList = [
    '/images/superteamvn.jpg',
    '/images/lazorkit-logo.png',
    '/images/poster-1.jpg',
    '/images/poster-2.png',
    '/images/poster-3.jpg',
    '/images/solana_superteam_vietnam_logo.jpg',
    '/images/poster-4.jpg',
    '/images/poster-5.jpg',
    '/images/poster-6.jpg',
    '/images/poster-1.jpg',
    '/images/superteamvn.jpg',
    '/images/lazorkit-logo.png',
    '/images/poster-1.jpg',
    '/images/poster-4.jpg',
    '/images/poster-2.png',
    '/images/poster-3.jpg',
    '/images/solana_superteam_vietnam_logo.jpg',
    '/images/poster-5.jpg',
    '/images/poster-6.jpg',
    '/images/poster-3.jpg',
    '/images/superteamvn.jpg',
    '/images/lazorkit-logo.png',
    '/images/poster-1.jpg',
    '/images/poster-2.png',
    '/images/solana_superteam_vietnam_logo.jpg',
    '/images/poster-3.jpg',
    '/images/poster-4.jpg',
    '/images/poster-5.jpg',
  ];


  /**
   * Handles login/registration flow
   *
   * Uses the currently selected network from useNetworkStore.
   * Default network is mainnet, but user can switch to devnet before logging in.
   *
   * @returns Promise that resolves when login completes
   */
  const handleLogin = async () => {
    if (loginLoading) return;
    setLoginLoading(true);
    setLoginError(null);

    try {
      const { walletAddress } = await registerNewWallet();
    } catch (e: any) {
      const errorMessage = e?.message || 'Login failed';
      setLoginError(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  /**
   * Formats error messages to be more user-friendly
   *
   * Parses JSON error responses and extracts meaningful messages.
   * Handles rate limit errors, network errors, and generic errors.
   *
   * @param error - The error object or string to format
   * @returns Formatted error message string
   */
  const formatErrorMessage = (error: any): string => {
    if (!error) return 'An unknown error occurred';
    
    const errorMessage = error?.message || error?.toString() || 'An unknown error occurred';
    
    // Try to parse JSON error responses
    try {
      // Check if error message contains JSON
      const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed?.error?.message) {
          return parsed.error.message;
        }
      }
      
      // Check for rate limit errors
      if (errorMessage.toLowerCase().includes('rate limit')) {
        return 'Rate limit exceeded. The devnet faucet has a limit of 1 SOL per project per day. Please try again later.';
      }
      
      // Check for common error patterns
      if (errorMessage.includes('403')) {
        return 'Request denied. You may have exceeded the rate limit. Please try again later.';
      }
      
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return 'Request timed out. Please check your connection and try again.';
      }
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return 'Network error. Please check your internet connection and try again.';
      }
    } catch {
      // If parsing fails, return the original message
    }
    
    return errorMessage;
  };

  /**
   * Handles airdrop request for SOL or USDC
   *
   * Requests airdrop from Solana devnet faucet.
   * Automatically refreshes balance after successful airdrop.
   *
   * @returns Promise that resolves when airdrop is requested
   * @throws Error if wallet address is missing or airdrop fails
   */
  const handleAirdrop = async () => {
    if (!pubkey) {
      setAirdropError('Wallet not connected');
      return;
    }

    // Only validate amount for SOL airdrop
    if (airdropToken === 'SOL') {
      const amount = parseFloat(airdropAmount);
      if (isNaN(amount) || amount <= 0) {
        setAirdropError('Please enter a valid amount');
        return;
    }
    }

    setAirdropError(null);
    setAirdropSuccess(null);

    try {
      let signature: string;
      if (airdropToken === 'SOL') {
        const amount = parseFloat(airdropAmount);
        signature = await requestSOLAirdrop(pubkey, amount);
        setAirdropSuccess(
          `SOL airdrop requested! ${amount} SOL will arrive shortly.`
        );
      } else {
        // USDC opens Circle Faucet website (no amount needed)
        signature = await requestUSDCAirdrop(pubkey, 1);
        setAirdropSuccess(
          `Circle Faucet opened in new tab. Please complete the USDC request there. Rate limit: 1 USDC every 2 hours per address.`
        );
      }
    } catch (error: any) {
      setAirdropError(formatErrorMessage(error));
    }
  };

  /**
   * Handles unified transfer (SOL / USDC)
   *
   * @throws Error if recipient or amount is invalid
   */
  const handleTransfer = async () => {
    if (!transferRecipient || !transferAmount) {
      setTransferError('Please enter recipient and amount');
      return;
    }

    setTransferLoading(true);
    setTransferError(null);
    setTransferSuccess(null);
    setTransferSignature(null);

    try {
      const amountNumber = parseFloat(transferAmount);
      if (isNaN(amountNumber) || amountNumber <= 0) {
        throw new Error('Invalid amount');
      }

      let signature: string;
      if (transferToken === 'SOL') {
        signature = await transferSOL(transferRecipient, amountNumber);
      } else {
        signature = await transferSPLToken(
          transferRecipient,
          amountNumber,
          defaultMint,
          6
        );
      }
      setTransferSuccess(`Transaction sent! Signature: ${signature.slice(0, 16)}...`);
      setTransferSignature(signature);
      setTransferRecipient('');
      setTransferAmount('');
    } catch (error: any) {
      setTransferError(error?.message || 'Transfer failed');
    } finally {
      setTransferLoading(false);
    }
  };

  /**
   * Handles logout action
   *
   * Logs out user and clears session.
   * Resets network to mainnet for next login.
   * Page will automatically show login form.
   *
   * @returns void - Function does not return a value
   */
  const handleLogout = () => {
    logout();
    setLoginError(null);
    setAirdropError(null);
    setAirdropSuccess(null);
    setTransferError(null);
    setTransferSuccess(null);
    // Reset network to mainnet for next login
    setNetwork('mainnet');
    // No redirect needed - page will show login form automatically
  };

  // NFT Minting Handler
  const handleNftMint = async () => {
    if (!pubkey || !smartWallet) {
      setNftError('Wallet not connected');
      return;
    }

    const validation = validateNftMetadata(nftName, nftDescription);
    if (!validation.valid) {
      setNftError(validation.error || 'Invalid input');
      return;
    }

    setNftMinting(true);
    setNftError(null);
    setNftMinted(null);

    try {
      const connection = getConnection();
      const walletPubkey = new PublicKey(pubkey);

      // Check balance first - NFT minting requires ~0.002 SOL for rent
      const balance = await connection.getBalance(walletPubkey);
      const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
      const requiredBalance = lamports + 100_000; // Add buffer for transaction fees
      
      if (balance < requiredBalance) {
        const requiredSol = requiredBalance / 1_000_000_000;
        const currentSol = balance / 1_000_000_000;
        throw new Error(
          `Insufficient balance: Need ~${requiredSol.toFixed(4)} SOL for rent, but wallet has ${currentSol.toFixed(4)} SOL. ` +
          `Please request an airdrop or transfer SOL to your smart wallet first.`
        );
      }

      // Generate a unique seed for the mint account
      const seed = generateMintId('nft').replace(/-/g, '').slice(0, 32);

      // Derive mint address deterministically from smart wallet + seed
      const mintPubkey = await PublicKey.createWithSeed(
        walletPubkey,
        seed,
        TOKEN_PROGRAM_ID
      );

      // Store metadata on our API first (use mint address as mintId)
      const metadataUri = await storeNftMetadata(mintPubkey.toBase58(), {
        name: nftName.trim(),
        description: nftDescription.trim(),
      });
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPubkey,
        walletPubkey,
        true
      );

      const instructions: TransactionInstruction[] = [];

      instructions.push(
        SystemProgram.createAccountWithSeed({
          fromPubkey: walletPubkey,
          basePubkey: walletPubkey,
          seed,
          newAccountPubkey: mintPubkey,
          lamports,
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      instructions.push(
        createInitializeMintInstruction(
          mintPubkey,
          0,
          walletPubkey,
          walletPubkey
        )
      );

      instructions.push(
        createAssociatedTokenAccountInstruction(
          walletPubkey,
          associatedTokenAddress,
          walletPubkey,
          mintPubkey
        )
      );

      instructions.push(
        createMintToInstruction(
          mintPubkey,
          associatedTokenAddress,
          walletPubkey,
          1,
          []
        )
      );

      const metaplexInstructions = await buildMetaplexInstructions(
        pubkey,
        mintPubkey.toBase58(),
        nftName.trim(),
        metadataUri,
        REGULAR_NFT_SYMBOL
      );

      instructions.push(...metaplexInstructions);
      
      // Add smart wallet to instructions for LazorKit validation
      // Must use smartWallet.smartWallet (PDA), not pubkey (device key)
      if (smartWallet?.smartWallet) {
        addSmartWalletToInstructions(instructions, smartWallet.smartWallet);
      }

      console.log('NFT Mint - Sending transaction:', {
        instructionsCount: instructions.length,
        pubkey,
        smartWallet: smartWallet?.smartWallet,
      });

      const signature = await signAndSendTransaction({
        instructions,
        transactionOptions: {
          computeUnitLimit: 400_000,
        },
      });

      setNftMinted({
        mintAddress: mintPubkey.toBase58(),
        name: nftName.trim(),
        description: nftDescription.trim(),
        signature,
      });

      setNftName('');
      setNftDescription('');
    } catch (err: any) {
      console.error('NFT Minting error:', err);
      const errorMessage = err?.message || String(err);
      setNftError(formatTransactionError(err, 'NFT Minting') || errorMessage);
    } finally {
      setNftMinting(false);
    }
  };

  // cNFT Minting Handler
  const handleCnftMint = async () => {
    if (!pubkey || !smartWallet) {
      setCnftError('Wallet not connected');
      return;
    }

    const validation = validateNftMetadata(cnftName, cnftDescription);
    if (!validation.valid) {
      setCnftError(validation.error || 'Invalid input');
      return;
    }

    setCnftMinting(true);
    setCnftError(null);
    setCnftMinted(null);

    try {
      const mintId = generateMintId('cnft');
      const metadataUri = await storeNftMetadata(mintId, {
        name: cnftName.trim(),
        description: cnftDescription.trim(),
      });

      const instructions = buildCNftMintInstruction(
        pubkey,
        DEMO_MERKLE_TREE,
        cnftName.trim(),
        metadataUri,
        CNFT_SYMBOL
      );

      // Add smart wallet to instructions for LazorKit validation
      // Must use smartWallet.smartWallet (PDA), not pubkey (device key)
      if (smartWallet?.smartWallet) {
        addSmartWalletToInstructions(instructions, smartWallet.smartWallet);
      }

      console.log('cNFT Mint - Sending transaction:', {
        instructionsCount: instructions.length,
        pubkey,
        smartWallet: smartWallet?.smartWallet,
      });

      const signature = await signAndSendTransaction({
        instructions,
        transactionOptions: {
          computeUnitLimit: 400_000,
        },
      });

      const assetId = await extractCNftAssetId(signature);

      setCnftMinted({
        assetId: assetId || 'Unknown',
        treeAddress: DEMO_MERKLE_TREE,
        name: cnftName.trim(),
        description: cnftDescription.trim(),
        signature,
      });

      setCnftName('');
      setCnftDescription('');
    } catch (err: any) {
      console.error('cNFT Minting error:', err);
      const errorMessage = err?.message || String(err);
      setCnftError(formatTransactionError(err, 'cNFT Minting') || errorMessage);
    } finally {
      setCnftMinting(false);
    }
  };

  /**
   * Resets transfer form state to initial values
   *
   * Clears recipient address, amount, and any error/success messages.
   *
   * @returns void - Function does not return a value
   */
  const handleResetTransfer = () => {
    setTransferRecipient('');
    setTransferAmount('');
    setTransferError(null);
    setTransferSuccess(null);
    setTransferSignature(null);
  };

  // Tab items configuration
  // Shared glass styles for fields
  const glassFieldStyle =
    'rounded-[18px] bg-white/5 border border-white/10 shadow-[0_12px_28px_-16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-8px_16px_rgba(0,0,0,0.35)] backdrop-blur-xl text-white placeholder:text-slate-400';
  const glassSelectStyle =
    'relative h-12 w-full rounded-[18px] bg-white/5 border border-white/10 px-4 pr-10 text-base text-white shadow-[0_12px_24px_-16px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-8px_14px_rgba(0,0,0,0.32)] backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-[#7857ff]/50 appearance-none';

  const tabItems: TabItem[] = [
    {
      value: 'transfer',
      label: 'Transfer',
      content: (
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6 md:p-7 space-y-5">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'SOL' as const, label: 'SOL', balance: solBalanceText },
                  { value: 'USDC' as const, label: 'USDC', balance: usdcBalanceText || 'Balance —' },
                ].map((item) => {
                  const active = transferToken === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setTransferToken(item.value);
                        setTransferAmount('');
                      }}
                      className={`flex-1 min-w-[160px] rounded-2xl border px-4 py-3 flex items-center justify-between transition-colors backdrop-blur-2xl shadow-[0_18px_42px_-22px_rgba(0,0,0,0.75),inset_0_-10px_18px_rgba(0,0,0,0.35)] ${
                        active
                          ? 'border-white/30 bg-white/12 shadow-[0_18px_42px_-20px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.18),inset_0_-10px_18px_rgba(0,0,0,0.35)]'
                          : 'border-white/10 bg-white/4 hover:bg-white/8'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-base font-semibold text-white">{item.label}</span>
                        <span className="text-xs text-slate-400">{item.balance}</span>
                      </div>
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/40">
                      {active && <span className="block h-2.5 w-2.5 rounded-full bg-white" />}
                    </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300/90">
                  Recipient Address
                </Label>
                <div className="rounded-2xl border-[2px] border-white/10 bg-white/5 shadow-[0_18px_42px_-22px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-12px_20px_rgba(0,0,0,0.35)] backdrop-blur-2xl px-4 py-3">
                  <div className="relative">
                  <Input
                    type="text"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    placeholder="Enter recipient address"
                      className="w-full border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-slate-500 pr-10"
                  />
                  <button
                    type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setTransferRecipient(text);
                        setTransferError(null);
                      } catch {
                        setTransferError('Clipboard unavailable');
                      }
                    }}
                  >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="stroke-current"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                  >
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      </svg>
                  </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300/90">
                  Amount ({transferToken})
                </Label>
                <div className="rounded-2xl border-[2px] border-white/10 bg-white/5 shadow-[0_18px_42px_-22px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-12px_20px_rgba(0,0,0,0.35)] backdrop-blur-2xl px-4 py-3 space-y-1.5">
                  <div className="flex justify-center">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="Enter Amount"
                      className="w-full text-center border-0 bg-transparent focus-visible:ring-0 text-2xl font-semibold placeholder:text-slate-500"
                    />
                  </div>
                  <div className="text-center text-xs text-slate-400">≈ $0.00</div>
                  <div className="flex justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const balance = transferToken === 'SOL' ? solAmountValue : usdcAmountValue;
                        setTransferAmount((balance / 2).toString());
                      }}
                      className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-xs text-slate-200 hover:bg-white/10 transition"
                    >
                      Half
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTransferAmount(
                          transferToken === 'SOL' ? solAmountValue.toString() : usdcAmountValue.toString()
                        )
                      }
                      className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-xs text-slate-200 hover:bg-white/10 transition"
                    >
                      Max
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleResetTransfer}
                className="h-12 flex-1 border-white/15 text-white hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={transferLoading || !transferRecipient || !transferAmount}
                className="h-12 flex-1 text-base"
              >
                {transferLoading ? (
                  <span>Sending...</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Next</span>
                    <span className="text-base">→</span>
                  </div>
                )}
              </Button>
            </div>

            {transferError && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription className="text-red-200 text-sm">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="flex-1">{formatErrorMessage(transferError)}</span>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {transferSuccess && (
              <Alert className="mt-2">
                <AlertDescription className="text-green-400/90 text-sm">
                  <div className="space-y-2">
                    <p>{transferSuccess}</p>
                    {transferSignature && (
                      <a
                        href={`https://solscan.io/tx/${transferSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-200 underline text-xs"
                      >
                        View on Solscan →
                      </a>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-blue-200 text-xs shadow-[0_12px_28px_-16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
              🎉 Gasless transaction! You saved on gas fees thanks to Lazorkit!
            </div>
          </Card>
        </div>
      ),
    },
    {
      value: 'airdrop',
      label: 'Airdrop',
      disabled: network !== 'devnet',
      content: (
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6 md:p-7 space-y-5">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-white">Devnet Airdrop</h3>
              <p className="text-sm text-slate-300/80">Request SOL or USDC from devnet faucet</p>
              </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'SOL' as const, label: 'SOL', balance: solBalanceText },
                  { value: 'USDC' as const, label: 'USDC', balance: usdcBalanceText || 'Balance —' },
                ].map((item) => {
                  const active = airdropToken === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setAirdropToken(item.value);
                        setAirdropError(null);
                        setAirdropSuccess(null);
                      }}
                      className={`flex-1 min-w-[160px] rounded-2xl border px-4 py-3 flex items-center justify-between transition-colors backdrop-blur-2xl shadow-[0_18px_42px_-22px_rgba(0,0,0,0.75),inset_0_-10px_18px_rgba(0,0,0,0.35)] ${
                        active
                          ? 'border-white/30 bg-white/12 shadow-[0_18px_42px_-20px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.18),inset_0_-10px_18px_rgba(0,0,0,0.35)]'
                          : 'border-white/10 bg-white/4 hover:bg-white/8'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-base font-semibold text-white">{item.label}</span>
                        <span className="text-xs text-slate-400">{item.balance}</span>
                      </div>
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/40">
                      {active && <span className="block h-2.5 w-2.5 rounded-full bg-white" />}
                    </span>
                    </button>
                  );
                })}
            </div>

              {airdropToken === 'SOL' && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300/90">
                    Amount (SOL)
                  </Label>
                  <div className="rounded-2xl border-[2px] border-white/10 bg-white/5 shadow-[0_18px_42px_-22px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-12px_20px_rgba(0,0,0,0.35)] backdrop-blur-2xl px-4 py-3 space-y-1.5">
                    <div className="flex justify-center">
              <Input
                        type="number"
                        inputMode="decimal"
                        value={airdropAmount}
                        onChange={(e) => setAirdropAmount(e.target.value)}
                        placeholder="Enter SOL amount"
                        step="0.1"
                        min="0"
                        className="w-full text-center border-0 bg-transparent focus-visible:ring-0 text-2xl font-semibold placeholder:text-slate-500"
                      />
            </div>
                    <div className="text-center text-xs text-slate-400">
                      Recommended: 1-2 SOL
                      </div>
                    <div className="flex justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setAirdropAmount('1')}
                        className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-xs text-slate-200 hover:bg-white/10 transition"
                      >
                        1 SOL
                      </button>
                      <button
                        type="button"
                        onClick={() => setAirdropAmount('2')}
                        className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-xs text-slate-200 hover:bg-white/10 transition"
                      >
                        2 SOL
                      </button>
                    </div>
                </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleAirdrop}
                  disabled={
                    network !== 'devnet' ||
                    airdropLoading ||
                    (airdropToken === 'SOL' && !airdropAmount) ||
                    !pubkey
                  }
                  className="h-12 flex-1 text-base"
                >
                  {airdropLoading ? (
                    <span>Requesting...</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{airdropToken === 'SOL' ? 'Request Airdrop' : 'Open Circle Faucet'}</span>
                      <span className="text-base">✨</span>
                    </div>
                  )}
                </Button>
              </div>

              {airdropError && (
                <Alert variant="destructive" className="mt-2">
                <AlertDescription className="text-red-200 text-sm">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="flex-1">{formatErrorMessage(airdropError)}</span>
                      </div>
                      {airdropToken === 'SOL' && (
                        <a
                          href="https://faucet.solana.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors group"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          <span className="text-xs underline group-hover:no-underline">
                            Explore Solana Faucet
                          </span>
                        </a>
                      )}
                    </div>
                </AlertDescription>
              </Alert>
            )}

              {airdropSuccess && (
                <Alert className="mt-2">
                  <AlertDescription className="text-green-400/90 text-sm">
                    {airdropSuccess}
                </AlertDescription>
              </Alert>
            )}

              <div className="mt-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-blue-200 text-xs shadow-[0_12px_28px_-16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
                <div className="space-y-2">
                  <p>
                💡 {airdropToken === 'SOL' 
                  ? 'SOL airdrop requests tokens directly from Solana devnet faucet. Tokens will arrive in a few seconds.'
                  : 'USDC airdrop opens Circle Faucet website in a new tab. You can request 1 USDC every 2 hours per address. Complete the request on the Circle Faucet page.'}
                  </p>
                  {airdropToken === 'SOL' && (
                    <a
                      href="https://faucet.solana.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors group mt-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      <span className="text-xs underline group-hover:no-underline">
                        Explore Solana Faucet
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      value: 'swap',
      label: 'Swap',
      content: (
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6 md:p-7 space-y-5">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-white">Jupiter Swap</h3>
              <p className="text-sm text-slate-300/80">Swap tokens on Jupiter DEX without gas fees</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'So11111111111111111111111111111111111111112' as const, label: 'SOL', balance: solBalanceText },
                  { value: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as const, label: 'USDC', balance: usdcBalanceText || '0' },
                ].map((item) => {
                  const active = swapInputMint === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setSwapInputMint(item.value);
                        setSwapAmount('');
                        setSwapQuote(null);
                      }}
                      className={`flex-1 min-w-[160px] rounded-2xl border px-4 py-3 flex items-center justify-between transition-colors backdrop-blur-2xl shadow-[0_18px_42px_-22px_rgba(0,0,0,0.75),inset_0_-10px_18px_rgba(0,0,0,0.35)] ${
                        active
                          ? 'border-white/30 bg-white/12 shadow-[0_18px_42px_-20px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.18),inset_0_-10px_18px_rgba(0,0,0,0.35)]'
                          : 'border-white/10 bg-white/4 hover:bg-white/8'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-base font-semibold text-white">{item.label}</span>
                        <span className="text-xs text-slate-400">{item.balance}</span>
                      </div>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/40">
                        {active && <span className="block h-2.5 w-2.5 rounded-full bg-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300/90">
                  Amount
                </Label>
                <div className="rounded-2xl border-[2px] border-white/10 bg-white/5 shadow-[0_18px_42px_-22px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-12px_20px_rgba(0,0,0,0.35)] backdrop-blur-2xl px-4 py-3">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full text-center border-0 bg-transparent focus-visible:ring-0 text-2xl font-semibold placeholder:text-slate-500"
                  />
                </div>
              </div>

              {swapQuote && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-sm text-gray-400 mb-2">You will receive:</div>
                  <div className="text-2xl font-bold text-white">
                    {swapInputMint === 'So11111111111111111111111111111111111111112' 
                      ? (parseFloat(swapQuote.outAmount) / Math.pow(10, 6)).toFixed(4) + ' USDC'
                      : (parseFloat(swapQuote.outAmount) / Math.pow(10, 9)).toFixed(4) + ' SOL'}
                  </div>
                  {swapQuote.priceImpactPct && (
                    <div className="text-xs text-gray-400 mt-1">
                      Price impact: {parseFloat(swapQuote.priceImpactPct).toFixed(2)}%
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={async () => {
                    if (!swapAmount || parseFloat(swapAmount) <= 0) {
                      setSwapMessage({ type: 'error', text: 'Please enter a valid amount' });
                      return;
                    }
                    setSwapLoadingQuote(true);
                    setSwapMessage(null);
                    try {
                      const quote = await getQuote({
                        inputMint: swapInputMint,
                        outputMint: swapOutputMint,
                        amount: parseFloat(swapAmount),
                        slippageBps: swapSlippage,
                      });
                      setSwapQuote(quote);
                      setSwapMessage({ type: 'success', text: 'Quote retrieved successfully' });
                    } catch (err) {
                      console.error('Get Quote error:', err);
                      setSwapMessage({ type: 'error', text: formatTransactionError(err, 'Get Quote') || 'Failed to get quote. Please try again.' });
                    } finally {
                      setSwapLoadingQuote(false);
                    }
                  }}
                  disabled={swapLoadingQuote || !swapAmount}
                  variant="outline"
                  className="h-12 flex-1 border-white/15 text-white hover:text-white"
                >
                  {swapLoadingQuote ? 'Getting Quote...' : 'Get Quote'}
                </Button>
                <Button
                  onClick={async () => {
                    if (!swapAmount || parseFloat(swapAmount) <= 0) {
                      setSwapMessage({ type: 'error', text: 'Please enter a valid amount' });
                      return;
                    }
                    setSwapMessage(null);
                    try {
                      const signature = await executeSwap({
                        inputMint: swapInputMint,
                        outputMint: swapOutputMint,
                        amount: parseFloat(swapAmount),
                        slippageBps: swapSlippage,
                      });
                      setSwapSignature(signature);
                      setSwapMessage({ type: 'success', text: `Swap successful! Transaction: ${signature.slice(0, 20)}...` });
                      setSwapAmount('');
                      setSwapQuote(null);
                    } catch (err) {
                      console.error('Swap error:', err);
                      setSwapMessage({ type: 'error', text: formatTransactionError(err, 'Swap') || 'Swap failed. Please try again.' });
                    }
                  }}
                  disabled={swapLoading || !swapAmount}
                  className="h-12 flex-1 text-base"
                >
                  {swapLoading ? 'Swapping...' : 'Swap (Gasless)'}
                </Button>
              </div>

              {swapMessage && (
                <Alert variant={swapMessage.type === 'error' ? 'destructive' : 'default'} className="mt-2">
                  <AlertDescription className={swapMessage.type === 'error' ? 'text-red-200 text-sm' : 'text-green-200 text-sm'}>
                    {swapMessage.text}
                  </AlertDescription>
                </Alert>
              )}
              {swapError && !swapMessage && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription className="text-red-200 text-sm">
                    {formatTransactionError(swapError, 'Swap')}
                  </AlertDescription>
                </Alert>
              )}

              {swapSignature && (
                <Alert className="mt-2">
                  <AlertDescription className="text-green-400/90 text-sm">
                    <a
                      href={`https://explorer.solana.com/tx/${swapSignature}?cluster=${network === 'devnet' ? 'devnet' : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200 underline text-xs"
                    >
                      View on Explorer →
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        </div>
      ),
    },
  ];

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400">Loading...</p>
            </div>
    );
  }

  // Show login form if not logged in - use same dashboard layout, just hide content
  if (!isLoggedIn || !pubkey) {
    return (
      <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute top-[-15%] left-[-10%] w-[520px] h-[520px] bg-[#7857ff]/15 rounded-full blur-[140px]" />
        <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] w-[620px] h-[620px] bg-blue-600/12 rounded-full blur-[150px]" />
        {/* Noise overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-soft-light"
          style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
        />
        
        {/* 3D Marquee Background - Left Half (Desktop) - Same as logged in state */}
        <div className="fixed left-0 top-0 w-1/2 h-full z-0 hidden lg:block">
          {/* Gradient overlays for blending */}
          <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-black to-transparent z-10" />
          <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-black to-transparent z-10" />
          
          {/* 3D Marquee */}
          <div className="w-full h-full">
            <ThreeDMarquee 
              images={marqueeImageList} 
              className="rounded-none"
              height="100vh"
              />
          </div>
        </div>

        {/* Code Example Card - Overlay on Marquee (Left Side) - Centered */}
        <div className="fixed left-0 top-0 w-1/2 h-full z-10 hidden lg:block pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] pointer-events-auto">
            <CodeExampleCard
              title={codeExamples.login.title}
              description={codeExamples.login.description}
              code={codeExamples.login.code}
              />
          </div>
        </div>

        {/* Content - Right Half - Login Form */}
        <div className="relative z-20 lg:ml-[50%] min-h-screen">
          <div className="p-4 md:p-8 max-w-4xl mx-auto lg:mx-0 lg:ml-8 min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md">
                <Card className="w-full bg-gray-900/95 border-gray-800 backdrop-blur-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-5xl font-extrabold mb-2">
                  <span className="text-white">Lazor</span>
                  <span className="text-[#7857ff]">Starter</span>
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Universal Lazorkit SDK Starter
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Network selector */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400">Network</span>
                  <div className="inline-flex rounded-full bg-gray-800/70 p-1 border border-gray-700/70">
                    <button
                      type="button"
                      onClick={() => setNetwork('mainnet')}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        network === 'mainnet'
                          ? 'bg-white text-black font-semibold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      MAINNET
                    </button>
                    <button
                      type="button"
                      onClick={() => setNetwork('devnet')}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        network === 'devnet'
                          ? 'bg-[#7857ff] text-white font-semibold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      DEVNET
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={loginLoading}
                  className="w-full bg-[#7857ff] hover:bg-[#7857ff]/90"
                  size="lg"
                >
                  {loginLoading ? 'Connecting...' : 'Login with Passkey'}
                </Button>

                {loginError && (
                  <Alert variant="destructive" className="bg-red-900/50 border-red-500">
                    <AlertDescription className="text-red-200 text-sm">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="flex-1">{formatErrorMessage(loginError)}</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {!loginError && (
                  <p className="text-gray-500 text-xs text-center">
                    Click to create your wallet with Face ID / Touch ID
                  </p>
                )}
              </CardContent>
          </Card>
            </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute top-[-15%] left-[-10%] w-[520px] h-[520px] bg-[#7857ff]/15 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] w-[620px] h-[620px] bg-blue-600/12 rounded-full blur-[150px]" />
      {/* Noise overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-soft-light"
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
      />
      {/* Logout Icon over marquee (desktop) */}
      <button
        onClick={handleLogout}
        className="absolute top-6 left-6 z-30 hidden lg:inline-flex rounded-full p-3 bg-black/70 border border-white/25 hover:bg-black/85 transition"
        title="Logout"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
          />
        </svg>
      </button>
      {/* 3D Marquee Background - Left Half (Desktop) */}
      <div className="fixed left-0 top-0 w-1/2 h-full z-0 hidden lg:block">
        {/* Gradient overlays for blending */}
        <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-black to-transparent z-10" />
        
        {/* 3D Marquee */}
        <div className="w-full h-full">
          <ThreeDMarquee 
            images={marqueeImageList} 
            className="rounded-none"
            height="100vh"
          />
        </div>
      </div>

      {/* Code Example Card - Overlay on Marquee (Left Side) - Centered */}
      <div className="fixed left-0 top-0 w-1/2 h-full z-10 hidden lg:block pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] pointer-events-auto">
          {viewMode === 'nft-minting' && (
            <CodeExampleCard
              title={codeExamples.nftMinting.title}
              description={codeExamples.nftMinting.description}
              code={codeExamples.nftMinting.code}
            />
          )}
          {viewMode === 'cnft' && (
            <CodeExampleCard
              title={codeExamples.cnftMinting.title}
              description={codeExamples.cnftMinting.description}
              code={codeExamples.cnftMinting.code}
            />
          )}
          {viewMode === 'tabs' && activeTab === 'transfer' && (
            <CodeExampleCard
              title={codeExamples.transfer.title}
              description={codeExamples.transfer.description}
              code={codeExamples.transfer.code}
            />
          )}
          {viewMode === 'tabs' && activeTab === 'airdrop' && (
            <CodeExampleCard
              title={codeExamples.airdrop.title}
              description={codeExamples.airdrop.description}
              code={codeExamples.airdrop.code}
            />
          )}
          {viewMode === 'tabs' && activeTab === 'swap' && (
            <CodeExampleCard
              title={codeExamples.swap.title}
              description={codeExamples.swap.description}
              code={codeExamples.swap.code}
            />
          )}
          {viewMode === 'tabs' && !activeTab && (
            <CodeExampleCard
              title={codeExamples.transfer.title}
              description={codeExamples.transfer.description}
              code={codeExamples.transfer.code}
            />
          )}
        </div>
      </div>

      {/* Content - Right Half */}
      <div className="relative z-20 lg:ml-[50%] min-h-screen">
        <div className="p-4 md:p-8 max-w-4xl mx-auto lg:mx-0 lg:ml-8">
          <div className="space-y-6">
              {/* Wallet Banner + NFT Cards (only show in tabs mode) */}
              {viewMode === 'tabs' && (
          <div className="flex flex-col lg:flex-row items-start lg:items-stretch gap-4">
            <WalletBanner
              walletAddress={pubkey}
              solBalance={solBalance}
              usdcBalance={usdcBalance}
              solBalanceText={solBalanceText}
              usdcBalanceText={usdcBalanceText}
                  className="w-full lg:flex-[2]"
              onExploreClick={() => {
                const cluster = network === 'devnet' ? '?cluster=devnet' : '';
                window.open(
                  `https://explorer.solana.com/address/${pubkey}${cluster}`,
                  '_blank'
                );
              }}
            />
            <div className="flex w-full gap-2 lg:flex-col lg:w-56 lg:flex-[1] lg:justify-between">
              <Card
                    role="link"
                tabIndex={0}
                    className="relative w-full flex-1 lg:flex-[3] lg:h-44 overflow-hidden cursor-pointer border-white/10 bg-transparent shadow-none p-0 rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7857ff]/60"
                    onClick={() => setViewMode('nft-minting')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20" />
                <div className="relative z-10 flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎨</div>
                        <span className="text-white font-semibold text-lg lg:text-xl">NFT Minting</span>
                      </div>
                </div>
              </Card>
              <Card
                role="link"
                tabIndex={0}
                className="relative w-full flex-1 lg:flex-[1] lg:h-12 overflow-hidden cursor-pointer border-white/10 bg-transparent shadow-none p-0 rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7857ff]/60"
                    onClick={() => setViewMode('cnft')}
              >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20" />
                <div className="relative z-10 flex h-full items-center justify-center">
                      <span className="text-white font-semibold text-lg">cNFT</span>
                </div>
              </Card>
            </div>
          </div>
              )}

              {/* Conditional Content: Tabs or NFT Forms */}
              {viewMode === 'tabs' && (
            <Tabs 
                  items={tabItems.filter(item => !item.disabled)} 
              value={activeTab}
              onValueChange={setActiveTab}
            />
              )}

              {/* NFT Minting Form */}
              {viewMode === 'nft-minting' && (
                <Card className="p-6 md:p-7 space-y-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">NFT Minting</h2>
                    <Button
                      variant="outline"
                      onClick={() => setViewMode('tabs')}
                      className="text-sm"
                    >
                      ← Back to Dashboard
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300/90">
                        NFT Name
                      </Label>
                      <div className="rounded-2xl border-[2px] border-white/10 bg-white/5 shadow-[0_18px_42px_-22px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-12px_20px_rgba(0,0,0,0.35)] backdrop-blur-2xl px-4 py-3">
                        <Input
                          type="text"
                          value={nftName}
                          onChange={(e) => setNftName(e.target.value)}
                          placeholder="My NFT"
                          className="w-full border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-slate-500"
                          maxLength={32}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300/90">
                        Description
                      </Label>
                      <div className="rounded-2xl border-[2px] border-white/10 bg-white/5 shadow-[0_18px_42px_-22px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-12px_20px_rgba(0,0,0,0.35)] backdrop-blur-2xl px-4 py-3">
                        <textarea
                          value={nftDescription}
                          onChange={(e) => setNftDescription(e.target.value)}
                          placeholder="Describe your NFT..."
                          className="w-full border-0 bg-transparent focus-visible:ring-0 text-base text-white placeholder:text-slate-500 min-h-[100px] resize-none"
                          maxLength={200}
                        />
                      </div>
                    </div>

                    {nftError && (
                      <Alert variant="destructive" className="bg-red-900/50 border-red-500">
                        <AlertDescription className="text-red-200 text-sm">
                          {nftError}
                        </AlertDescription>
                      </Alert>
                    )}

                    {nftMinted && (
                      <Alert className="bg-green-900/50 border-green-500">
                        <AlertDescription className="text-green-200 text-sm">
                          <div className="space-y-2">
                            <p className="font-semibold">NFT Minted Successfully!</p>
                            <p>Mint Address: <code className="text-xs">{nftMinted.mintAddress}</code></p>
                            <p>Name: {nftMinted.name}</p>
                            <p>Description: {nftMinted.description}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const cluster = network === 'devnet' ? '?cluster=devnet' : '';
                                window.open(
                                  `https://explorer.solana.com/tx/${nftMinted.signature}${cluster}`,
                                  '_blank'
                                );
                              }}
                              className="mt-2"
                            >
                              View Transaction
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleNftMint}
                      disabled={nftMinting || !nftName || !nftDescription}
                      className="w-full h-12 text-base"
                    >
                      {nftMinting ? 'Minting...' : 'Mint NFT'}
                    </Button>
                  </div>
                </Card>
              )}

              {/* cNFT Minting Form */}
              {viewMode === 'cnft' && (
                <Card className="p-6 md:p-7 space-y-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Compressed NFT</h2>
                    <Button
                      variant="outline"
                      onClick={() => setViewMode('tabs')}
                      className="text-sm"
                    >
                      ← Back to Dashboard
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300/90">
                        NFT Name
                      </Label>
                      <div className="rounded-2xl border-[2px] border-white/10 bg-white/5 shadow-[0_18px_42px_-22px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-12px_20px_rgba(0,0,0,0.35)] backdrop-blur-2xl px-4 py-3">
                        <Input
                          type="text"
                          value={cnftName}
                          onChange={(e) => setCnftName(e.target.value)}
                          placeholder="My Compressed NFT"
                          className="w-full border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-slate-500"
                          maxLength={32}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300/90">
                        Description
                      </Label>
                      <div className="rounded-2xl border-[2px] border-white/10 bg-white/5 shadow-[0_18px_42px_-22px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-12px_20px_rgba(0,0,0,0.35)] backdrop-blur-2xl px-4 py-3">
                        <textarea
                          value={cnftDescription}
                          onChange={(e) => setCnftDescription(e.target.value)}
                          placeholder="Describe your compressed NFT..."
                          className="w-full border-0 bg-transparent focus-visible:ring-0 text-base text-white placeholder:text-slate-500 min-h-[100px] resize-none"
                          maxLength={200}
                        />
                      </div>
                    </div>

                    {cnftError && (
                      <Alert variant="destructive" className="bg-red-900/50 border-red-500">
                        <AlertDescription className="text-red-200 text-sm">
                          {cnftError}
                        </AlertDescription>
                      </Alert>
                    )}

                    {cnftMinted && (
                      <Alert className="bg-green-900/50 border-green-500">
                        <AlertDescription className="text-green-200 text-sm">
                          <div className="space-y-2">
                            <p className="font-semibold">Compressed NFT Minted Successfully!</p>
                            <p>Asset ID: <code className="text-xs">{cnftMinted.assetId}</code></p>
                            <p>Tree Address: <code className="text-xs">{cnftMinted.treeAddress}</code></p>
                            <p>Name: {cnftMinted.name}</p>
                            <p>Description: {cnftMinted.description}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const cluster = network === 'devnet' ? '?cluster=devnet' : '';
                                window.open(
                                  `https://explorer.solana.com/tx/${cnftMinted.signature}${cluster}`,
                                  '_blank'
                                );
                              }}
                              className="mt-2"
                            >
                              View Transaction
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleCnftMint}
                      disabled={cnftMinting || !cnftName || !cnftDescription}
                      className="w-full h-12 text-base"
                    >
                      {cnftMinting ? 'Minting...' : 'Mint Compressed NFT'}
                    </Button>
                  </div>
                </Card>
            )}
          </div>

          {/* Mobile: Marquee at bottom in flow, reduced height */}
          <div className="lg:hidden relative w-full h-28">
            {/* Mobile Logout Icon (right aligned) */}
            <div className="absolute top-2 right-2 z-30 flex items-center gap-2">
            <button
              onClick={handleLogout}
                className="rounded-full p-3 bg-black/70 border border-white/25 hover:bg-black/85 transition"
              title="Logout"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                />
              </svg>
            </button>
            </div>
            <div className="absolute inset-0">
              <div className="absolute left-0 top-0 w-10 h-full bg-gradient-to-r from-black to-transparent z-10" />
              <div className="absolute right-0 top-0 w-10 h-full bg-gradient-to-l from-black to-transparent z-10" />
              <ThreeDMarquee 
                images={marqueeImageList} 
                className="rounded-none"
                height="112px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
