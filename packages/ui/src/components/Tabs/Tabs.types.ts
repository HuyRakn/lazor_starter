import { ReactNode } from 'react';

/**
 * Tabs component props
 */
export interface TabsProps {
  /**
   * Default active tab value
   */
  defaultValue?: string;
  /**
   * Controlled active tab value
   */
  value?: string;
  /**
   * Callback when tab changes
   */
  onValueChange?: (value: string) => void;
  /**
   * Tab items configuration
   */
  items: TabItem[];
  /**
   * Optional className for container
   */
  className?: string;
}

/**
 * Individual tab item configuration
 */
export interface TabItem {
  /**
   * Unique tab identifier
   */
  value: string;
  /**
   * Tab label text
   */
  label: string;
  /**
   * Tab content (React component or string)
   */
  content: ReactNode;
  /**
   * Optional icon for tab
   */
  icon?: ReactNode;
  /**
   * Whether the tab is disabled
   */
  disabled?: boolean;
}

