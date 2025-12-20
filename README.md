# 🚀 Lazor Starter

**Production-ready Universal Monorepo Starter for Lazorkit SDK**

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.3.0-black)](https://turbo.build/)
[![Solana](https://img.shields.io/badge/Solana-Mainnet%20%7C%20Devnet-purple)](https://solana.com/)
[![Gasless](https://img.shields.io/badge/Gasless-Enabled-green)](https://lazorkit.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0.3-black)](https://nextjs.org/)
[![Expo](https://img.shields.io/badge/Expo-52-blue)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-Custom-orange)](./LICENSE)

> **The Standard Setter** - A universal starter kit that demonstrates best practices for integrating Lazorkit SDK across Web (Next.js) and Mobile (Expo/React Native) platforms in a single monorepo.

## ✨ Why Lazor Starter?

Building Web3 applications shouldn't require wrestling with complex configurations, polyfills, and platform-specific code. Lazor Starter solves this by providing:

- ✅ **Universal Code Sharing** - Write once, run on Web (Next.js 15) and Mobile (Expo 52)
- ✅ **Passkey Authentication** - Face ID / Touch ID login out of the box (WebAuthn + Native Biometrics)
- ✅ **Gasless Transactions** - Zero-fee transactions via Lazorkit Paymaster
- ✅ **Smart Wallet** - Account abstraction powered by Lazorkit (100% onchain)
- ✅ **Production Ready** - TypeScript, proper error handling, comprehensive documentation
- ✅ **Network Support** - Seamless switching between Mainnet and Devnet

## 🎯 Features Comparison

| Feature | Traditional Wallet | Lazorkit Wallet (This Starter) |
|---------|-------------------|--------------------------------|
| **Authentication** | Seed phrase (risky, complex) | Passkey (Face ID / Touch ID) ✅ |
| **Gas Fees** | User pays SOL | Gasless (Paymaster sponsored) ✅ |
| **Account Type** | Keypair (single device) | Smart Wallet (multi-device) ✅ |
| **Onboarding** | Complex (seed phrase backup) | One-click (biometric) ✅ |
| **Cross-Platform** | Separate codebases | Shared code (monorepo) ✅ |
| **Mobile Support** | Limited | Full native support ✅ |

## 🏗️ Architecture

```
lazor-starter/
├── apps/
│   ├── web/                    # Next.js 15 (App Router)
│   │   ├── app/
│   │   │   ├── dashboard/       # Dashboard page
│   │   │   ├── store/          # E-commerce demo
│   │   │   └── api/            # Backend API routes
│   │   └── components/          # Web-specific components
│   └── mobile/                  # Expo 52 (React Native)
│       ├── app/                 # Expo Router screens
│       └── src/
│           ├── hooks/           # Mobile-specific hooks
│           └── polyfills.ts     # Solana Web3.js polyfills
├── packages/
│   ├── lazor-core/              # 🎯 Shared Lazorkit logic
│   │   ├── src/
│   │   │   ├── hooks/           # useAuth, useGaslessTx, useWalletBalance
│   │   │   ├── providers/       # WalletProvider
│   │   │   ├── utils/           # Storage, formatting, validation
│   │   │   └── types/           # TypeScript types
│   │   └── package.json
│   └── ui/                      # Shared UI components
│       └── src/
│           └── components/       # Reusable components
├── docs/                         # Comprehensive tutorials
│   ├── tutorial-1-setup-and-configuration.md
│   ├── tutorial-2-passkey-authentication.md
│   ├── tutorial-3-gasless-transactions.md
│   └── tutorial-4-advanced-features.md
├── .env.local                    # Environment variables (root)
├── turbo.json                    # Turborepo configuration
└── pnpm-workspace.yaml           # pnpm workspace configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ installed
- **pnpm** 8+ installed
- **iOS Simulator** or **Android Emulator** (for mobile development)
- **Expo Go** app (optional, for testing on physical device)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd lazor-starter

# Install all dependencies
pnpm install

# Build core package
cd packages/lazor-core
pnpm build
cd ../..
```

### Environment Configuration

Create `.env.local` in the **root directory**:

```env
# ===== MAINNET (PUBLIC) =====
# Replace with your own RPC URL (e.g., from Helius, QuickNode, or Alchemy)
NEXT_PUBLIC_LAZORKIT_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY_HERE
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://kora.lazorkit.com
# Get your API key from Lazorkit dashboard
NEXT_PUBLIC_LAZORKIT_API_KEY=YOUR_LAZORKIT_API_KEY_HERE

# ===== DEVNET (PUBLIC) =====
# Replace with your own devnet RPC URL
NEXT_PUBLIC_LAZORKIT_RPC_URL_DEVNET=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY_HERE
NEXT_PUBLIC_LAZORKIT_PORTAL_URL_DEVNET=https://portal.lazor.sh
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL_DEVNET=https://kora.devnet.lazorkit.com
```

**Important**: 
- Both Web and Mobile apps read from the same `.env.local` file.
- **Replace placeholders** (`YOUR_API_KEY_HERE`, `YOUR_LAZORKIT_API_KEY_HERE`) with your actual keys:
  - **RPC URLs**: Get from [Helius](https://helius.dev), [QuickNode](https://quicknode.com), or [Alchemy](https://alchemy.com)
  - **Lazorkit API Key**: Get from [Lazorkit Dashboard](https://lazorkit.com) (required for mainnet gasless transactions)

### Running the Apps

#### Web (Next.js)

```bash
# From root directory
pnpm dev

# Or from apps/web
cd apps/web
pnpm dev
```

**⚠️ IMPORTANT: HTTPS Required**

Web app will be available at: **https://localhost:3000** (note: **HTTPS**, not HTTP)

**Why HTTPS is Required:**
- **WebAuthn/Passkey** requires HTTPS for security (browser security policy)
- Passkey authentication will **NOT work** on HTTP, even on localhost
- The dev server automatically uses HTTPS via `--experimental-https` flag

**First Time Setup:**
- Accept the SSL certificate warning in your browser (safe for local development)
- Access the app via `https://localhost:3000`, not `http://localhost:3000`

#### Mobile (Expo)

```bash
# From root directory
cd apps/mobile
pnpm dev

# Or use Expo CLI
npx expo start
```

Scan the QR code with **Expo Go** app, or press:
- `i` for iOS Simulator
- `a` for Android Emulator

## 📚 Documentation

Comprehensive tutorials for both Web and Mobile:

- **[Tutorial 1: Setup and Configuration](./docs/tutorial-1-setup-and-configuration.md)** - Environment setup, provider configuration, polyfills
- **[Tutorial 2: Passkey Authentication](./docs/tutorial-2-passkey-authentication.md)** - Implementing Face ID / Touch ID login
- **[Tutorial 3: Gasless Transactions](./docs/tutorial-3-gasless-transactions.md)** - Sending tokens without gas fees
- **[Tutorial 4: Advanced Features](./docs/tutorial-4-advanced-features.md)** - Wallet balance, airdrops, network switching

Additional guides:
- [Quick Start Guide](./QUICK_START.md) - Quick reference
- [Backend Setup Guide](./docs/backend-setup.md) - Backend API configuration

## 🎓 What's Inside?

### `packages/lazor-core` - The Heart of the Project

Shared logic for both Web and Mobile platforms:

#### Hooks

- **`useAuth`** - Passkey authentication (login, logout, registration)
  ```tsx
  const { isLoggedIn, pubkey, registerNewWallet, logout } = useAuth();
  ```

- **`useWallet`** - Lazorkit SDK wrapper
  ```tsx
  const wallet = useWallet();
  ```

- **`useGaslessTx`** - Gasless transaction methods
  ```tsx
  const { transferSOL, transferSPLToken, sendTransaction } = useGaslessTx();
  ```

- **`useWalletBalance`** - Fetch SOL and USDC balances
  ```tsx
  const { solBalance, usdcBalance, solBalanceText, usdcBalanceText } = useWalletBalance(pubkey, usdcMint);
  ```

- **`useAirdrop`** - Request test tokens on devnet
  ```tsx
  const { requestSOLAirdrop, requestUSDCAirdrop } = useAirdrop();
  ```

#### Providers

- **`WalletProvider`** - Universal provider wrapper for Lazorkit SDK
  - Automatically configures RPC URL, Paymaster URL, Portal URL
  - Supports network switching (mainnet/devnet)
  - Handles environment variable loading

#### Utilities

- **Storage**: `getStorage()`, `initMobileStorage()` - Cross-platform storage
- **Formatting**: `formatAddress()`, `formatBalance()` - Display helpers
- **Validation**: `validateAddress()`, `isValidPublicKey()` - Address validation
- **Explorer**: `getExplorerUrl()` - Generate Solana explorer URLs

### `apps/web` - Next.js 15 Application

- **App Router** - Next.js 15 App Router with TypeScript
- **Tailwind CSS** - Utility-first CSS framework
- **API Routes** - Backend API for smart wallet creation
- **WalletProviderWrapper** - Automatic provider configuration

### `apps/mobile` - Expo 52 Application

- **Expo Router** - File-based routing
- **React Native** - Native mobile components
- **Polyfills** - Complete Solana Web3.js polyfills for React Native
- **Native Biometrics** - Face ID / Touch ID via `@lazorkit/wallet-mobile-adapter`
- **AsyncStorage** - Persistent storage for mobile

## 🔧 Tech Stack

### Core

- **Monorepo**: Turborepo 2.3.0 + pnpm 8+
- **Language**: TypeScript 5.0
- **State Management**: Zustand

### Web

- **Framework**: Next.js 15.0.3 (App Router)
- **React**: 18.3.1
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI

### Mobile

- **Framework**: Expo 52
- **React Native**: 0.76.3
- **Router**: Expo Router
- **Storage**: AsyncStorage

### Blockchain

- **SDK**: Lazorkit SDK 1.7.5+
- **Blockchain**: Solana (Mainnet & Devnet)
- **Web3**: @solana/web3.js
- **SPL Tokens**: @solana/spl-token

## ✅ Onchain Features

All features are **fully onchain** - no mocks:

- ✅ **Passkey Creation** - Real WebAuthn credentials (Web) + Native biometrics (Mobile)
- ✅ **Smart Wallet Creation** - Onchain PDA creation via Lazorkit Program
- ✅ **Token Transfers** - Real SOL and SPL token transfers
- ✅ **Gasless Transactions** - Real Paymaster integration (Mainnet & Devnet)
- ✅ **Network Switching** - Seamless switching between Mainnet and Devnet
- ✅ **Session Persistence** - Automatic session restoration across app reloads

## 🎯 Use Cases

This starter is perfect for:

- 🏪 **E-commerce** - "Pay with Solana" buttons with gasless transactions
- 💰 **P2P Payments** - Send tokens without gas fees
- 🎮 **Gaming** - In-game purchases with Passkey authentication
- 📱 **Mobile Wallets** - Native mobile wallet apps
- 🌐 **Web Apps** - Web3 dApps with better UX
- 🏦 **DeFi** - Decentralized finance applications
- 🎫 **NFT Marketplaces** - Gasless NFT transactions

## 🔑 Key Features Explained

### Universal Code Sharing

The `packages/lazor-core` package contains all shared logic:
- Authentication hooks work on both Web and Mobile
- Transaction logic is platform-agnostic
- Storage utilities abstract localStorage (Web) and AsyncStorage (Mobile)

### Passkey Authentication

- **Web**: Uses WebAuthn API (Face ID / Touch ID / Windows Hello)
- **Mobile**: Uses native biometric authentication via `@lazorkit/wallet-mobile-adapter`
- **Storage**: Automatic session persistence across app reloads

### Gasless Transactions

- **Zero Gas Fees**: All transactions sponsored by Lazorkit Paymaster
- **Mainnet & Devnet**: Support for both networks
- **SOL & SPL Tokens**: Transfer native SOL or any SPL token (USDC, USDT, etc.)

### Network Switching

Users can switch between Mainnet and Devnet:
- Separate wallets for each network
- Automatic RPC URL and Paymaster URL switching
- Network state persists in Zustand store

## 🐛 Troubleshooting

### "Missing environment variables"

- Ensure `.env.local` is in the **root directory**
- Check that all `NEXT_PUBLIC_*` variables are set
- Restart development server after changing `.env.local`

### "Buffer is not defined" (Web)

- Ensure `WalletProviderWrapper` is wrapping your app
- Check that `buffer` package is installed

### "Polyfills not loaded" (Mobile)

- Ensure `polyfills.ts` is imported **first** in `index.js`
- Check that all polyfill packages are installed

### "AsyncStorage not working" (Mobile)

- Ensure `@react-native-async-storage/async-storage` is installed
- Check that `initMobileStorage()` is called in `_layout.tsx`

### Build Errors

```bash
# Rebuild core package
cd packages/lazor-core
pnpm build
cd ../..
```

## 🤝 Contributing

This is a starter template for the **Lazorkit SDK Integration Bounty**. Contributions welcome!

## 📄 License

This project is licensed under a **custom license** designed to protect the work while allowing educational use. 

**Key Points:**
- ✅ **Permitted**: Study, learn, use as reference, fork for education, contribute improvements
- ❌ **Restricted**: Using this codebase as a submission for the same competitive event
- 📝 **Required**: Proper attribution when using or distributing

**Full License Terms**: See [LICENSE](./LICENSE) file for complete terms and conditions.

**Important**: This codebase is submitted for the "Lazorkit SDK Integration Bounty 2025". Please respect the competition restrictions outlined in the LICENSE file.

## 🙏 Acknowledgments

Built with ❤️ for the Lazorkit community. Special thanks to:
- Lazorkit team for the amazing SDK
- Solana Foundation for the blockchain infrastructure
- RampFi project for inspiration

---

**Ready to build the future of Web3? Start coding!** 🚀
