// Web version - Icon component is mobile-only
// For web, use lucide-react directly or create web-specific icons
import * as React from 'react';

type IconProps = {
  as: React.ComponentType<any>;
  className?: string;
  size?: number;
  [key: string]: any;
};

/**
 * Icon component placeholder for web.
 * On web, use lucide-react icons directly instead.
 * 
 * @example
 * ```tsx
 * import { ArrowRight } from 'lucide-react';
 * <ArrowRight className="text-red-500" size={16} />
 * ```
 */
function Icon({ as: IconComponent, className, size = 14, ...props }: IconProps) {
  // On web, just render the icon component directly
  // This is a fallback - ideally use lucide-react on web
  return <IconComponent className={className} size={size} {...props} />;
}

export { Icon };
