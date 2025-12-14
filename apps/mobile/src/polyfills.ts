// CRITICAL: Import polyfills FIRST before any other imports
// This is required for Solana Web3.js to work on React Native

import 'react-native-get-random-values';
import 'text-encoding-polyfill';
import { Readable } from 'readable-stream';
import * as Crypto from 'expo-crypto';

// Try to use buffer package first (pure JS, no native bindings)
// Fallback to react-native-buffer if buffer package fails
let Buffer: any;
try {
  // Prefer buffer package (pure JS implementation)
  Buffer = require('buffer').Buffer;
  console.log('✅ Using buffer package (pure JS)');
} catch (e) {
  // Fallback to react-native-buffer (may have JSI binding warnings in Expo Go)
  try {
    const bufferModule = require('react-native-buffer');
    Buffer = bufferModule.Buffer || bufferModule.default?.Buffer || bufferModule;
    if (Buffer && typeof Buffer.from === 'function') {
      console.log('✅ Using react-native-buffer (may show JSI warnings in Expo Go)');
    } else {
      throw new Error('Buffer not properly loaded from react-native-buffer');
    }
  } catch (bufferError) {
    // Last resort: minimal Buffer implementation
    console.warn('⚠️ Using minimal Buffer polyfill');
    const TextEncoder = (global as any).TextEncoder;
    
    // Use composition instead of inheritance to avoid type conflicts with Uint8Array
    class BufferPolyfill {
      public _data: Uint8Array;
      
      constructor(data: number | Uint8Array | ArrayLike<number>) {
        if (typeof data === 'number') {
          this._data = new Uint8Array(data);
        } else if (data instanceof Uint8Array) {
          this._data = new Uint8Array(data);
        } else {
          this._data = new Uint8Array(data);
        }
      }
      
      static from(data: any, encoding?: string): BufferPolyfill {
        if (typeof data === 'string') {
          const encoder = new TextEncoder();
          return new BufferPolyfill(encoder.encode(data));
        }
        return new BufferPolyfill(data);
      }
      
      static alloc(size: number, fill?: number): BufferPolyfill {
        const arr = new BufferPolyfill(size);
        if (fill !== undefined) {
          arr._data.fill(fill);
        }
        return arr;
      }
      
      static isBuffer(obj: any): boolean {
        return obj instanceof Uint8Array || obj instanceof BufferPolyfill;
      }
      
      static concat(arrays: Uint8Array[]): BufferPolyfill {
        const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
        const result = new BufferPolyfill(totalLength);
        let offset = 0;
        for (const arr of arrays) {
          result._data.set(arr, offset);
          offset += arr.length;
        }
        return result;
      }
      
      toString(encoding?: string): string {
        const decoder = new TextDecoder();
        return decoder.decode(this._data);
      }
      
      // Implement Uint8Array-like interface for compatibility
      get length(): number {
        return this._data.length;
      }
      
      get byteLength(): number {
        return this._data.byteLength;
      }
      
      get byteOffset(): number {
        return this._data.byteOffset;
      }
      
      get buffer(): ArrayBuffer {
        return this._data.buffer as ArrayBuffer;
      }
      
      set(array: ArrayLike<number>, offset?: number): void {
        this._data.set(array, offset);
      }
      
      fill(value: number, start?: number, end?: number): this {
        this._data.fill(value, start, end);
        return this;
      }
      
      slice(start?: number, end?: number): BufferPolyfill {
        return new BufferPolyfill(this._data.slice(start, end));
      }
      
      // Make it iterable
      [Symbol.iterator](): IterableIterator<number> {
        return this._data[Symbol.iterator]();
      }
      
      // Index access
      [index: number]: number;
    }
    
    // Proxy to allow index access
    Buffer = new Proxy(BufferPolyfill, {
      construct(target, args: any[]) {
        const instance = new target(...(args as [number | Uint8Array | ArrayLike<number>]));
        return new Proxy(instance, {
          get(obj, prop) {
            if (typeof prop === 'string' && /^\d+$/.test(prop)) {
              return obj._data[Number(prop)];
            }
            return (obj as any)[prop];
          },
          set(obj, prop, value) {
            if (typeof prop === 'string' && /^\d+$/.test(prop)) {
              obj._data[Number(prop)] = value;
              return true;
            }
            (obj as any)[prop] = value;
            return true;
          },
        });
      },
    }) as any;
  }
}

