import { TextClassContext } from '../Text/Text';
import { cn } from '../../utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, Pressable, View } from 'react-native';
import * as React from 'react';

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-2xl shadow-none overflow-hidden',
    Platform.select({
      web: "focus-visible:border-emerald-300/45 focus-visible:ring-emerald-300/45 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-gradient-to-r from-emerald-500/45 via-teal-400/40 to-teal-500/45 active:scale-[0.98] shadow-[0_0_14px_rgba(16,185,129,0.22),0_0_28px_rgba(16,185,129,0.16),0_12px_26px_-14px_rgba(16,185,129,0.42),inset_0_-4px_9px_rgba(0,0,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.08)]',
          Platform.select({ web: 'hover:scale-[1.02]' })
        ),
        destructive: cn(
          'bg-gradient-to-r from-rose-600/55 via-red-500/45 to-red-600/55 active:scale-[0.98] shadow-[0_0_14px_rgba(225,29,72,0.26),0_0_28px_rgba(225,29,72,0.16),0_12px_26px_-14px_rgba(225,29,72,0.48),inset_0_-4px_9px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.08)]',
          Platform.select({
            web: 'hover:scale-[1.02] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
          })
        ),
        outline: cn(
          'border border-white/10 bg-white/5 active:bg-white/10 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-8px_16px_rgba(0,0,0,0.35)]',
          Platform.select({
            web: 'hover:bg-white/10',
          })
        ),
        secondary: cn(
          'bg-gray-900/60 active:bg-gray-800/70 border border-white/10 shadow-[0_12px_28px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-8px_16px_rgba(0,0,0,0.35)]',
          Platform.select({ web: 'hover:scale-[1.01]' })
        ),
        ghost: cn(
          'active:bg-white/10',
          Platform.select({ web: 'hover:bg-white/10' })
        ),
        link: '',
      },
      size: {
        default: cn('h-11 px-5 py-3 sm:h-10', Platform.select({ web: 'has-[>svg]:px-4' })),
        sm: cn('h-9 gap-1.5 rounded-xl px-4 sm:h-8', Platform.select({ web: 'has-[>svg]:px-3' })),
        lg: cn('h-12 rounded-2xl px-7 sm:h-11', Platform.select({ web: 'has-[>svg]:px-5' })),
        icon: 'h-11 w-11 sm:h-10 sm:w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    'text-foreground text-sm font-medium',
    Platform.select({ web: 'pointer-events-none transition-colors' })
  ),
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        destructive: 'text-white',
        outline: cn(
          'group-active:text-accent-foreground',
          Platform.select({ web: 'group-hover:text-accent-foreground' })
        ),
        secondary: 'text-secondary-foreground',
        ghost: 'group-active:text-accent-foreground',
        link: cn(
          'text-primary group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' })
        ),
      },
      size: {
        default: '',
        sm: '',
        lg: '',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  const hasLiquidSheen = variant === 'default';
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
      >
        {hasLiquidSheen && (
          <>
            <View pointerEvents="none" className="absolute inset-0 rounded-2xl">
              <View className="absolute top-0 left-0 right-0 h-[45%] rounded-2xl bg-gradient-to-b from-white/24 via-white/8 to-transparent blur-[0.6px]" />
              <View className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            </View>
            <View pointerEvents="none" className="absolute inset-0 rounded-2xl overflow-hidden">
              <View className="absolute inset-[-25%] bg-[radial-gradient(circle_at_18%_30%,rgba(255,255,255,0.16),transparent_36%),radial-gradient(circle_at_82%_26%,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_50%_78%,rgba(255,255,255,0.09),transparent_46%)] opacity-60 blur-[6px]" />
              <View className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.1)_8%,rgba(255,255,255,0)_18%,rgba(255,255,255,0.08)_28%,rgba(255,255,255,0)_38%)] opacity-65" />
            </View>
          </>
        )}
        <View className="relative z-10 flex-row items-center justify-center gap-2">
          {props.children}
        </View>
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };

