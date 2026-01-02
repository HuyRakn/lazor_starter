import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900/50 border-t border-white/10 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">About</h3>
            <p className="text-gray-400 text-sm mb-4">
              Production-ready Universal Monorepo Starter for Lazorkit SDK.
              Build Web3 apps with Face ID, gasless transactions, and Smart Wallets.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://docs.lazorkit.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Documentation
              </a>
            </div>
          </div>

          {/* Recipes */}
          <div>
            <h3 className="text-white font-semibold mb-4">Recipes</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/recipes/01-passkey-wallet-basics" className="text-gray-400 hover:text-white transition-colors">
                  Recipe 01: Passkey Basics
                </Link>
              </li>
              <li>
                <Link href="/recipes/02-gasless-transfer" className="text-gray-400 hover:text-white transition-colors">
                  Recipe 02: Gasless Transfer
                </Link>
              </li>
              <li>
                <Link href="/recipes/03-jupiter-swap" className="text-gray-400 hover:text-white transition-colors">
                  Recipe 03: Jupiter Swap
                </Link>
              </li>
              <li>
                <Link href="/recipes/04-nft-minting" className="text-gray-400 hover:text-white transition-colors">
                  Recipe 04: NFT Minting
                </Link>
              </li>
              <li>
                <Link href="/recipes/05-compressed-nft" className="text-gray-400 hover:text-white transition-colors">
                  Recipe 05: Compressed NFTs
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://lazorkit.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  LazorKit Website
                </a>
              </li>
              <li>
                <a
                  href="https://docs.lazorkit.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  LazorKit Docs
                </a>
              </li>
              <li>
                <a
                  href="https://solana.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Solana Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Built With */}
          <div>
            <h3 className="text-white font-semibold mb-4">Built With</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Next.js 16</li>
              <li>LazorKit SDK 2.0</li>
              <li>TypeScript</li>
              <li>Tailwind CSS</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm">
            Built with ❤️ for the Solana ecosystem. Powered by LazorKit.
          </p>
        </div>
      </div>
    </footer>
  );
}

