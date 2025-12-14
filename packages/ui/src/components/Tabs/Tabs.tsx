'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../utils';
import type { TabsProps } from './Tabs.types';

/**
 * Tabs Component
 * 
 * Displays content in a tabbed interface. Uses Radix UI for accessibility
 * and keyboard navigation support.
 * 
 * @param props - Tabs configuration
 * @param props.defaultValue - Default active tab value
 * @param props.value - Controlled active tab value
 * @param props.onValueChange - Callback when tab changes
 * @param props.items - Array of tab items to display
 * @param props.className - Optional className for container
 * @returns Tabs component
 */
export function Tabs({
  defaultValue,
  value,
  onValueChange,
  items,
  className,
}: TabsProps) {
  return (
    <TabsPrimitive.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={cn('w-full', className)}
    >
      <TabsPrimitive.List className="flex h-14 w-full items-center justify-between rounded-[20px] border border-white/10 bg-white/5 px-3 py-1.5 text-gray-300 shadow-[0_18px_36px_-16px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-10px_18px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              'relative flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-[16px] px-4 py-2 text-sm font-semibold tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/50 disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed',
              'data-[state=active]:bg-gradient-to-r data-[state=active]:from-white/28 data-[state=active]:to-white/18 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border data-[state=active]:border-white/30 data-[state=active]:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.15),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-6px_12px_rgba(0,0,0,0.4)] data-[state=active]:scale-[1.02]',
              'hover:text-white hover:bg-white/6',
              'data-[state=inactive]:text-gray-400'
            )}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
            {/* Active indicator line */}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-white/60 rounded-full opacity-0 data-[state=active]:opacity-100" />
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.value}
          value={item.value}
          className={cn(
            'mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