// Make Buffer globally available
(global as any).Buffer = Buffer;

// Polyfill for process
if (typeof (global as any).process === 'undefined') {
  (global as any).process = {
    env: {},
    version: '',
    versions: {},
    nextTick: (fn: Function) => setTimeout(fn, 0),
    browser: true,
  };
}

// Polyfill for stream (only if readable-stream is available)
try {
  if (typeof (global as any).Readable === 'undefined') {
    (global as any).Readable = Readable;
  }
} catch (e) {
  // readable-stream may not be available, skip
}

// Polyfill for global (if needed)
if (typeof (global as any).global === 'undefined') {
  (global as any).global = global;
}

// CRITICAL: Polyfill for Event class (required by @wallet-standard/wallet)
// React Native doesn't have Event constructor, so we need to create one
if (typeof (global as any).Event === 'undefined') {
  class EventPolyfill {
    type: string;
    bubbles: boolean;
    cancelable: boolean;
    defaultPrevented: boolean;
    timeStamp: number;
    target: any;
    currentTarget: any;
    detail: any;

    constructor(type: string, eventInitDict?: { bubbles?: boolean; cancelable?: boolean; detail?: any }) {
      this.type = type;
      this.bubbles = eventInitDict?.bubbles ?? false;
      this.cancelable = eventInitDict?.cancelable ?? false;
      this.defaultPrevented = false;
      this.timeStamp = Date.now();
      this.target = null;
      this.currentTarget = null;
      this.detail = eventInitDict?.detail ?? null;
    }

    preventDefault() {
      if (this.cancelable) {
        this.defaultPrevented = true;
      }
    }

    stopPropagation() {
      // No-op in React Native
    }

    stopImmediatePropagation() {
      // No-op in React Native
    }
  }

  (global as any).Event = EventPolyfill;
}

// CRITICAL: Polyfill for window object (required by @lazorkit/wallet)
// This creates a minimal window object with addEventListener
// Must be defined BEFORE any modules try to access it
const eventListeners: Map<string, Set<Function>> = new Map();

const windowPolyfill: any = {
  Event: (global as any).Event,
  addEventListener: (event: string, handler: Function) => {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)?.add(handler);
  },
  removeEventListener: (event: string, handler: Function) => {
    eventListeners.get(event)?.delete(handler);
  },
  dispatchEvent: (event: any) => {
    const handlers = eventListeners.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (e) {
          console.error('Error in event handler:', e);
        }
      });
    }
    return true;
  },
  // window.open polyfill for mobile using WebView
  // This opens URLs in a WebView modal and handles postMessage communication
  // BUT: Block portal URLs when using native passkey
  open: (url?: string, target?: string, features?: string) => {
    if (!url) {
      return null;
    }

    // Check if this is a portal URL and we're using native passkey
    const isPortalUrl = url.includes('portal.lazor.sh') || url.includes('lazor.sh');
    const usingNativePasskey = !!(global as any).__USING_NATIVE_PASSKEY__;
    
    if (isPortalUrl && usingNativePasskey) {
      console.log('🚫 Blocking portal URL (using native passkey):', url);
      // Return a mock window object that won't actually open
      return {
        closed: false,
        close: () => {},
        postMessage: () => {},
      } as any;
    }

    console.log('🔄 window.open called on mobile, opening WebView:', url);
    
    // Use WebViewManager to open WebView (lazy load to avoid circular dependencies)
    try {
      // Lazy load webViewManager - use absolute path from src directory
      const webViewManager = (global as any).__webViewManager;
      if (webViewManager) {
        return webViewManager.open(url);
      } else {
        // If not registered yet, try to require it
        const { webViewManager: manager } = require('../src/utils/webViewManager');
        (global as any).__webViewManager = manager;
        return manager.open(url);
      }
    } catch (e) {
      console.error('❌ Failed to open WebView, using fallback:', e);
      // Fallback: return a mock window object
      const messageListeners = new Set<Function>();
      return {
        closed: false,
        location: { 
          href: url,
          origin: new URL(url).origin,
        },
        close: () => {
          console.log('Fallback window.close() called');
        },
        postMessage: (message: any) => {
          console.log('Fallback window.postMessage() called:', message);
        },
        addEventListener: (event: string, handler: Function) => {
          if (event === 'message') {
            messageListeners.add(handler);
          }
        },
        removeEventListener: (event: string, handler: Function) => {
          if (event === 'message') {
            messageListeners.delete(handler);
          }
        },
      };
    }
  },
  location: {
    origin: 'http://localhost',
    href: 'http://localhost',
    protocol: 'http:',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
  },
  // Add other window properties that might be needed
  document: {
    createElement: () => ({}),
    body: {},
  },
};

