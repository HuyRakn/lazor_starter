# 🚀 Lazor Starter

**Production-ready Universal Monorepo Starter for Lazorkit SDK**

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.3.0-black)](https://turbo.build/)
[![Solana](https://img.shields.io/badge/Solana-Devnet-purple)](https://solana.com/)
[![Gasless](https://img.shields.io/badge/Gasless-Enabled-green)](https://lazorkit.com/)

> **The Standard Setter** - A universal starter kit that demonstrates best practices for integrating Lazorkit SDK across Web and Mobile platforms.

## ✨ Why Lazor Starter?

Building Web3 applications shouldn't require wrestling with complex configurations, polyfills, and platform-specific code. Lazor Starter solves this by providing:

- ✅ **Universal Code Sharing** - Write once, run on Web (Next.js) and Mobile (Expo)
- ✅ **Passkey Authentication** - Face ID / Touch ID login out of the box
- ✅ **Gasless Transactions** - Zero-fee transactions via Lazorkit Paymaster
- ✅ **Smart Wallet** - Account abstraction powered by Lazorkit (100% onchain devnet)
- ✅ **Production Ready** - TypeScript, proper error handling, and best practices

## 🎯 Features

| Feature | Traditional Wallet | Lazorkit Wallet |
|---------|-------------------|-----------------|
| **Authentication** | Seed phrase (risky) | Passkey (Face ID / Touch ID) ✅ |
| **Gas Fees** | User pays SOL | Gasless (Paymaster) ✅ |
| **Account Type** | Keypair (single device) | Smart Wallet (multi-device) ✅ |
| **Onboarding** | Complex | One-click ✅ |

## 🏗️ Architecture

```
lazor-starter/
├── apps/
│   ├── web/          # Next.js 15 (App Router)
│   │   └── app/api/orders/create-smart-wallet/  # Onchain backend API
│   └── mobile/       # Expo 52 (React Native)
├── packages/
│   ├── lazor-core/   # Shared Lazorkit logic
│   └── ui/           # Shared UI components
├── .env.local        # Shared environment variables (root)
└── docs/             # Tutorials and guides
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- iOS Simulator / Android Emulator (for mobile)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd lazor-starter

# Copy environment file
cp .env.example .env.local

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

This will start:
- **Web**: http://localhost:3000
- **Mobile**: Expo Dev Server (scan QR with Expo Go app)

### Environment Variables

**IMPORTANT**: Create `.env.local` in the **root directory**. Both Web and Mobile apps will read from this file.

```env
# Lazorkit Configuration (Shared for Web & Mobile)
NEXT_PUBLIC_LAZORKIT_RPC_URL=https://devnet.helius-rpc.com/?api-key=...
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://kora.devnet.lazorkit.com/

# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Backend Server (for smart wallet creation)
PRIVATE_KEY=your_admin_private_key_base58
RPC_URL=https://devnet.helius-rpc.com/?api-key=...
SMART_WALLET_INIT_LAMPORTS=3500000
```

See `.env.example` for all available variables.

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Tutorial 1: Building Your First Passkey Wallet](./docs/tutorial-1-passkey-wallet.md)
- [Tutorial 2: Gasless Transactions in 3 Lines](./docs/tutorial-2-gasless.md)
- [Backend Setup Guide](./docs/backend-setup.md)

## 🎓 What's Inside?

### `packages/lazor-core`

The heart of the project - shared logic for both Web and Mobile:

- **LazorProvider** - Wraps Lazorkit SDK provider
- **useLazorAuth** - Passkey login/logout/registration
- **useGaslessTx** - Gasless transaction hooks (SOL & SPL tokens)

### `apps/web`

Next.js 15 application with:
- App Router
- Tailwind CSS
- TypeScript
- **Onchain API routes** - `/api/orders/create-smart-wallet` (100% devnet, no mocks)

### `apps/mobile`

Expo 52 application with:
- React Native
- Expo Router
- Polyfills for Solana Web3.js
- Native biometric authentication

## 🔧 Tech Stack

- **Monorepo**: Turborepo + pnpm
- **Web**: Next.js 15, React 18.3.1, Tailwind CSS
- **Mobile**: Expo 52, React Native 0.76.3
- **Blockchain**: Lazorkit SDK 1.7.5, Solana Web3.js
- **State**: Zustand
- **Language**: TypeScript 5.0

## ✅ Onchain Features (100% Devnet)

All features are **fully onchain** - no mocks:

- ✅ **Passkey Creation** - Real WebAuthn credentials
- ✅ **Smart Wallet Creation** - Onchain PDA creation via Lazorkit Program
- ✅ **Token Transfers** - Real SOL and SPL token transfers
- ✅ **Gasless Transactions** - Real Paymaster integration

## 🎯 Use Cases

This starter is perfect for:

- 🏪 **E-commerce** - "Pay with Solana" buttons
- 💰 **P2P Payments** - Send tokens without gas fees
- 🎮 **Gaming** - In-game purchases with Passkey
- 📱 **Mobile Wallets** - Native mobile wallet apps
- 🌐 **Web Apps** - Web3 dApps with better UX

## 🤝 Contributing

This is a starter template for the Lazorkit SDK Integration Bounty. Contributions welcome!

## 📄 License

MIT

## 🙏 Acknowledgments

Built with ❤️ for the Lazorkit community. Special thanks to the RampFi project for inspiration.

---

**Ready to build the future of Web3? Start coding!** 🚀
