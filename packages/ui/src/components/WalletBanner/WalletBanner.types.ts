/**
 * Wallet Banner component props
 */
export interface WalletBannerProps {
  /**
   * Wallet public key address
   */
  walletAddress: string;
  /**
   * Optional wallet balance in SOL
   */
  solBalance?: number;
  /**
   * Optional wallet balance text (exact, no rounding)
   */
  solBalanceText?: string;
  /**
   * Optional wallet balance in USDC
   */
  usdcBalance?: number;
  /**
   * Optional wallet balance text (exact, no rounding)
   */
  usdcBalanceText?: string;
  /**
   * Optional className for container
   */
  className?: string;
  /**
   * Callback when explore icon is clicked
   */
  onExploreClick?: () => void;
}

