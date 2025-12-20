'use client';

import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { Copy, ExternalLink, Wifi } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import type { WalletBannerProps } from './WalletBanner.types';

// Reuse the same banner artwork as web version so both platforms share a single source.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const walletBannerImage = require('../../../../../apps/web/public/images/wallet-banner.jpg');

/**
 * Formats wallet address for display
 * 
 * @param address - Full wallet address
 * @returns Formatted address (first 6 + ... + last 4)
 */
function formatWalletAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats balance for display with thousand separators
 * 
 * @param balance - Balance amount
 * @param decimals - Number of decimal places
 * @returns Formatted balance string
 */
function formatBalance(balance: number | undefined, decimals: number = 2): string {
  if (balance === undefined || balance === null) return '0.00';
  return balance.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Wallet Banner Component (Native)
 * 
 * Displays wallet information in a card visa-style design matching the design mockup.
 * Shows wallet address, SOL balance, and USDC balance.
 * Responsive design: single column on mobile, multi-column on desktop.
 * 
 * @param props - Component configuration
 * @param props.walletAddress - Wallet public key address
 * @param props.solBalance - Optional SOL balance
 * @param props.usdcBalance - Optional USDC balance
 * @param props.className - Optional className for container (not used in native)
 * @param props.onExploreClick - Callback when explore icon is clicked
 * @returns Wallet banner card component
 */
export function WalletBanner({
  walletAddress,
  solBalance,
  solBalanceText,
  usdcBalance,
  usdcBalanceText,
  onExploreClick,
  network = 'mainnet',
}: WalletBannerProps) {
  const formattedAddress = formatWalletAddress(walletAddress);

  /**
   * Matches web behavior: prefer *_Text strings (exact on-chain values),
   * and fall back to numeric balances when strings are not provided.
   */
  const resolveBalanceString = (
    textValue?: string,
    numericValue?: number,
    decimals: number = 2,
  ): string => {
    if (textValue && textValue.trim().length > 0) {
      const [intPart, decPart] = textValue.split('.');
      const withSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return decPart ? `${withSeparators}.${decPart}` : withSeparators;
    }
    return formatBalance(numericValue, decimals);
  };

  const formattedSolBalance = resolveBalanceString(solBalanceText, solBalance, 8);
  const formattedUsdcBalance = resolveBalanceString(usdcBalanceText, usdcBalance, 2);

  return (
    <ImageBackground
      source={walletBannerImage}
      style={styles.container}
      imageStyle={styles.imageBackground}
    >
      {/* Content */}
      <View style={styles.content}>
        {/* Top Section */}
        <View style={styles.topSection}>
          {/* Left Side */}
          <View style={styles.leftTop}>
            <Text style={styles.walletLabel}>WALLET</Text>
            <View style={styles.addressRow}>
              <Text style={styles.addressText} numberOfLines={1}>
                {formattedAddress}
              </Text>
              {/* Copy Icon */}
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await Clipboard.setStringAsync(walletAddress);
                  } catch (error) {
                    console.error('Failed to copy address:', error);
                  }
                }}
                style={styles.iconButton}
              >
                <Copy size={16} color="#E5E7EB" />
              </TouchableOpacity>
              {/* Explore Icon */}
              <TouchableOpacity onPress={onExploreClick} style={styles.iconButton}>
                <ExternalLink size={16} color="#E5E7EB" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Right Side - LazorKit Logo */}
          <Text style={styles.lazorkitLogo}>LazorKit</Text>
        </View>

        {/* Balance Section - single column on mobile (like compact web version) */}
        <View style={styles.balanceContainer}>
          {/* SOL Balance */}
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>SOL BALANCE</Text>
            <Text style={styles.balanceValue}>
              {formattedSolBalance}
              <Text style={styles.balanceUnit}> SOL</Text>
            </Text>
          </View>

          {/* USDC Balance */}
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>USDC BALANCE</Text>
            <Text style={styles.balanceValue}>
              {formattedUsdcBalance}
              <Text style={styles.balanceUnit}> USDC</Text>
            </Text>
          </View>
        </View>

        {/* Network Indicator - Bottom Right */}
        <View style={styles.networkIndicator}>
          <Wifi size={12} color="#22C55E" />
          <Text style={styles.networkText}>
            {network === 'devnet' ? 'Devnet' : 'Mainnet'}
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  imageBackground: {
    borderRadius: 16,
    resizeMode: 'cover',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Subtle overlay similar to web gradient for readability
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  content: {
    position: 'relative',
    zIndex: 10,
    padding: 16,
    gap: 16,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  leftTop: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '500',
    color: '#ffffff',
    marginRight: 4,
  },
  iconButton: {
    padding: 2,
  },
  iconText: {
    fontSize: 16,
  },
  lazorkitLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
    marginLeft: 8,
  },
  balanceContainer: {
    gap: 16,
  },
  balanceItem: {
    gap: 8,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#d1d5db',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  balanceUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#d1d5db',
  },
  networkIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  networkText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#22C55E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
