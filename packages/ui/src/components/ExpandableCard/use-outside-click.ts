import { useEffect, RefObject } from 'react';

/**
 * Hook to detect clicks outside of a referenced element
 * 
 * @param ref - React ref object pointing to the element
 * @param callback - Function to call when outside click is detected
 */
export function useOutsideClick<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  callback: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking inside the element
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      callback();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, callback]);
}

