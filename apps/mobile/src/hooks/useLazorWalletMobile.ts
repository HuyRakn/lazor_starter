/**
 * Mobile-specific wallet hook wrapper
 * 
 * This hook provides a compatibility layer for the mobile app to use
 * the Lazorkit mobile adapter's useWallet hook.
 * 
 * @returns Lazorkit mobile wallet SDK instance
 * @deprecated Use useWallet from @lazorkit/wallet-mobile-adapter directly
 */
export { useWallet as useLazorWalletMobile } from '@lazorkit/wallet-mobile-adapter';
