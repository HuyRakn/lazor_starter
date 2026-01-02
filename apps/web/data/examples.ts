export interface Example {
  id: string;
  icon: string;
  title: string;
  description: string;
  href?: string;
  tags: string[];
  color: 'purple' | 'blue' | 'green' | 'pink' | 'yellow';
}

export const examples: Example[] = [
  {
    id: 'passkey-wallet',
    icon: '👛',
    title: 'Passkey Wallet Basics',
    description: 'Connect with Face ID, check balances, and request airdrops. Perfect for getting started with LazorKit Smart Wallets.',
    href: '/docs/passkey-wallet',
    tags: ['Beginner', 'Authentication'],
    color: 'purple',
  },
  {
    id: 'gasless-transfer',
    icon: '⚡',
    title: 'Gasless USDC Transfer',
    description: 'Send USDC without paying gas fees. Learn how LazorKit\'s paymaster enables true gasless transactions.',
    href: '/docs/gasless-transfer',
    tags: ['Intermediate', 'Transactions'],
    color: 'blue',
  },
  {
    id: 'jupiter-swap',
    icon: '🔄',
    title: 'Jupiter Token Swap',
    description: 'Swap tokens on Jupiter DEX without paying gas fees. Integrate DeFi protocols with LazorKit Smart Wallets.',
    href: '/docs/jupiter-swap',
    tags: ['Advanced', 'DeFi'],
    color: 'green',
  },
  {
    id: 'nft-minting',
    icon: '🎨',
    title: 'NFT Minting',
    description: 'Mint standard NFTs using Metaplex Token Metadata with LazorKit Smart Wallets. Gasless minting experience.',
    href: '/docs/nft-minting',
    tags: ['Advanced', 'NFT'],
    color: 'pink',
  },
  {
    id: 'compressed-nft',
    icon: '🌳',
    title: 'Compressed NFTs',
    description: 'Mint compressed NFTs using Metaplex Bubblegum - truly gasless with zero rent costs!',
    href: '/docs/compressed-nft',
    tags: ['Advanced', 'cNFT'],
    color: 'yellow',
  },
];


