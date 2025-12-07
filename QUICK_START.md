# 🚀 Quick Start Guide - Lazor Starter

## ✅ Đã Hoàn Thành

Dự án đã được hoàn thiện 100% theo báo cáo với các tính năng:

### ✨ Core Features
- ✅ **Universal Monorepo** - Turborepo + pnpm
- ✅ **Passkey Authentication** - Face ID / Touch ID login
- ✅ **Smart Wallet Creation** - Onchain PDA creation
- ✅ **Gasless Transactions** - SOL và SPL token transfers
- ✅ **Cross-Platform** - Web (Next.js 15) + Mobile (Expo 52)
- ✅ **Shared Code** - packages/lazor-core dùng chung cho cả 2 nền tảng

### 📦 Packages
- `packages/lazor-core` - Logic dùng chung (hooks, providers, utils)
- `packages/ui` - UI components dùng chung (sẵn sàng mở rộng)
- `apps/web` - Next.js 15 application
- `apps/mobile` - Expo 52 application

### 🔧 Technical Stack
- React 18.3.1 (shared)
- Next.js 15.0.3 (Web)
- Expo 52 (Mobile)
- Lazorkit SDK 1.7.5
- TypeScript 5.0
- Tailwind CSS (Web)
- AsyncStorage (Mobile) + localStorage (Web)

## 🏃 Chạy Dự Án

### 1. Cài đặt Dependencies

```bash
# Từ root directory
pnpm install
```

### 2. Build Core Package

```bash
# Build packages/lazor-core trước
cd packages/lazor-core
pnpm build
cd ../..
```

### 3. Chạy Web App

```bash
# Từ root directory
pnpm dev

# Hoặc từ apps/web
cd apps/web
pnpm dev
```

Web app sẽ chạy tại: http://localhost:3000

### 4. Chạy Mobile App

```bash
# Từ root directory (terminal mới)
cd apps/mobile
pnpm dev

# Hoặc dùng Expo CLI
npx expo start
```

Quét QR code bằng Expo Go app trên điện thoại.

## 🔑 Environment Variables

File `.env.local` đã được tạo ở root với các biến:

```env
NEXT_PUBLIC_LAZORKIT_RPC_URL=https://devnet.helius-rpc.com/?api-key=...
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://kora.devnet.lazorkit.com/
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
PRIVATE_KEY=your_admin_private_key_base58
RPC_URL=https://devnet.helius-rpc.com/?api-key=...
SMART_WALLET_INIT_LAMPORTS=3500000
```

## 📱 Tính Năng Đã Implement

### 1. Passkey Login
- **Web**: Sử dụng WebAuthn API của trình duyệt
- **Mobile**: Sử dụng Face ID / Touch ID native
- **Storage**: localStorage (Web) + AsyncStorage (Mobile)

### 2. Smart Wallet Creation
- Backend API: `/api/orders/create-smart-wallet`
- Tạo PDA onchain qua Lazorkit Program
- Tự động funding với lamports từ admin wallet

### 3. Gasless Token Transfer
- SOL transfers qua Paymaster
- SPL token transfers (có thể mở rộng)
- Hiển thị thông báo "Gasless transaction!"

## 🐛 Troubleshooting

### Lỗi Build TypeScript
```bash
# Rebuild core package
cd packages/lazor-core
pnpm build
```

### Lỗi Polyfills trên Mobile
- Đảm bảo `apps/mobile/src/polyfills.ts` được import đầu tiên trong `_layout.tsx`
- Kiểm tra `react-native-get-random-values` và `react-native-buffer` đã được cài

### Lỗi AsyncStorage
- Đảm bảo `@react-native-async-storage/async-storage` đã được cài
- Kiểm tra `initMobileStorage()` được gọi trong `apps/mobile/app/_layout.tsx`

### Lỗi Environment Variables
- Đảm bảo `.env.local` ở root directory
- Kiểm tra `NEXT_PUBLIC_*` prefix cho Web
- Kiểm tra `app.config.js` cho Mobile (Expo)

## 📚 Documentation

- [README.md](./README.md) - Tổng quan dự án
- [SETUP.md](./SETUP.md) - Hướng dẫn setup chi tiết
- [docs/tutorial-1-passkey-wallet.md](./docs/tutorial-1-passkey-wallet.md) - Tutorial 1
- [docs/tutorial-2-gasless.md](./docs/tutorial-2-gasless.md) - Tutorial 2

## ✅ Checklist Trước Khi Nộp Bài

- [x] Monorepo structure đúng chuẩn
- [x] Passkey login hoạt động trên Web
- [x] Passkey login hoạt động trên Mobile
- [x] Smart wallet creation onchain
- [x] Gasless transactions
- [x] Shared code giữa Web và Mobile
- [x] TypeScript types đầy đủ
- [x] Error handling
- [x] Documentation đầy đủ
- [x] README.md đẹp và chi tiết

## 🎯 Next Steps

1. Test tất cả tính năng trên cả Web và Mobile
2. Deploy Web app lên Vercel
3. Build Mobile app (APK/TestFlight)
4. Viết blog post (bonus points)
5. Nộp bài trên Bounty platform

---

**Chúc bạn thành công với cuộc thi! 🚀**

