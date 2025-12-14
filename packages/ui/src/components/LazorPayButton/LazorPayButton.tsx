'use client';

import { Button } from '../Button';
import { useState } from 'react';
import { useGaslessTx } from '@lazor-starter/core';

export interface LazorPayButtonProps {
  /**
   * Recipient wallet address to send payment to
   */
  to: string;
  /**
   * Amount to pay in USDC
   */
  amount: number;
  /**
   * Product name or description
   */
  productName?: string;
  /**
   * Callback when payment succeeds
   */
  onSuccess?: (signature: string) => void;
  /**
   * Callback when payment fails
   */
  onError?: (error: Error) => void;
  /**
   * Custom button text
   */
  label?: string;
  /**
   * Disable button
   */
  disabled?: boolean;
  /**
   * Button variant
   */
  variant?: 'default' | 'outline';
  /**
   * Button size
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Custom className
   */
  className?: string;
}

const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

/**
 * Reusable payment button component for "Pay with Solana"
 * 
 * @param props - Button configuration
 * @param props.to - Recipient wallet address
 * @param props.amount - Payment amount in USDC
 * @param props.productName - Optional product name
 * @param props.onSuccess - Success callback with transaction signature
 * @param props.onError - Error callback
 * @param props.label - Custom button text
 * @param props.disabled - Disable button state
 * @param props.variant - Button style variant
 * @param props.size - Button size
 * @param props.className - Additional CSS classes
 * @returns Payment button component
 */
export function LazorPayButton({
  to,
  amount,
  productName,
  onSuccess,
  onError,
  label,
  disabled = false,
  variant = 'default',
  size = 'default',
  className,
}: LazorPayButtonProps) {
  const [loading, setLoading] = useState(false);
  const { transferSPLToken } = useGaslessTx();

  /**
   * Handles payment transaction
   */
  const handlePayment = async () => {
    if (loading || disabled) return;

    setLoading(true);

    try {
      const signature = await transferSPLToken(to, amount, USDC_DEVNET_MINT, 6);
      
      if (onSuccess) {
        onSuccess(signature);
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error(error?.message || 'Payment failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const buttonText = label || `Pay ${amount} USDC${productName ? ` for ${productName}` : ''}`;

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? 'Processing...' : buttonText}
    </Button>
  );
}

