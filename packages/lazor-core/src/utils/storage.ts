export interface StorageInterface {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

let storageInstance: StorageInterface | null = null;

/**
 * Gets the storage instance for the current platform
 *
 * Shared utility for monorepo (Web & Mobile).
 * Automatically detects Web (localStorage) or Mobile (AsyncStorage) environment.
 * Returns null if storage is not available.
 *
 * @returns Storage interface instance or null
 */
export function getStorage(): StorageInterface | null {
  if (storageInstance) {
    return storageInstance;
  }

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

  storageInstance = {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  };

  return storageInstance;
}

/**
 * Initialize storage for Mobile platform using AsyncStorage
 *
 * Shared utility for monorepo mobile apps.
 * Call this function in the mobile app entry point to enable
 * persistent storage on React Native.
 *
 * @param AsyncStorage - AsyncStorage instance from @react-native-async-storage/async-storage
 * @returns void - Function does not return a value
 */
export function initMobileStorage(AsyncStorage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}): void {
  if (typeof window === 'undefined' || !AsyncStorage) {
    return;
  }

  storageInstance = {
    getItem: async (key: string) => {
      try {
        return await AsyncStorage.getItem(key);
      } catch (error) {
        console.error('AsyncStorage.getItem error:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.error('AsyncStorage.setItem error:', error);
      }
    },
    removeItem: async (key: string) => {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error('AsyncStorage.removeItem error:', error);
      }
    },
  };
}

