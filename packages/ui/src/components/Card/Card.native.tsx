import { Text, TextClassContext } from '../Text/Text';
import { cn } from '../../utils';
import { View, type ViewProps } from 'react-native';
import * as React from 'react';

function Card({ className, ...props }: ViewProps & React.RefAttributes<View>) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View
        className={cn(
          'bg-white/5 border-white/10 flex flex-col gap-6 rounded-[26px] border py-6 shadow-[0_18px_36px_-12px_rgba(0,0,0,0.55),0_0_18px_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-10px_20px_rgba(0,0,0,0.38)]',
          className
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function CardHeader({ className, ...props }: ViewProps & React.RefAttributes<View>) {
  return <View className={cn('flex flex-col gap-1.5 px-6', className)} {...props} />;
}

function CardTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return (
    <Text
      role="heading"
      aria-level={3}
      className={cn('font-semibold leading-none', className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return <Text className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

function CardContent({ className, ...props }: ViewProps & React.RefAttributes<View>) {
  return <View className={cn('px-6', className)} {...props} />;
}

function CardFooter({ className, ...props }: ViewProps & React.RefAttributes<View>) {
  return <View className={cn('flex flex-row items-center px-6', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };

