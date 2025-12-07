# Environment Variables Setup

## Overview

All environment variables are stored in `.env.local` at the **root** of the monorepo. Both Web (Next.js) and Mobile (Expo) apps read from this single file.

## Quick Setup

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Update the values in `.env.local` with your actual credentials.

## Variable Reference

### Lazorkit Configuration (Shared)

These variables are prefixed with `NEXT_PUBLIC_` so they're available in both Web and Mobile:

- `NEXT_PUBLIC_LAZORKIT_RPC_URL` - Solana RPC endpoint (devnet)
- `NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL` - Lazorkit Paymaster URL for gasless transactions
- `NEXT_PUBLIC_LAZORKIT_PORTAL_URL` - Lazorkit Portal URL
- `NEXT_PUBLIC_LAZORKIT_PASSKEY_TIMEOUT_MS` - Passkey timeout in milliseconds

### Backend API

- `NEXT_PUBLIC_API_BASE_URL` - Base URL for backend API (default: http://localhost:3001)
- `APP_BASE_URL` - Frontend app URL (default: http://localhost:3000)

### Backend Server (for Smart Wallet Creation)

These are used by the Next.js API route `/api/orders/create-smart-wallet`:

- `RPC_URL` - Solana RPC endpoint (same as LAZORKIT_RPC_URL)
- `LAZORKIT_RPC_URL` - Alternative name for RPC_URL
- `PRIVATE_KEY` - Admin keypair (base58 encoded) for signing wallet creation transactions
- `SMART_WALLET_INIT_LAMPORTS` - Initial funding for smart wallet (default: 3500000 = 0.0035 SOL)
- `MIN_FEE_LAMPORTS` - Minimum SOL balance for admin (default: 5000000)
- `AIRDROP_LAMPORTS` - Amount to airdrop if admin balance is low (default: 1000000000 = 1 SOL)

### CORS

- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins for CORS

## How It Works

### Web (Next.js)

Next.js automatically loads `.env.local` from the root directory. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

### Mobile (Expo)

Expo reads environment variables from:
1. Root `.env.local` file
2. `app.config.js` `extra` field
3. `process.env` (fallback)

The `app.config.js` file maps environment variables to `Constants.expoConfig.extra`, which are then read by the app.

## Security Notes

- **Never commit `.env.local`** - It's in `.gitignore`
- **PRIVATE_KEY** - Keep this secret! It's used to sign onchain transactions
- **API Keys** - Don't share your RPC API keys publicly

## Troubleshooting

**Variables not loading in Mobile:**
- Check `app.config.js` has the `extra` field configured
- Restart Expo dev server after changing `.env.local`
- Use `Constants.expoConfig.extra` to access variables in code

**Variables not loading in Web:**
- Ensure `.env.local` is in the root directory
- Restart Next.js dev server after changing `.env.local`
- Check `next.config.mjs` has the `env` field configured

**Backend API not working:**
- Verify `PRIVATE_KEY` is set correctly (base58 format)
- Check RPC URL is accessible
- Ensure admin keypair has SOL (will auto-airdrop on devnet)

