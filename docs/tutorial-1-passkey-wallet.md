# Tutorial 1: Building Your First Passkey Wallet in 5 Minutes

This tutorial will guide you through creating a Passkey-authenticated wallet using Lazorkit SDK.

## Prerequisites

- Node.js 18+ installed
- pnpm installed
- Basic knowledge of React/Next.js

## Step 1: Setup

Clone and install dependencies:

```bash
git clone <repo-url>
cd lazor-starter
pnpm install
```

## Step 2: Configure Environment

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_LAZORKIT_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=your_paymaster_url
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=your_portal_url
```

## Step 3: Wrap Your App

In `apps/web/app/layout.tsx`, wrap your app with `LazorProvider`:

```tsx
import { LazorProvider } from '@lazor-starter/core';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LazorProvider>
          {children}
        </LazorProvider>
      </body>
    </html>
  );
}
```

## Step 4: Use the Auth Hook

In any component, use `useLazorAuth`:

```tsx
'use client';

import { useLazorAuth } from '@lazor-starter/core';

export default function LoginPage() {
  const { isLoggedIn, pubkey, registerNewWallet, logout } = useLazorAuth();

  const handleLogin = async () => {
    try {
      const { walletAddress } = await registerNewWallet();
      console.log('Wallet created:', walletAddress);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isLoggedIn) {
    return (
      <div>
        <p>Wallet: {pubkey}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <button onClick={handleLogin}>
      Login with Passkey
    </button>
  );
}
```

## Step 5: Test It

1. Run `pnpm dev` in the root
2. Open http://localhost:3000
3. Click "Login with Passkey"
4. Use Face ID / Touch ID when prompted
5. Your wallet is created! 🎉

## How It Works

1. **Passkey Creation**: `registerNewWallet()` calls the browser's WebAuthn API
2. **Smart Wallet**: Backend creates a Solana smart wallet linked to your passkey
3. **Session Persistence**: Wallet state is saved to localStorage

## Next Steps

- Check out [Tutorial 2](./tutorial-2-gasless.md) to learn about gasless transactions
- Explore the dashboard to see your wallet address
- Try sending SOL to another address

## Troubleshooting

**"Passkey login not available"**
- Make sure `LazorProvider` is wrapping your app
- Check that environment variables are set correctly

**"Failed to create smart wallet"**
- Ensure backend API is running (see [Backend Setup](./backend-setup.md))
- Check browser console for detailed errors

## Summary

In just 5 minutes, you've:
- ✅ Set up Lazorkit SDK
- ✅ Created a Passkey-authenticated wallet
- ✅ Implemented login/logout flow

Congratulations! You're now ready to build Web3 apps with the best UX. 🚀

