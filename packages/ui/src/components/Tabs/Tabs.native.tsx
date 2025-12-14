'use client';

import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { TabsProps } from './Tabs.types';

/**
 * Tabs Component (Native)
 * 
 * Displays content in a tabbed interface for React Native.
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
          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleTabChange(item.value)}
              activeOpacity={0.7}
            >
              {/* Gradient overlay for active tab */}
              {isActive && (
                <>
                  <View style={styles.gradientOverlayLeft} />
                  <View style={styles.gradientOverlayRight} />
                </>
              )}
              {item.icon && <View style={styles.iconContainer}>{item.icon}</View>}
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {item.label}
              </Text>
              {/* Active indicator line */}
              {isActive && <View style={styles.indicatorLine} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.content}>
        {activeItem?.content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tabList: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 4,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
    transform: [{ scale: 1.02 }],
    overflow: 'hidden',
  },
  gradientOverlayLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  gradientOverlayRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(156, 163, 175, 1)',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  iconContainer: {
    marginRight: 8,
  },
  indicatorLine: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -24,
    width: 48,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 1,
  },
  content: {
    marginTop: 16,
  },
});

