import { cn } from '../../utils';
import { Platform, TextInput, type TextInputProps } from 'react-native';

function Input({
  className,
  placeholderClassName,
  ...props
}: TextInputProps & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        'bg-white/5 text-slate-200 flex h-12 w-full min-w-0 flex-row items-center rounded-2xl border border-white/10 px-4 py-2 text-base leading-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.04)] sm:h-11',
        props.editable === false &&
          cn(
            'opacity-50',
            Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
          ),
        Platform.select({
          web: cn(
            'placeholder:text-slate-500 selection:bg-emerald-500/25 selection:text-white outline-none transition-[color,box-shadow] md:text-sm',
            'focus-visible:border-emerald-300/45 focus-visible:ring-emerald-300/45 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
          ),
          native: 'placeholder:text-slate-500/60',
        }),
        className
      )}
      {...props}
    />
  );
}

export { Input };

