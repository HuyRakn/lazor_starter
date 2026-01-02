/**
 * @lazor-starter/core - Shared Lazorkit SDK integration package for monorepo
 *
 * This package provides universal hooks, providers, and utilities that work
 * across both Web (Next.js) and Mobile (Expo/React Native) apps in the monorepo.
 *
 * Usage in monorepo apps:
 *   import { WalletProvider, useAuth } from '@lazor-starter/core';
 */

// Providers
export { WalletProvider } from './providers/WalletProvider';

// State
export { useNetworkStore } from './state/networkStore';
export type { Network } from './state/networkStore';

// Hooks
export { useWallet } from './hooks/useWallet';
export { useAuth } from './hooks/useAuth';
export { useGaslessTx } from './hooks/useGaslessTx';
export { useWalletBalance } from './hooks/useWalletBalance';
export { useAirdrop } from './hooks/useAirdrop';
export { useSmartWallet } from './hooks/useSmartWallet';
export { useJupiterSwap } from './hooks/useJupiterSwap';
export type { SmartWallet, UseSmartWalletReturn } from './hooks/useSmartWallet';
export type { SwapParams, SwapQuote, UseJupiterSwapReturn } from './hooks/useJupiterSwap';

// Utils
export { getStorage, initMobileStorage } from './utils/storage';
export { formatAddress, truncateAddress, formatBalance } from './utils/format';
export { validateAddress, isValidPublicKey, getExplorerUrl } from './utils/validation';
export { getUserPrivateKey, saveUserPrivateKey, removeUserPrivateKey, hasUserPrivateKey } from './utils/privateKey';
export { 
  getConnection, 
  getSolBalance, 
  getUsdcBalance, 
  getBalances,
  getAssociatedTokenAddressSync,
  getAssociatedTokenAddress, // Alias for backward compatibility
  formatTransactionError,
  parseTransactionError,
  shortenAddress,
  validateRecipientAddress,
  validateTransferAmount,
  createTransferSuccessMessage,
  buildUsdcTransferInstructions,
  withRetry,
} from './utils/solana';
export {
  validateNftMetadata,
  generateMintId,
  addSmartWalletToInstructions,
  buildRegularNftMintInstructions,
  NFT_NAME_MAX_LENGTH,
  NFT_DESCRIPTION_MAX_LENGTH,
} from './utils/nft';
export type { NftMetadata, MintedRegularNft, MintedCNft } from './utils/nft';
export { TOKEN_MINTS } from './constants/tokens';
export type { TokenMintKey } from './constants/tokens';

// Types
export type {
  PasskeyData,
  WalletState,
  GaslessTxOptions,
} from './types';
export { LazorError } from './types/errors';

