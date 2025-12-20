'use client';

import { useState } from 'react';
import { cn } from '../../utils';
import type { WalletBannerProps } from './WalletBanner.types';

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
function formatBalanceString(balanceText?: string): string {
  if (!balanceText) return '0';
  // add thousand separators without rounding
  const [intPart, decPart] = balanceText.split('.');
  const withSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (decPart) {
    return `${withSeparators}.${decPart}`;
  }
  return withSeparators;
}

/**
 * Wallet Banner Component
 * 
 * Displays wallet information in a card visa-style design matching the design mockup.
 * Shows wallet address, SOL balance, and USDC balance.
 * Responsive design: single column on mobile, multi-column on desktop.
 * 
 * @param props - Component configuration
 * @param props.walletAddress - Wallet public key address
 * @param props.solBalance - Optional SOL balance
 * @param props.usdcBalance - Optional USDC balance
 * @param props.className - Optional className for container
 * @param props.onExploreClick - Callback when explore icon is clicked
 * @returns Wallet banner card component
 */
export function WalletBanner({
  walletAddress,
  solBalance,
  usdcBalance,
  solBalanceText,
  usdcBalanceText,
  className,
  onExploreClick,
}: WalletBannerProps) {
  const formattedAddress = formatWalletAddress(walletAddress);
  const formattedSolBalance = formatBalanceString(solBalanceText ?? (solBalance !== undefined ? solBalance.toString() : undefined));
  const formattedUsdcBalance = formatBalanceString(usdcBalanceText ?? (usdcBalance !== undefined ? usdcBalance.toString() : undefined));
  const [copied, setCopied] = useState(false);

  /**
   * Handles copying wallet address to clipboard
   */
  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  /**
   * Handles explore icon click
   */
  const handleExploreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExploreClick?.();
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl shadow-2xl lg:min-h-[240px]',
        'border border-gray-700/30',
        className
      )}
    >
      {/* Background Image with Dragon Art */}
      <div className="absolute inset-0">
        <img
          src="/images/wallet-banner.jpg"
          alt="Wallet Banner Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle overlay for better text readability - minimal like RampFi premium */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-5 md:p-6 lg:p-8 w-full h-full flex flex-col justify-between gap-6">
        {/* Top Section */}
        <div className="flex items-start justify-between gap-4 w-full">
          {/* Left Side */}
          <div className="space-y-2 flex-1 min-w-0">
            <div>
              <span className="text-xs font-semibold text-white uppercase tracking-wider drop-shadow-lg">
                WALLET
              </span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm md:text-base font-mono font-medium text-white drop-shadow-lg truncate">
                {formattedAddress}
              </p>
              {/* Copy Icon */}
              <button
                onClick={handleCopyAddress}
                className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                title="Copy address"
              >
                {copied ? (
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-white drop-shadow-md"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
              {/* Explore Icon */}
              <button
                onClick={handleExploreClick}
                className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                title="View on explorer"
              >
                <svg
                  className="w-4 h-4 text-white drop-shadow-md"
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
              </button>
            </div>
          </div>

          {/* Right Side - LazorKit Logo */}
          <div className="text-white font-bold text-lg md:text-xl tracking-wider drop-shadow-lg flex-shrink-0 ml-4">
            LazorKit
          </div>
        </div>

        {/* Balance Section - Responsive: single column on mobile, two columns on desktop */}
        <div className="grid grid-cols-1 md:flex md:items-end md:justify-between gap-4 md:gap-8 w-full">
          {/* SOL Balance */}
          <div className="space-y-2 md:flex-1">
            <p className="text-xs md:text-sm text-gray-200 uppercase tracking-wider drop-shadow-md">
              SOL BALANCE
            </p>
            <p className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg flex items-baseline gap-1">
              <span className="truncate max-w-[180px] md:max-w-[220px]">{formattedSolBalance}</span>
              <span className="text-sm font-normal text-gray-200 drop-shadow-md flex-shrink-0">SOL</span>
            </p>
          </div>

          {/* USDC Balance */}
          <div className="space-y-2 md:flex-1 md:text-right">
            <p className="text-xs md:text-sm text-gray-200 uppercase tracking-wider drop-shadow-md">
              USDC BALANCE
            </p>
            <p className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg flex items-baseline justify-end gap-1">
              <span className="truncate max-w-[180px] md:max-w-[220px] text-right">{formattedUsdcBalance}</span>
              <span className="text-sm font-normal text-gray-200 drop-shadow-md flex-shrink-0">USDC</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
