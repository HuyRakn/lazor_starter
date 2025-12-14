/**
 * @lazor-starter/core - Shared Lazorkit SDK integration package for monorepo
 *
 * This package provides universal hooks, providers, and utilities that work
 * across both Web (Next.js) and Mobile (Expo/React Native) apps in the monorepo.
 *
 * Usage in monorepo apps:
 *   import { LazorProvider, useLazorAuth } from '@lazor-starter/core';
 */

// Providers
export { LazorProvider } from './providers/LazorProvider';

// Hooks
export { useLazorWallet } from './hooks/useLazorWallet';
export { useLazorAuth } from './hooks/useLazorAuth';
export { useGaslessTx } from './hooks/useGaslessTx';
export { useWalletBalance } from './hooks/useWalletBalance';
export { useAirdrop } from './hooks/useAirdrop';

// Utils
export { getStorage, initMobileStorage } from './utils/storage';
export { formatAddress, truncateAddress, formatBalance } from './utils/format';
export { validateAddress, isValidPublicKey, getExplorerUrl } from './utils/validation';
export { getUserPrivateKey, saveUserPrivateKey, removeUserPrivateKey, hasUserPrivateKey } from './utils/privateKey';
export { TOKEN_MINTS } from './constants/tokens';
export type { TokenMintKey } from './constants/tokens';

// Types
export type {
  PasskeyData,
  WalletState,
  GaslessTxOptions,
} from './types';
export { LazorError } from './types/errors';

