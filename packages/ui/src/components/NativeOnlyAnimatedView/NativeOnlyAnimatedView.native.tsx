import { View } from 'react-native';
import Animated, { type AnimateProps } from 'react-native-reanimated';
import * as React from 'react';

type NativeOnlyAnimatedViewProps = AnimateProps<React.ComponentProps<typeof View>>;

/**
 * Native-only animated view component.
 * This component uses react-native-reanimated for animations on mobile.
 * On web, use the regular .tsx version which is just a div.
 */
function NativeOnlyAnimatedView({ children, ...props }: NativeOnlyAnimatedViewProps) {
  return <Animated.View {...props}>{children}</Animated.View>;
}

export { NativeOnlyAnimatedView };

