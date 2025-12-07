// Web version - Text component is mobile-only
// On web, use regular HTML elements or styled components
import * as React from 'react';

type TextProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'blockquote' | 'code' | 'lead' | 'large' | 'small' | 'muted';
  asChild?: boolean;
};

/**
 * Text component placeholder for web.
 * On web, use regular HTML elements (h1, h2, p, span, etc.) or styled components.
 * 
 * @example
 * ```tsx
 * <h1 className="text-4xl font-bold">Heading</h1>
 * <p className="text-base">Paragraph</p>
 * ```
 */
function Text({ variant = 'default', asChild, className, children, ...props }: TextProps) {
  // Map variants to HTML elements
  const Component = variant === 'h1' ? 'h1' 
    : variant === 'h2' ? 'h2'
    : variant === 'h3' ? 'h3'
    : variant === 'h4' ? 'h4'
    : variant === 'p' ? 'p'
    : variant === 'blockquote' ? 'blockquote'
    : variant === 'code' ? 'code'
    : 'span';
  
  return React.createElement(Component, { className, ...props }, children);
}

export const TextClassContext = React.createContext<string | undefined>(undefined);

export { Text };
