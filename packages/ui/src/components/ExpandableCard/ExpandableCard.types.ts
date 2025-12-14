import { ReactNode } from 'react';

/**
 * Expandable card item configuration
 */
export interface ExpandableCardItem {
  /**
   * Unique identifier for the card
   */
  id: string;
  /**
   * Card title
   */
  title: string;
  /**
   * Card description/subtitle
   */
  description: string;
  /**
   * Image source URL
   */
  src: string;
  /**
   * Call-to-action button text
   */
  ctaText: string;
  /**
   * Call-to-action link URL
   */
  ctaLink?: string;
  /**
   * Detailed content (can be string or React component)
   */
  content: string | (() => ReactNode);
  /**
   * Optional price in USDC
   */
  price?: number;
  /**
   * Optional product name for payment
   */
  productName?: string;
}

/**
 * ExpandableCard component props
 */
export interface ExpandableCardProps {
  /**
   * Array of card items to display
   */
  cards: ExpandableCardItem[];
  /**
   * Optional className for container
   */
  className?: string;
  /**
   * Callback when CTA button is clicked
   */
  onCtaClick?: (card: ExpandableCardItem) => void;
}

