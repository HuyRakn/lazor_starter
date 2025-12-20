'use client';

import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { TabsProps } from './Tabs.types';

/**
 * Tabs Component (Native)
 * 
 * Displays content in a tabbed interface for React Native.
 * Pure dark theme design without colored gradients.
 * 
 * @param props - Tabs configuration
 * @param props.defaultValue - Default active tab value
 * @param props.value - Controlled active tab value
 * @param props.onValueChange - Callback when tab changes
 * @param props.items - Array of tab items to display
 * @param props.className - Optional className for container (not used in native)
 * @returns Tabs component
 */
export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  items,
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || items[0]?.value);
  const activeValue = controlledValue ?? internalValue;

  const handleTabChange = (newValue: string) => {
    // Check if this tab is disabled
    const item = items.find((i) => i.value === newValue);
    if (item?.disabled) return;

    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const activeItem = items.find((item) => item.value === activeValue);

  return (
    <View style={styles.container}>
      <View style={styles.tabList}>
        {items.map((item) => {
          const isActive = item.value === activeValue;
          const isDisabled = item.disabled;
          return (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.tab,
                isActive && styles.tabActive,
                isDisabled && styles.tabDisabled,
              ]}
              onPress={() => handleTabChange(item.value)}
              activeOpacity={isDisabled ? 1 : 0.7}
              disabled={isDisabled}
            >
              {item.icon && <View style={styles.iconContainer}>{item.icon}</View>}
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                  isDisabled && styles.tabTextDisabled,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.content}>{activeItem?.content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tabList: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 9999,
    padding: 4,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tabDisabled: {
    opacity: 0.4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tabTextDisabled: {
    color: '#4B5563',
  },
  iconContainer: {
    marginRight: 8,
  },
  content: {
    marginTop: 16,
  },
});
