'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getStorage } from '../utils/storage';

export type Network = 'mainnet' | 'devnet';

interface NetworkState {
  network: Network;
  setNetwork: (network: Network) => void;
}

const storage = getStorage();

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set) => ({
      network: 'mainnet',
      setNetwork: (network: Network) => set({ network }),
    }),
    {
      name: 'lazorkit-network',
      storage: storage
        ? {
            getItem: async (name) => {
              const value = await Promise.resolve(storage.getItem(name));
              return value ? JSON.parse(value) : null;
            },
            setItem: async (name, value) => {
              await Promise.resolve(storage.setItem(name, JSON.stringify(value)));
            },
            removeItem: async (name) => {
              await Promise.resolve(storage.removeItem(name));
            },
          }
        : undefined,
    }
  )
);