// Assign to global.window AND make it available globally
(global as any).window = windowPolyfill;
// Also try to assign directly if possible (for some bundlers)
try {
  if (typeof (global as any).self === 'undefined') {
    (global as any).self = windowPolyfill;
  }
} catch (e) {
  // Ignore
}

// CRITICAL: Polyfill for localStorage (required by @lazorkit/wallet)
// This creates a localStorage-like interface using AsyncStorage
// Note: AsyncStorage will be initialized later in _layout.tsx
let asyncStorageInstance: any = null;
const inMemoryStorage = new Map<string, string>(); // Fallback in-memory storage

// Function to set AsyncStorage instance (called from _layout.tsx)
(global as any).__setAsyncStorageForLocalStorage = (storage: any) => {
  asyncStorageInstance = storage;
};

// Make localStorage synchronous for compatibility (but it's actually async under the hood)
// Some libraries expect synchronous localStorage, so we provide a sync wrapper
const localStoragePolyfill = {
  _storage: inMemoryStorage, // Expose for pre-loading
  
  getItem: (key: string): string | null => {
    // For synchronous access, return from in-memory cache
    return inMemoryStorage.get(key) || null;
  },
  
  setItem: (key: string, value: string): void => {
    // Store in memory immediately
    inMemoryStorage.set(key, value);
    // Also store in AsyncStorage asynchronously (fire and forget)
    if (asyncStorageInstance) {
      asyncStorageInstance.setItem(key, value).catch((e: any) => {
        console.warn('localStorage.setItem async error:', e);
      });
    }
  },
  
  removeItem: (key: string): void => {
    inMemoryStorage.delete(key);
    if (asyncStorageInstance) {
      asyncStorageInstance.removeItem(key).catch((e: any) => {
        console.warn('localStorage.removeItem async error:', e);
      });
    }
  },
  
  clear: (): void => {
    inMemoryStorage.clear();
    if (asyncStorageInstance) {
      asyncStorageInstance.clear().catch((e: any) => {
        console.warn('localStorage.clear async error:', e);
      });
    }
  },
  
  get length(): number {
    return inMemoryStorage.size;
  },
  
  key: (index: number): string | null => {
    const keys = Array.from(inMemoryStorage.keys());
    return keys[index] || null;
  },
};

// Assign to global.localStorage
(global as any).localStorage = localStoragePolyfill;

// CRITICAL: Polyfill for crypto module (required by @solana/kora and other packages)
// Use expo-crypto for React Native compatibility
if (typeof (global as any).crypto === 'undefined') {
  (global as any).crypto = {
    getRandomValues: (array: Uint8Array) => {
      // Use expo-crypto for random values
      const randomBytes = Crypto.getRandomBytes(array.length);
      array.set(randomBytes);
      return array;
    },
    randomUUID: () => {
      // Generate UUID using expo-crypto
      return Crypto.randomUUID();
    },
    subtle: {
      // Minimal subtle crypto implementation
      // Most Solana libraries don't need this, but some might
      digest: async (algorithm: string, data: ArrayBuffer) => {
        // Use expo-crypto for hashing
        const hash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          new Uint8Array(data).reduce((acc, byte) => acc + String.fromCharCode(byte), '')
        );
        // Convert hex string back to ArrayBuffer
        const bytes = new Uint8Array(hash.length / 2);
        for (let i = 0; i < hash.length; i += 2) {
          bytes[i / 2] = parseInt(hash.substr(i, 2), 16);
        }
        return bytes.buffer;
      },
    },
  };
}

console.log('✅ Polyfills loaded (including window, localStorage, and crypto)');

