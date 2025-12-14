'use client';

import { useLazorAuth } from '@lazor-starter/core';
import { ExpandableCard, Alert, AlertDescription } from '@lazor-starter/ui';
import type { ExpandableCardItem } from '@lazor-starter/ui';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGaslessTx } from '@lazor-starter/core';

const STORE_WALLET_ADDRESS = '11111111111111111111111111111111';
const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

export default function StorePage() {
  const router = useRouter();
  const { isLoggedIn, isInitialized } = useLazorAuth();
  const { transferSPLToken } = useGaslessTx();
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    router.push('/');
    return null;
  }

  /**
   * Handles payment when CTA button is clicked
   * 
   * @param card - Expandable card item with payment details
   */
  const handleCtaClick = async (card: ExpandableCardItem) => {
    if (!card.price) return;

    setProcessing(card.id);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const signature = await transferSPLToken(
        STORE_WALLET_ADDRESS,
        card.price,
        USDC_DEVNET_MINT,
        6
      );
      setPaymentSuccess(`Payment successful! Transaction: ${signature.slice(0, 16)}...`);
      setProcessing(null);
    } catch (error: any) {
      console.error('Payment failed:', error);
      setPaymentError(error?.message || 'Payment failed');
      setProcessing(null);
    }
  };

  const storeProducts: ExpandableCardItem[] = [
    {
      id: 'coffee',
      title: '☕ Premium Coffee',
      description: 'Artisan roasted coffee beans',
      src: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=400&fit=crop',
      ctaText: processing === 'coffee' ? 'Processing...' : 'Buy Now',
      price: 1,
      productName: 'Coffee',
      content: () => (
        <div className="space-y-4">
          <p>
            Experience the finest artisan coffee beans, carefully selected and roasted to perfection.
            Each batch is crafted with precision to deliver an exceptional coffee experience.
          </p>
          <p>
            <strong>Features:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Single-origin premium beans</li>
            <li>Medium roast profile</li>
            <li>Rich, smooth flavor</li>
            <li>Ethically sourced</li>
          </ul>
          <p className="text-green-500 font-bold text-xl mt-4">
            Price: 1 USDC (Gasless Payment)
          </p>
        </div>
      ),
    },
    {
      id: 'tshirt',
      title: '🎨 Lazor Starter T-Shirt',
      description: 'Official merchandise',
      src: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      ctaText: processing === 'tshirt' ? 'Processing...' : 'Buy Now',
      price: 10,
      productName: 'T-Shirt',
      content: () => (
        <div className="space-y-4">
          <p>
            Show your support for Lazorkit with our official Lazor Starter T-Shirt.
            Made from premium cotton, comfortable and stylish.
          </p>
          <p>
            <strong>Specifications:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>100% Premium Cotton</li>
            <li>Available in multiple sizes</li>
            <li>Machine washable</li>
            <li>Official Lazorkit branding</li>
          </ul>
          <p className="text-green-500 font-bold text-xl mt-4">
            Price: 10 USDC (Gasless Payment)
          </p>
        </div>
      ),
    },
    {
      id: 'premium',
      title: '🚀 Premium Package',
      description: 'Complete starter kit',
      src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
      ctaText: processing === 'premium' ? 'Processing...' : 'Buy Now',
      price: 50,
      productName: 'Premium Package',
      content: () => (
        <div className="space-y-4">
          <p>
            Get everything you need to start building with Lazorkit. This comprehensive
            package includes premium resources, templates, and exclusive access.
          </p>
          <p>
            <strong>Includes:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Premium UI components library</li>
            <li>Advanced templates</li>
            <li>Priority support</li>
            <li>Exclusive documentation</li>
            <li>Early access to new features</li>
          </ul>
          <p className="text-green-500 font-bold text-xl mt-4">
            Price: 50 USDC (Gasless Payment)
          </p>
        </div>
      ),
    },
    {
      id: 'vip',
      title: '💎 VIP Access',
      description: 'Lifetime VIP Membership',
      src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop',
      ctaText: processing === 'vip' ? 'Processing...' : 'Buy Now',
      price: 100,
      productName: 'VIP Access',
      content: () => (
        <div className="space-y-4">
          <p>
            Unlock lifetime VIP access with exclusive benefits, premium features,
            and priority support. Join the elite community of Lazorkit developers.
          </p>
          <p>
            <strong>VIP Benefits:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Lifetime access to all features</li>
            <li>24/7 Priority support</li>
            <li>Exclusive VIP community</li>
            <li>Early access to beta features</li>
            <li>Custom development assistance</li>
            <li>Monthly VIP-only webinars</li>
          </ul>
          <p className="text-green-500 font-bold text-xl mt-4">
            Price: 100 USDC (Gasless Payment)
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Lazor Merch Store
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Pay with Solana - Gasless Transactions
          </p>
        </div>

        {/* Expandable Cards */}
        <ExpandableCard
          cards={storeProducts}
          onCtaClick={handleCtaClick}
          className="space-y-4"
        />

        {/* Payment Status */}
        {paymentSuccess && (
          <Alert className="bg-green-900/50 border-green-500">
            <AlertDescription className="text-green-200 text-sm">
              {paymentSuccess}
            </AlertDescription>
          </Alert>
        )}

        {paymentError && (
          <Alert variant="destructive" className="bg-red-900/50 border-red-500">
            <AlertDescription className="text-red-200 text-sm">
              {paymentError}
            </AlertDescription>
          </Alert>
        )}

        {/* Info Card */}
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-6 mt-8">
          <p className="text-blue-200 text-sm text-center">
            💡 All payments are processed gasless via Lazorkit Paymaster. No SOL required!
          </p>
        </div>
      </div>
    </div>
  );
}
