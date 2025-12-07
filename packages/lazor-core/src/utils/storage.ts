/**
 * Universal Storage Utility
 * Works for both Web (localStorage) and Mobile (AsyncStorage)
 */

export interface StorageInterface {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

let storageInstance: StorageInterface | null = null;

export function getStorage(): StorageInterface | null {
  if (storageInstance) {
    return storageInstance;
  }

  // Web: Use localStorage (synchronous)
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    storageInstance = {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
      },
    };
    return storageInstance;
  }

  // Mobile: Use AsyncStorage (asynchronous)
  // We'll set this up in the mobile app initialization
  // For now, return a no-op storage
  storageInstance = {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  };

  return storageInstance;
}

/**
 * Initialize storage for Mobile (call this in mobile app entry point)
 */
export function initMobileStorage(AsyncStorage: any) {
  if (typeof window === 'undefined' || !AsyncStorage) {
    return;
  }

  storageInstance = {
    getItem: async (key: string) => {
      try {
        return await AsyncStorage.getItem(key);
      } catch (e) {
        console.error('AsyncStorage.getItem error:', e);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (e) {
        console.error('AsyncStorage.setItem error:', e);
      }
    },
    removeItem: async (key: string) => {
      try {
        await AsyncStorage.removeItem(key);
      } catch (e) {
        console.error('AsyncStorage.removeItem error:', e);
      }
    },
  };
}

