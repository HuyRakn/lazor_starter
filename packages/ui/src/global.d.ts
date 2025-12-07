import 'react-native';

// NativeWind className support
declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
    placeholderClassName?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface Animated {
    View: React.ComponentType<ViewProps>;
  }
}

declare module 'lucide-react-native' {
  export interface LucideProps {
    className?: string;
  }
}

