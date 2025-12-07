# Setup Guide

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start development:**
   ```bash
   pnpm dev
   ```

## Environment Variables

All environment variables are in `.env.local` at the root. Both Web and Mobile apps will read from this file.

### Required Variables

- `NEXT_PUBLIC_LAZORKIT_RPC_URL` - Solana RPC endpoint
- `NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL` - Lazorkit Paymaster URL (for gasless)
- `NEXT_PUBLIC_LAZORKIT_PORTAL_URL` - Lazorkit Portal URL
- `PRIVATE_KEY` - Admin keypair for smart wallet creation (base58 encoded)

### Backend API

The Next.js API route `/api/orders/create-smart-wallet` requires:
- `PRIVATE_KEY` - Admin keypair
- `RPC_URL` - Solana RPC endpoint
- `SMART_WALLET_INIT_LAMPORTS` - Initial funding for smart wallet

## Testing

### Web
- Open http://localhost:3000
- Click "Login with Passkey"
- Use Face ID / Touch ID
- Wallet will be created onchain (devnet)

### Mobile
- Run `pnpm dev` in root
- Scan QR code with Expo Go app
- Test passkey login on device

## Troubleshooting

**"Missing PRIVATE_KEY"**
- Make sure `.env.local` exists in root
- Check that `PRIVATE_KEY` is set

**"Failed to create smart wallet"**
- Check RPC URL is accessible
- Verify admin keypair has SOL (will auto-airdrop on devnet)
- Check browser console for detailed errors

**"Passkey not available"**
- Make sure you're on HTTPS (or localhost)
- Check browser supports WebAuthn
- For mobile, ensure biometrics are enabled

