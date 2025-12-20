import { Icon } from '../Icon/Icon';
import { Text, TextClassContext } from '../Text/Text';
import { cn } from '../../utils';
import type { LucideIcon } from 'lucide-react-native';
import { AlertCircle } from 'lucide-react-native';
import * as React from 'react';
import { View, type ViewProps } from 'react-native';

function Alert({
  className,
  variant,
  children,
  icon,
  iconClassName,
  ...props
}: ViewProps &
  React.RefAttributes<View> & {
    icon?: LucideIcon;
    variant?: 'default' | 'destructive';
    iconClassName?: string;
  }) {
  const IconComponent = icon || AlertCircle;

  return (
    <TextClassContext.Provider
      value={cn(
        'text-sm text-foreground',
        variant === 'destructive' && 'text-destructive',
        className
      )}>
      <View
        role="alert"
        className={cn(
          'relative w-full rounded-2xl border border-white/10 bg-white/5 px-4 pb-2 pt-3.5 shadow-[0_10px_22px_-14px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-8px_14px_rgba(0,0,0,0.3)]',
          className
        )}
        {...props}>
        <View className="absolute left-3.5 top-3">
          <Icon
            as={IconComponent}
            className={cn('size-4', variant === 'destructive' && 'text-destructive', iconClassName)}
          />
        </View>
        {children}
      </View>
    </TextClassContext.Provider>
  );
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return (
    <Text
      className={cn('mb-1 ml-0.5 min-h-4 pl-6 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  const textClass = React.useContext(TextClassContext);
  return (
    <Text
      className={cn(
        'text-muted-foreground ml-0.5 pb-1.5 pl-6 text-sm leading-relaxed',
        textClass?.includes('text-destructive') && 'text-destructive/90',
        className
      )}
      {...props}
    />
  );
}

export { Alert, AlertDescription, AlertTitle };

