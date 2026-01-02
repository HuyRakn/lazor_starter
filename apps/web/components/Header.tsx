'use client';

'use client';

import Link from 'next/link';
import { useSmartWallet, shortenAddress } from '@lazor-starter/core';
import { useNetworkStore } from '@lazor-starter/core';

export function Header() {
  const { wallet, isConnected, connect, disconnect, connecting } = useSmartWallet();
  const { network, setNetwork } = useNetworkStore();

  return (
    <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="text-2xl">🚀</div>
            <div>
              <div className="text-lg font-bold text-white">LazorKit Starter</div>
              <div className="text-xs text-gray-400">Universal Monorepo</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/recipes"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Recipes
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <a
              href="https://docs.lazorkit.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Docs →
            </a>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Network Selector */}
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as 'mainnet' | 'devnet')}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="devnet">Devnet</option>
              <option value="mainnet">Mainnet</option>
            </select>

            {/* Wallet Button */}
            {!isConnected ? (
              <button
                onClick={connect}
                disabled={connecting}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 text-sm"
              >
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-green-400 text-sm font-mono">
                      {wallet?.smartWallet ? shortenAddress(wallet.smartWallet, 4) : ''}
                    </span>
                  </div>
                </div>
                <button
                  onClick={disconnect}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg transition-all text-sm"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

