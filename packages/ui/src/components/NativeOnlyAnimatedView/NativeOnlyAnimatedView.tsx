// Web version - just a div wrapper
import * as React from 'react';

type NativeOnlyAnimatedViewProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Web version of NativeOnlyAnimatedView.
 * On web, this is just a regular div since animations are handled by CSS.
 */
function NativeOnlyAnimatedView({ children, className, ...props }: NativeOnlyAnimatedViewProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export { NativeOnlyAnimatedView };
