# Backend Setup Guide

This guide explains how to set up the backend server for smart wallet creation.

## Overview

The frontend calls `/api/orders/create-smart-wallet` to create smart wallets. This endpoint requires:

- Lazorkit backend SDK
- Solana connection
- Admin keypair (for signing wallet creation transactions)

## Option 1: Use Existing Backend (Recommended for Demo)

If you have access to the RampFi backend, you can point the frontend to it:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com
```

## Option 2: Setup Local Backend

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

Required packages:
- `@lazorkit/wallet` (backend version)
- `@solana/web3.js`
- `bs58`
- `express`

### Step 2: Environment Variables

Create `.env`:

```env
RPC_URL=https://api.devnet.solana.com
LAZORKIT_RPC_URL=https://api.devnet.solana.com
PRIVATE_KEY=your_admin_private_key_base58
SMART_WALLET_INIT_LAMPORTS=5000000
```

### Step 3: Implement Endpoint

Copy the implementation from `src/routes/orders.js` in RampFi:

```javascript
router.post('/create-smart-wallet', async (req, res) => {
  // Full implementation from RampFi
  // See: D:\rampfi-web-app\src\routes\orders.js:920-1063
});
```

### Step 4: Run Server

```bash
node server.js
```

## Option 3: Mock Backend (Development Only)

For development/testing, you can use the mock API route in `apps/web/app/api/orders/create-smart-wallet/route.ts`.

**Note**: This won't create real wallets on-chain. Use only for UI testing.

## Production Considerations

- **Security**: Never expose `PRIVATE_KEY` in frontend code
- **Rate Limiting**: Implement rate limiting on wallet creation
- **Error Handling**: Proper error messages and logging
- **Monitoring**: Track wallet creation success/failure rates

## Next Steps

- See [Tutorial 1](./tutorial-1-passkey-wallet.md) for frontend integration
- Check Lazorkit documentation for latest SDK changes

