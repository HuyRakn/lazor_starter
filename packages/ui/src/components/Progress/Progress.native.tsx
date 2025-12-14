import { cn } from '../../utils';
import * as ProgressPrimitive from '@rn-primitives/progress';
import { Platform, View } from 'react-native';

// Try to import reanimated, fallback to regular View if not available
let Animated: any;
let useAnimatedStyle: any;
let useDerivedValue: any;
let withSpring: any;
let interpolate: any;
let Extrapolation: any;
let reanimatedAvailable = false;

try {
  const reanimated = require('react-native-reanimated');
  Animated = reanimated.default || reanimated;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  useDerivedValue = reanimated.useDerivedValue;
  withSpring = reanimated.withSpring;
  interpolate = reanimated.interpolate;
  Extrapolation = reanimated.Extrapolation;
  reanimatedAvailable = true;
} catch (e) {
  // Reanimated not available, use fallbacks
  console.warn('react-native-reanimated not available in Progress, using fallback');
  Animated = { View };
  useAnimatedStyle = () => ({});
  useDerivedValue = (fn: any) => ({ value: fn() });
  withSpring = (value: any) => value;
  interpolate = (value: any, input: any, output: any) => output[0];
  Extrapolation = { CLAMP: 'clamp' };
}

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: ProgressPrimitive.RootProps &
  React.RefAttributes<ProgressPrimitive.RootRef> & {
    indicatorClassName?: string;
  }) {
  return (
    <ProgressPrimitive.Root
      className={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
      {...props}>
      <Indicator value={value} className={indicatorClassName} />
    </ProgressPrimitive.Root>
  );
}

export { Progress };

const Indicator = Platform.select({
  web: WebIndicator,
  native: NativeIndicator,
  default: NullIndicator,
});

type IndicatorProps = {
  value: number | undefined | null;
  className?: string;
};

function WebIndicator({ value, className }: IndicatorProps) {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View
      className={cn('bg-primary h-full w-full flex-1 transition-all', className)}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}>
      <ProgressPrimitive.Indicator className={cn('h-full w-full', className)} />
    </View>
  );
}

function NativeIndicator({ value, className }: IndicatorProps) {
  if (Platform.OS === 'web') {
    return null;
  }

  // If reanimated is not available, use simple style
  if (!reanimatedAvailable) {
    return (
      <ProgressPrimitive.Indicator asChild>
        <View 
          style={{ width: `${value ?? 0}%` }} 
          className={cn('bg-foreground h-full', className)} 
        />
      </ProgressPrimitive.Indicator>
    );
  }

  const progress = useDerivedValue(() => value ?? 0);

  const indicator = useAnimatedStyle(() => {
    return {
      width: withSpring(
        `${interpolate(progress.value, [0, 100], [1, 100], Extrapolation.CLAMP)}%`,
        { overshootClamping: true }
      ),
    };
  }, [value]);

  return (
    <ProgressPrimitive.Indicator asChild>
      <Animated.View style={indicator} className={cn('bg-foreground h-full', className)} />
    </ProgressPrimitive.Indicator>
  );
}

function NullIndicator(_props: IndicatorProps) {
  return null;
}

