import { View } from 'react-native';
import * as React from 'react';

// Try to import reanimated, fallback to regular View if it fails
let Animated: any;
let reanimatedAvailable = false;

try {
  Animated = require('react-native-reanimated');
  reanimatedAvailable = true;
} catch (e) {
  // Reanimated not available (e.g., in Expo Go without native modules)
  console.warn('react-native-reanimated not available, using regular View');
  Animated = { View };
}

type NativeOnlyAnimatedViewProps = React.ComponentProps<typeof View> & {
  entering?: any;
  exiting?: any;
};

/**
 * Native-only animated view component.
 * This component uses react-native-reanimated for animations on mobile.
 * Falls back to regular View if reanimated is not available (e.g., Expo Go).
 * On web, use the regular .tsx version which is just a div.
 */
function NativeOnlyAnimatedView({ children, entering, exiting, ...props }: NativeOnlyAnimatedViewProps) {
  if (reanimatedAvailable && Animated.View) {
    return <Animated.View {...props}>{children}</Animated.View>;
  }
  // Fallback to regular View if reanimated is not available
  return <View {...props}>{children}</View>;
}

export { NativeOnlyAnimatedView };

