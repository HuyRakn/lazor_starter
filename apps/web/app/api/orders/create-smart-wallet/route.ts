import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { Buffer } from 'buffer';
import { createHash } from 'crypto';

// Load environment variables from root .env.local
// Next.js automatically loads .env.local from project root, but we need to ensure it's accessible
if (typeof process !== 'undefined') {
  // Ensure env vars are loaded (Next.js should handle this, but adding safety check)
  const rootEnvPath = require('path').join(process.cwd(), '../../.env.local');
  try {
    // Next.js already loads .env.local, but we can verify
    if (!process.env.PRIVATE_KEY) {
      console.warn('⚠️ PRIVATE_KEY not found in process.env. Make sure .env.local is in root directory.');
    }
  } catch (e) {
    // Ignore - Next.js will handle env loading
  }
}

// Import SDK package - load main package directly
// Lazy load to avoid localStorage errors in Next.js API routes
function loadLazorkitWallet(): any {
  try {
    // Use require for CommonJS modules (works in Next.js API routes)
    const LazorkitWallet = require('@lazorkit/wallet');
    console.log('✅ Loaded Lazorkit SDK:', {
      hasLazorKit: !!LazorkitWallet?.LazorKit,
      hasDefault: !!LazorkitWallet?.default?.LazorKit,
      keys: Object.keys(LazorkitWallet || {}).slice(0, 5),
    });
    return LazorkitWallet;
  } catch (e) {
    console.error('❌ Failed to load @lazorkit/wallet:', e);
    return null;
  }
}

// Load BN.js (required for wallet ID handling)
let BN: any = null;
  try {
  BN = require('bn.js');
  } catch (_) {
  // BN not available, will use fallback in normalizePasskeyData
}

// Helper: Convert any format to Uint8Array
function toUint8Array(input: any): Uint8Array | any {
  if (!input) return input;

  // Already Uint8Array
  if (input instanceof Uint8Array) return input;

  // Buffer
  if (Buffer.isBuffer(input)) return new Uint8Array(input);

  // Array or array-like object
  if (typeof input === 'object') {
    if (Array.isArray(input)) {
      return new Uint8Array(input);
    }
    const keys = Object.keys(input);
    if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) {
      const arr = [];
      for (let i = 0; i < keys.length; i++) {
        arr.push(input[i]);
      }
      return new Uint8Array(arr);
    }
  }

  // Base64url string
  if (typeof input === 'string') {
    try {
      let s = input.replace(/-/g, '+').replace(/_/g, '/');
      const pad = s.length % 4;
      if (pad) s += '='.repeat(4 - pad);
      const buf = Buffer.from(s, 'base64');
      return new Uint8Array(buf);
    } catch (err) {
      console.error('Failed to decode base64url:', err);
    }
  }

  return input;
}

// Minimal BN-like shim when bn.js is unavailable
function makeBnLike(bytes: any) {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes || []);
  return {
    toArrayLike(Type: any, endian: any, length?: number) {
      const b = Buffer.from(buf);
      let out = b;
      if (length) {
        if (b.length > length) out = b.slice(b.length - length);
        else if (b.length < length)
          out = Buffer.concat([Buffer.alloc(length - b.length, 0), b]);
      }
      if (Type === Buffer) return out;
      if (Type === Uint8Array) return new Uint8Array(out);
      return Array.from(out);
    },
  };
}

// Helper: convert base64url -> standard base64
function fromBase64Url(b64url: string): string {
  try {
    if (!b64url || typeof b64url !== 'string') return b64url;
    let s = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad) s += '='.repeat(4 - pad);
    return s;
  } catch (_) {
    return b64url;
  }
}

// Helper: compress P-256 point (x,y) to 33-byte compressed key, return base64 string
function compressP256ToBase64(xBn: any, yBn: any): string | null {
  if (!xBn || !yBn) return null;
  try {
    const xBuf = Buffer.isBuffer(xBn)
      ? xBn
      : Buffer.from(xBn.toArrayLike(Buffer, 'be', 32));
    const yBuf = Buffer.isBuffer(yBn)
      ? yBn
      : Buffer.from(yBn.toArrayLike(Buffer, 'be', 32));
    const yIsEven = yBuf[yBuf.length - 1] % 2 === 0;
    const prefix = Buffer.from([yIsEven ? 0x02 : 0x03]);
    const comp = Buffer.concat([prefix, xBuf]);
    return comp.toString('base64');
  } catch (e) {
    console.error('Failed to compress P-256 pubkey:', e);
    return null;
  }
}

// Normalize passkey data for SDK backend
function normalizePasskeyData(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;

  console.log('🔍 Normalizing passkey data, input types:', {
    credentialId: typeof raw.credentialId,
    userId: typeof raw.userId,
    hasPublicKey: !!raw.publicKey,
    publicKeyX: raw.publicKey?.x
      ? raw.publicKey.x.constructor?.name || typeof raw.publicKey.x
      : 'missing',
    publicKeyY: raw.publicKey?.y
      ? raw.publicKey.y.constructor?.name || typeof raw.publicKey.y
      : 'missing',
  });

  const out = { ...raw };

  // CRITICAL: Preserve smartWalletId, walletId, smartWalletID from raw
  // These fields are used to reuse existing wallets
  if ((raw as any)?.smartWalletId) {
    out.smartWalletId = (raw as any).smartWalletId;
  }
  if ((raw as any)?.walletId) {
    out.walletId = (raw as any).walletId;
  }
  if ((raw as any)?.smartWalletID) {
    out.smartWalletID = (raw as any).smartWalletID;
  }

  // credentialId and userId can be base64url strings
  if (out.credentialId && typeof out.credentialId !== 'string') {
    const buf = Buffer.from(out.credentialId);
    out.credentialId = buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
  if (out.userId && typeof out.userId !== 'string') {
    const buf = Buffer.from(out.userId);
    out.userId = buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  // CRITICAL: publicKey can be in multiple formats:
  // 1. Array-like object with numeric keys (serialized Uint8Array) - e.g. {0: 3, 1: 228, ...}
  // 2. Object with x/y coordinates - {x: Uint8Array, y: Uint8Array}
  // 3. String (base64) - already handled
  // We need to preserve the original format for extraction later
  if (out.publicKey && typeof out.publicKey === 'object') {
    // Check if it's array-like (has numeric keys)
    const keys = Object.keys(out.publicKey);
    const isArrayLike = keys.length > 0 && keys.every(k => /^\d+$/.test(k));
    
    if (isArrayLike) {
      // Keep as-is (array-like object) - will be extracted later
      console.log('✅ publicKey is array-like object, length:', keys.length);
      // Don't modify it here, extract it later in the main function
    } else if (out.publicKey.x || out.publicKey.y) {
      // Has x/y coordinates - convert to Uint8Array
    const pk = { ...out.publicKey };

      // Convert to Uint8Array regardless of input format (same as RampFi)
    if (pk.x) {
        pk.x = toUint8Array(pk.x);
      console.log(
          '✅ Converted publicKey.x to Uint8Array, length:',
          pk.x?.length
      );
    }
    if (pk.y) {
        pk.y = toUint8Array(pk.y);
      console.log(
          '✅ Converted publicKey.y to Uint8Array, length:',
          pk.y?.length
      );
    }

    out.publicKey = pk;
    } else {
      // Unknown format, keep as-is
      console.warn('⚠️ publicKey is object but not array-like and has no x/y coordinates');
    }
  }

  console.log('✅ Normalized passkey data:', {
    credentialId: out.credentialId?.slice(0, 10) + '...',
    publicKeyXType: out.publicKey?.x?.constructor?.name,
    publicKeyYType: out.publicKey?.y?.constructor?.name,
  });

  return out;
}

export async function POST(request: NextRequest) {
  try {
    // Read request body once
    const requestBody = await request.json();
    const { passkeyData, userPrivateKey } = requestBody;

    if (!passkeyData) {
      return NextResponse.json({ error: 'Missing passkeyData' }, { status: 400 });
    }

    // Debug: Log raw passkey data structure
    console.log('📦 Raw passkey data keys:', Object.keys(passkeyData || {}));
    console.log('📦 Passkey data structure:', {
      hasCredentialId: !!passkeyData.credentialId,
      hasPasskeyPublicKey: !!passkeyData.passkeyPublicKey,
      hasPublicKeyBase64: !!passkeyData.publicKeyBase64,
      hasPublicKey: !!passkeyData.publicKey,
      publicKeyType: typeof passkeyData.publicKey,
      publicKeyKeys: passkeyData.publicKey ? Object.keys(passkeyData.publicKey) : [],
    });

    // Lazy load LazorkitWallet to avoid localStorage errors in Next.js API routes
    const LazorkitWallet = loadLazorkitWallet();
    if (!LazorkitWallet) {
      return NextResponse.json(
        { error: 'Failed to load Lazorkit SDK. Make sure @lazorkit/wallet is installed.' },
        { status: 500 }
      );
    }

    // CRITICAL: Always use devnet RPC for this starter
    // This ensures 100% onchain devnet, no mocks
    const rpcUrl =
      process.env.RPC_URL ||
      process.env.LAZORKIT_RPC_URL ||
      'https://api.devnet.solana.com'; // Default to devnet
    
    // Validate RPC URL is devnet (safety check)
    if (!rpcUrl.includes('devnet') && !rpcUrl.includes('localhost')) {
      console.warn(
        '⚠️ WARNING: RPC URL does not appear to be devnet. This starter is designed for devnet only.',
        { rpcUrl }
      );
    }
    
    const connection = new Connection(rpcUrl, 'confirmed');

    // Admin signer - Use user's private key from request, fallback to env
    const adminSecret = userPrivateKey || process.env.PRIVATE_KEY;
    
    if (!adminSecret) {
      console.error('❌ PRIVATE_KEY missing. User must provide private key for testing.');
      return NextResponse.json(
        { 
          error: 'Missing PRIVATE_KEY for wallet creation',
          hint: 'Please provide your private key in the login form. This is required for testing smart wallet creation on devnet.',
          requiresPrivateKey: true,
        },
        { status: 400 }
      );
    }
    
    let adminKeypair: Keypair;
    try {
      adminKeypair = Keypair.fromSecretKey(bs58.decode(adminSecret));
    } catch (error) {
      console.error('❌ Invalid PRIVATE_KEY format:', error);
      return NextResponse.json(
        { 
          error: 'Invalid PRIVATE_KEY format',
          hint: 'Private key must be a valid base58 encoded Solana private key.',
        },
        { status: 400 }
      );
    }

    // Normalize and extract required fields
    const normalized = normalizePasskeyData(passkeyData);
    
    // CRITICAL: Log passkeyData structure to debug smartWalletId
    console.log('🔍 Raw passkeyData keys:', Object.keys(passkeyData || {}));
    console.log('🔍 passkeyData.smartWalletId:', (passkeyData as any)?.smartWalletId);
    console.log('🔍 passkeyData.walletId:', (passkeyData as any)?.walletId);
    console.log('🔍 passkeyData.smartWalletID:', (passkeyData as any)?.smartWalletID);
    console.log('🔍 normalized.smartWalletId:', normalized?.smartWalletId);
    console.log('🔍 normalized.walletId:', normalized?.walletId);
    console.log('🔍 normalized.smartWalletID:', normalized?.smartWalletID);
    
    // credentialIdBase64 should be standard base64 (not base64url)
    // Convert from base64url if needed
    let credentialIdBase64 =
      fromBase64Url(normalized?.credentialId || normalized?.credentialID) ||
      normalized?.credentialId ||
      normalized?.credentialID;
    
    // Validate credentialIdBase64
    if (!credentialIdBase64 || typeof credentialIdBase64 !== 'string') {
      console.error('❌ Missing credentialIdBase64');
      return NextResponse.json(
        { error: 'Missing credentialId. Passkey data must include credentialId.' },
        { status: 400 }
      );
    }
    
    // Check if credentialId needs to be hashed to 32 bytes (CREDENTIAL_HASH_SIZE)
    // SDK expects credentialIdBase64 to decode to exactly 32 bytes
    try {
      const decoded = Buffer.from(credentialIdBase64, 'base64');
      if (decoded.length !== 32) {
        console.log('⚠️ CredentialId is', decoded.length, 'bytes, hashing to 32 bytes (CREDENTIAL_HASH_SIZE)');
        // Hash credentialId to 32 bytes using SHA-256
        const hash = createHash('sha256').update(decoded).digest();
        credentialIdBase64 = hash.toString('base64');
        console.log('✅ Hashed credentialId to 32 bytes, new base64 length:', credentialIdBase64.length);
      }
    } catch (e) {
      console.warn('⚠️ Failed to validate/hash credentialIdBase64:', e);
    }
    
    console.log('✅ CredentialIdBase64 length:', credentialIdBase64.length);
    
    // Extract passkeyPublicKey - can be in multiple formats
    // From log: publicKey is array-like object (keys '0' to '43') = 44 bytes raw
    // This could be uncompressed key (65 bytes) or compressed (33 bytes) + padding
    let passkeyPublicKeyBase64: string | null = null;
    
    console.log('🔍 Extracting passkeyPublicKey, normalized.publicKey type:', typeof normalized?.publicKey);
    
    // Method 1: Direct passkeyPublicKey or publicKeyBase64 string
    if (normalized?.passkeyPublicKey && typeof normalized.passkeyPublicKey === 'string') {
      passkeyPublicKeyBase64 = normalized.passkeyPublicKey;
      console.log('✅ Got passkeyPublicKey from normalized.passkeyPublicKey (string)');
    } else if (normalized?.publicKeyBase64 && typeof normalized.publicKeyBase64 === 'string') {
      passkeyPublicKeyBase64 = normalized.publicKeyBase64;
      console.log('✅ Got passkeyPublicKey from normalized.publicKeyBase64 (string)');
    }
    // Method 2: publicKey is array-like (Uint8Array serialized as object with numeric keys)
    // CRITICAL: Check this BEFORE checking for string, because JSON.parse may return object even if original was string
    else if (normalized?.publicKey && typeof normalized.publicKey === 'object') {
      // Check if it's array-like (has numeric keys like '0', '1', '2'...)
      const keys = Object.keys(normalized.publicKey);
      const isArrayLike = keys.length > 0 && keys.every(k => /^\d+$/.test(k));
      
      console.log('🔍 publicKey is object, keys length:', keys.length, 'isArrayLike:', isArrayLike);
      
      if (isArrayLike) {
        // Convert array-like object to Uint8Array
        const bytes = new Uint8Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
          bytes[i] = normalized.publicKey[i];
        }
        
        console.log('✅ Converted array-like publicKey to bytes, length:', bytes.length);
        
        // If 44 bytes, might be uncompressed (65 bytes) truncated or compressed (33 bytes) + padding
        // If 65 bytes, it's uncompressed (0x04 + 32 bytes x + 32 bytes y)
        // If 33 bytes, it's compressed (0x02/0x03 + 32 bytes x)
        // Take first 33 bytes if longer (compressed format)
        const compressedKey = bytes.length >= 33 ? bytes.slice(0, 33) : bytes;
        passkeyPublicKeyBase64 = Buffer.from(compressedKey).toString('base64');
        console.log('✅ Converted array-like publicKey to base64:', {
          originalLength: bytes.length,
          compressedLength: compressedKey.length,
          base64Length: passkeyPublicKeyBase64.length,
        });
      } else if (normalized.publicKey.x && normalized.publicKey.y) {
        // Method 3: Construct from x/y coordinates
      const xBn = normalized.publicKey.x;
      const yBn = normalized.publicKey.y;
      passkeyPublicKeyBase64 = compressP256ToBase64(xBn, yBn);
        console.log('✅ Constructed passkeyPublicKey from x/y coordinates');
      } else {
        console.warn('⚠️ publicKey is object but not array-like and has no x/y coordinates');
      }
    }
    // Method 4: publicKey is string (base64) - check this last
    else if (normalized?.publicKey && typeof normalized.publicKey === 'string') {
      passkeyPublicKeyBase64 = normalized.publicKey;
      console.log('✅ Got passkeyPublicKey from normalized.publicKey (string)');
    }
    
    // Validate passkeyPublicKeyBase64 exists
    if (!passkeyPublicKeyBase64 || typeof passkeyPublicKeyBase64 !== 'string') {
      console.error('❌ Missing passkeyPublicKey. Normalized data:', {
        hasPasskeyPublicKey: !!normalized?.passkeyPublicKey,
        hasPublicKeyBase64: !!normalized?.publicKeyBase64,
        publicKeyType: typeof normalized?.publicKey,
        publicKeyIsArray: Array.isArray(normalized?.publicKey),
        publicKeyKeys: normalized?.publicKey ? Object.keys(normalized.publicKey).slice(0, 10) : [],
        hasPublicKeyX: !!normalized?.publicKey?.x,
        hasPublicKeyY: !!normalized?.publicKey?.y,
      });
      return NextResponse.json(
        { error: 'Missing passkeyPublicKey. Passkey data must include passkeyPublicKey, publicKeyBase64, or publicKey (array-like or x/y coordinates).' },
        { status: 400 }
      );
    }
    
    console.log('✅ PasskeyPublicKeyBase64 length:', passkeyPublicKeyBase64.length);

    // CRITICAL: Read smartWalletId from both raw passkeyData and normalized
    // Frontend sends smartWalletId in passkeyData, but normalizePasskeyData may not preserve it
    let smartWalletIdRaw =
      (passkeyData as any)?.smartWalletId || // Prioritize raw passkeyData
      (passkeyData as any)?.walletId ||
      (passkeyData as any)?.smartWalletID ||
      normalized?.smartWalletId ||
      normalized?.walletId ||
      normalized?.smartWalletID;

    console.log('🔍 smartWalletIdRaw after extraction:', smartWalletIdRaw ? String(smartWalletIdRaw) : 'null');

    // Try different class names (SDK version may vary)
    // LazorkitClient is the main client (has createSmartWalletTxn)
    // DefaultPolicyClient is for policy management only
    // Old versions use LazorKit (wrapper that has getLazorkitClient())
    const LazorKitCls =
      LazorkitWallet?.LazorKit ||
      LazorkitWallet?.LazorkitClient ||
      LazorkitWallet?.DefaultPolicyClient ||
      LazorkitWallet?.default?.LazorKit ||
      LazorkitWallet?.default?.LazorkitClient;
    
    if (typeof LazorKitCls !== 'function') {
      console.error('❌ LazorKit class not found. Available keys:', Object.keys(LazorkitWallet || {}).slice(0, 20));
      return NextResponse.json(
        { error: 'LazorKit class not available from @lazorkit/wallet. Available: ' + Object.keys(LazorkitWallet || {}).slice(0, 10).join(', ') },
        { status: 500 }
      );
    }
    
    console.log('✅ Found LazorKit class:', LazorKitCls.name || 'unnamed');
    const sdk = new LazorKitCls(connection);
    
    // Get client - different SDK versions have different structures
    let client = null;
    
    // Method 1: If SDK is LazorkitClient, it IS the client (has createSmartWalletTxn)
    if (sdk && typeof sdk.createSmartWalletTxn === 'function') {
      client = sdk;
      console.log('✅ SDK is LazorkitClient (has createSmartWalletTxn)');
    }
    // Method 2: Old LazorKit wrapper has getLazorkitClient()
    else if (typeof sdk.getLazorkitClient === 'function') {
      try {
        client = sdk.getLazorkitClient();
        console.log('✅ Got client via getLazorkitClient()');
      } catch (e) {
        console.warn('⚠️ getLazorkitClient() failed:', e);
      }
    }
    // Method 3: Alternative getClient()
    else if (typeof sdk.getClient === 'function') {
      try {
        client = sdk.getClient();
        console.log('✅ Got client via getClient()');
      } catch (e) {
        console.warn('⚠️ getClient() failed:', e);
      }
    }
    // Method 4: Check client property
    else if (sdk && sdk.client) {
      client = sdk.client;
      console.log('✅ Got client via sdk.client property');
    }
    
    if (!client) {
      console.error('❌ LazorKit client unavailable. SDK type:', sdk?.constructor?.name);
      console.error('SDK has createSmartWalletTxn:', typeof sdk?.createSmartWalletTxn === 'function');
      console.error('SDK methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(sdk || {})).slice(0, 15));
      return NextResponse.json(
        { error: 'LazorKit client unavailable. SDK type: ' + (sdk?.constructor?.name || 'unknown') },
        { status: 500 }
      );
    }

    console.log('✅ Got LazorKit client:', client?.constructor?.name || 'unknown');

    // CRITICAL: Check if wallet already exists for this passkey
    // This prevents creating duplicate wallets for the same passkey
    let existingWalletAddress: string | null = null;
    
    console.log('🔍 Checking for existing wallet...');
    console.log('🔍 credentialIdBase64 length:', credentialIdBase64?.length);
    console.log('🔍 passkeyPublicKeyBase64 length:', passkeyPublicKeyBase64?.length);
    console.log('🔍 client methods:', {
      hasGetSmartWalletByCredentialId: typeof client.getSmartWalletByCredentialId === 'function',
      hasGetSmartWalletByPasskey: typeof client.getSmartWalletByPasskey === 'function',
    });
    
    try {
      // Method 1: Try getSmartWalletByCredentialId
      if (typeof client.getSmartWalletByCredentialId === 'function' && credentialIdBase64) {
        try {
          console.log('🔍 Calling getSmartWalletByCredentialId...');
          const result = await client.getSmartWalletByCredentialId(credentialIdBase64);
          console.log('🔍 getSmartWalletByCredentialId result:', {
            hasResult: !!result,
            hasSmartWallet: !!result?.smartWallet,
            smartWalletType: typeof result?.smartWallet,
          });
          if (result?.smartWallet) {
            const addr = result.smartWallet?.toBase58?.() || result.smartWallet?.toString?.() || result.smartWallet;
            if (addr) {
              existingWalletAddress = String(addr);
              console.log('✅ Found existing wallet by credentialId:', existingWalletAddress);
            }
          } else {
            console.log('ℹ️ getSmartWalletByCredentialId returned no wallet (wallet may not exist yet)');
          }
        } catch (e: any) {
          console.log('ℹ️ getSmartWalletByCredentialId error (wallet may not exist yet):', e?.message || String(e));
        }
      } else {
        console.log('ℹ️ getSmartWalletByCredentialId not available or credentialIdBase64 missing');
      }
      
      // Method 2: Try getSmartWalletByPasskey if Method 1 didn't find it
      if (!existingWalletAddress && typeof client.getSmartWalletByPasskey === 'function' && passkeyPublicKeyBase64) {
        try {
          console.log('🔍 Calling getSmartWalletByPasskey...');
          const pkBytes = Buffer.from(passkeyPublicKeyBase64, 'base64');
          console.log('🔍 passkeyPublicKey bytes length:', pkBytes.length);
          const result = await client.getSmartWalletByPasskey(pkBytes);
          console.log('🔍 getSmartWalletByPasskey result:', {
            hasResult: !!result,
            hasSmartWallet: !!result?.smartWallet,
            smartWalletType: typeof result?.smartWallet,
          });
          if (result?.smartWallet) {
            const addr = result.smartWallet?.toBase58?.() || result.smartWallet?.toString?.() || result.smartWallet;
            if (addr) {
              existingWalletAddress = String(addr);
              console.log('✅ Found existing wallet by passkey:', existingWalletAddress);
            }
          } else {
            console.log('ℹ️ getSmartWalletByPasskey returned no wallet (wallet may not exist yet)');
          }
        } catch (e: any) {
          console.log('ℹ️ getSmartWalletByPasskey error (wallet may not exist yet):', e?.message || String(e));
        }
      } else {
        if (existingWalletAddress) {
          console.log('ℹ️ Skipping getSmartWalletByPasskey (already found wallet by credentialId)');
        } else {
          console.log('ℹ️ getSmartWalletByPasskey not available or passkeyPublicKeyBase64 missing');
        }
      }
      
      // Method 3: Verify wallet exists onchain
      if (existingWalletAddress) {
        try {
          const accountInfo = await connection.getAccountInfo(new PublicKey(existingWalletAddress));
          if (accountInfo) {
            console.log('✅ Existing wallet verified onchain:', existingWalletAddress);
            // Return existing wallet address - DO NOT CREATE NEW WALLET
            return NextResponse.json({
              ok: true,
              walletAddress: existingWalletAddress,
              existing: true,
              smartWalletId: smartWalletIdRaw?.toString?.() || String(smartWalletIdRaw),
            });
          } else {
            console.warn('⚠️ Existing wallet address found but not onchain, will create new wallet');
            existingWalletAddress = null; // Reset to allow creation
          }
        } catch (e: any) {
          console.warn('⚠️ Failed to verify existing wallet onchain:', e?.message || e);
          existingWalletAddress = null; // Reset to allow creation
        }
      }
    } catch (e: any) {
      console.warn('⚠️ Error checking for existing wallet:', e?.message || e);
      // Continue to create new wallet if check fails
    }

    // CRITICAL: Deterministic Smart Wallet ID Generation
    // Instead of random generation, we derive ID from CredentialID/PasskeyPublicKey
    // This ensures: Same Passkey → Same Wallet ID → Same Wallet Address
    // Formula: SmartWalletId = First8Bytes(SHA256(CredentialID || PasskeyPublicKey))
    if (!smartWalletIdRaw) {
      console.log('ℹ️ No smartWalletId in passkeyData, generating deterministic ID from CredentialID...');
      
      // Use credentialIdBase64 as seed (preferred) or fallback to passkeyPublicKeyBase64
      const seedString = credentialIdBase64 || passkeyPublicKeyBase64;
      
      if (seedString) {
      try {
          // 1. Hash seed string with SHA-256
          const hash = createHash('sha256').update(seedString).digest();
          
          // 2. Take first 8 bytes (64 bits) for SmartWalletID (u64)
          const deterministicSeed = hash.slice(0, 8);
          
          // 3. Convert to BN (Big Endian) - same format as Lazorkit SDK expects
          smartWalletIdRaw = new BN(deterministicSeed, 'be');
          
          console.log('✅ Generated Deterministic SmartWalletId from CredentialID:', {
            seedLength: seedString.length,
            hashLength: hash.length,
            idValue: smartWalletIdRaw.toString(10),
            idHex: smartWalletIdRaw.toString(16),
          });
        } catch (e: any) {
          console.warn('⚠️ Failed to generate deterministic walletId, falling back to random:', e?.message || e);
          // Fallback to random generation if deterministic fails
          if (typeof client.generateWalletId === 'function') {
            try {
              smartWalletIdRaw = client.generateWalletId();
              console.log('✅ Fallback: Generated random smartWalletId (BN):', smartWalletIdRaw.toString(10));
            } catch (fallbackError) {
              console.error('❌ Both deterministic and random generation failed:', fallbackError);
            }
          }
        }
      } else {
        console.warn('⚠️ No seed string available (credentialIdBase64 or passkeyPublicKeyBase64), falling back to random');
        // Fallback to random generation if no seed available
        if (typeof client.generateWalletId === 'function') {
          try {
            smartWalletIdRaw = client.generateWalletId();
            console.log('✅ Fallback: Generated random smartWalletId (BN):', smartWalletIdRaw.toString(10));
          } catch (e) {
            console.warn('⚠️ Failed to generate walletId:', e);
          }
        }
      }
      
      // Validate smartWalletId exists
      if (!smartWalletIdRaw) {
        console.error('❌ Missing smartWalletId after generation attempt');
        return NextResponse.json(
          { error: 'Missing smartWalletId. Unable to generate wallet ID.' },
          { status: 400 }
        );
      }
    } else {
      console.log('✅ Reusing smartWalletId from passkeyData:', smartWalletIdRaw);
    }

    if (!smartWalletIdRaw || !credentialIdBase64 || !passkeyPublicKeyBase64) {
      return NextResponse.json(
        {
          error:
            'Missing required passkey fields (smartWalletId, credentialId, passkeyPublicKey)',
        },
        { status: 400 }
      );
    }

    // Prepare params (same as RampFi)
    // If walletId is a hex-like string, convert to BN base16 to avoid BN parsing base10 by default
    let walletIdParam = smartWalletIdRaw;
    if (typeof smartWalletIdRaw === 'string' && /^(0x)?[0-9a-f]+$/i.test(smartWalletIdRaw)) {
      try {
        const hex = smartWalletIdRaw.startsWith('0x')
          ? smartWalletIdRaw.slice(2)
          : smartWalletIdRaw;
        walletIdParam = BN ? new BN(hex, 16) : hex; // BN preferred if available
      } catch {}
    }
    // If smartWalletIdRaw is already BN (from generateWalletId), use it directly
    else if (BN && smartWalletIdRaw instanceof BN) {
      walletIdParam = smartWalletIdRaw;
    }

    let initLamportsNum = Number(process.env.SMART_WALLET_INIT_LAMPORTS);
    if (!Number.isFinite(initLamportsNum) || initLamportsNum <= 0)
      initLamportsNum = 5_000_000;
    if (initLamportsNum < 3_500_000) initLamportsNum = 3_500_000;
    const initLamports = BN ? new BN(initLamportsNum) : initLamportsNum;

    // Decode passkeyPublicKey from base64 to bytes
    // Expected: 33 bytes (compressed P-256 public key: 1 byte prefix + 32 bytes x-coordinate)
    // SDK expects Array<number> (not Uint8Array or Buffer)
    let pkBytes: number[];
    try {
      const decoded = Buffer.from(passkeyPublicKeyBase64, 'base64');
      pkBytes = Array.from(decoded);
      console.log('✅ Decoded passkeyPublicKey bytes, length:', pkBytes.length);
      
      // Validate length (should be exactly 33 bytes for compressed P-256 key)
      // PASSKEY_PUBLIC_KEY_SIZE = 33
      if (pkBytes.length !== 33) {
        console.error('❌ PasskeyPublicKey length is', pkBytes.length, 'bytes, expected exactly 33 bytes (PASSKEY_PUBLIC_KEY_SIZE)');
        // Try to fix: if longer, take first 33 bytes; if shorter, pad with zeros
        if (pkBytes.length > 33) {
          console.warn('⚠️ Truncating passkeyPublicKey from', pkBytes.length, 'to 33 bytes');
          pkBytes = pkBytes.slice(0, 33);
        } else {
          return NextResponse.json(
            { error: `Invalid passkeyPublicKey length: ${pkBytes.length} bytes, expected 33 bytes (PASSKEY_PUBLIC_KEY_SIZE)` },
            { status: 400 }
          );
        }
      }
      
      // Log first few bytes for debugging
      console.log('✅ PasskeyPublicKey validated:', {
        length: pkBytes.length,
        first5: pkBytes.slice(0, 5),
        prefix: pkBytes[0], // Should be 0x02 or 0x03 for compressed format
      });
    } catch (e) {
      console.error('❌ Failed to decode passkeyPublicKeyBase64:', e);
      return NextResponse.json(
        { error: 'Invalid passkeyPublicKeyBase64 format. Must be valid base64 string.' },
        { status: 400 }
      );
    }
    // Convert walletId to BN (same as RampFi)
    // SDK expects BN for smartWalletId
    // generateWalletId() returns BN (8 bytes = 64 bits max)
    let walletIdBn: any;
    if (BN && walletIdParam) {
      // If walletIdParam is already BN from generateWalletId(), use it directly
      if (walletIdParam instanceof BN) {
        walletIdBn = walletIdParam;
      } else if (typeof walletIdParam === 'string' && /^(0x)?[0-9a-f]+$/i.test(walletIdParam)) {
        // Hex string - convert from hex (base 16)
        const hex = walletIdParam.startsWith('0x') ? walletIdParam.slice(2) : walletIdParam;
        walletIdBn = new BN(hex, 16);
      } else if (typeof walletIdParam === 'string') {
        // Decimal string - convert from base 10
        walletIdBn = new BN(walletIdParam, 10);
      } else {
        // Number or other - convert to string first
        walletIdBn = new BN(String(walletIdParam), 10);
      }
    } else if (BN) {
      // Fallback: try to create BN from string
      walletIdBn = new BN(String(walletIdParam || '0'), 10);
    } else {
      // BN not available, use as-is (shouldn't happen)
      walletIdBn = walletIdParam;
    }
    
    // Validate walletId byte length (must be <= 8 bytes = 64 bits)
    // SDK expects exactly 8 bytes for walletId (same as RampFi comment: "8 bytes random")
    if (walletIdBn && BN && walletIdBn.toArrayLike) {
      const bytes = walletIdBn.toArrayLike(Buffer, 'be');
      const byteLength = bytes.length;
      
      if (byteLength > 8) {
        console.error('❌ WalletId is', byteLength, 'bytes, expected <= 8 bytes (64 bits)');
        // Truncate to 8 bytes (take last 8 bytes, same as RampFi)
        const truncated = bytes.slice(-8);
        walletIdBn = new BN(truncated, 'be');
        console.warn('⚠️ Truncated walletId from', byteLength, 'to 8 bytes');
      }
      
      console.log('✅ WalletId validated:', {
        original: walletIdParam?.toString?.(10) || String(walletIdParam),
        type: walletIdBn?.constructor?.name || typeof walletIdBn,
        value: walletIdBn?.toString?.(10) || String(walletIdBn),
        byteLength: walletIdBn.toArrayLike(Buffer, 'be').length,
      });
    } else {
      console.log('✅ WalletId converted:', {
        original: walletIdParam?.toString?.(10) || String(walletIdParam),
        type: walletIdBn?.constructor?.name || typeof walletIdBn,
        value: walletIdBn?.toString?.(10) || String(walletIdBn),
      });
    }

    // CRITICAL: Check if wallet already exists BEFORE creating transaction
    // With deterministic ID, same passkey → same walletId → same wallet address
    // If wallet already exists, return it instead of creating new
    let walletAddress: string | null = null;
    
    try {
      // Resolve expected wallet address from walletId
      const expectedPda = client.getSmartWalletPubkey(walletIdBn);
      if (expectedPda) {
        const addr = expectedPda?.toBase58?.() || expectedPda?.toString?.() || expectedPda;
        walletAddress = String(addr);
        console.log('✅ Resolved expected wallet address via getSmartWalletPubkey:', walletAddress);
        
        // Check if wallet already exists onchain
        const accountInfo = await connection.getAccountInfo(new PublicKey(walletAddress));
        const programId = (() => {
          try {
            return (
              client?.programId?.toBase58?.() ||
              client?.programId?.toString?.() ||
              null
            );
          } catch {
            return null;
          }
        })();
        
        console.log('🔍 Checking wallet account:', {
          walletAddress,
          hasAccountInfo: !!accountInfo,
          accountOwner: accountInfo?.owner?.toBase58?.() || accountInfo?.owner?.toString?.() || 'none',
          programId: programId || 'none',
        });
        
        if (accountInfo) {
          const owner = accountInfo.owner?.toBase58?.() || accountInfo.owner?.toString?.();
          
          // CRITICAL: If account exists, return it to prevent "account already in use" error
          // This prevents duplicate wallet creation when deterministic ID generates same address
          // Even if owner is different or account is empty, we should return the address
          // because trying to create it again will fail with "already in use"
          if (programId && owner === programId) {
            console.log('✅ Wallet already exists onchain and is owned by Lazorkit program');
            // Wallet already exists, return it (no need to create new)
            return NextResponse.json({
              ok: true,
              walletAddress,
              existing: true,
              smartWalletId: smartWalletIdRaw?.toString?.() || String(smartWalletIdRaw),
            });
          } else {
            // Account exists but owner might be different or account might be empty
            // Still return it to prevent "account already in use" error
            console.log('✅ Wallet account exists onchain (owner:', owner, 'programId:', programId, 'lamports:', accountInfo.lamports, '), returning existing address to prevent duplicate creation');
            return NextResponse.json({
              ok: true,
              walletAddress,
              existing: true,
              smartWalletId: smartWalletIdRaw?.toString?.() || String(smartWalletIdRaw),
            });
          }
        } else {
          console.log('ℹ️ Wallet address resolved but not onchain yet, will create');
        }
      }
    } catch (e: any) {
      console.warn('⚠️ Failed to check existing wallet, will proceed to create:', e?.message || e);
    }

    // CRITICAL: This creates a REAL smart wallet PDA onchain via Lazorkit Program
    // The transaction will be signed and sent to devnet - 100% onchain, no mocks
    
    // Log all parameters before calling SDK
    console.log('📋 createSmartWalletTxn params:', {
      payer: adminKeypair.publicKey.toBase58(),
      passkeyPublicKeyLength: pkBytes.length,
      passkeyPublicKeyFirst5: pkBytes.slice(0, 5),
      credentialIdBase64Length: credentialIdBase64.length,
      credentialIdBase64First10: credentialIdBase64.slice(0, 10),
      smartWalletId: walletIdBn?.toString?.() || String(walletIdBn),
      amount: initLamports?.toString?.() || String(initLamports),
    });
    
    // Validate credentialIdBase64 length (should decode to 32 bytes)
    // CREDENTIAL_HASH_SIZE = 32 bytes
    let credentialIdBytes: number[] | undefined;
    try {
      const decoded = Buffer.from(credentialIdBase64, 'base64');
      credentialIdBytes = Array.from(decoded);
      console.log('✅ Decoded credentialId bytes, length:', credentialIdBytes.length);
      
      if (credentialIdBytes.length !== 32) {
        console.warn('⚠️ CredentialId length is', credentialIdBytes.length, 'bytes, expected 32 bytes (CREDENTIAL_HASH_SIZE)');
        // Still proceed, SDK may handle it
      }
    } catch (e) {
      console.warn('⚠️ Failed to decode credentialIdBase64 for validation:', e);
    }
    
    const txnOut = await client.createSmartWalletTxn(
      {
        payer: adminKeypair.publicKey,
        passkeyPublicKey: pkBytes,
        credentialIdBase64,
        smartWalletId: walletIdBn,
        amount: initLamports,
      },
      { useVersionedTransaction: false }
    );

    // Sign and send
    const transaction = txnOut.transaction || txnOut.tx;
    if (transaction) {
      if (!transaction.recentBlockhash) {
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
      }
      if (!transaction.feePayer)
        transaction.feePayer = adminKeypair.publicKey;

      // Ensure admin has some SOL on devnet
      try {
        const url = String(rpcUrl).toLowerCase();
        const isDev = /devnet|localhost|127\.0\.0\.1/.test(url);
        const minLamports = Number(process.env.MIN_FEE_LAMPORTS || 5_000_000);
        let bal = await connection.getBalance(
          adminKeypair.publicKey,
          'confirmed'
        );
        if (isDev && bal < minLamports) {
          const airdropLamports = Number(
            process.env.AIRDROP_LAMPORTS || 1_000_000_000
          );
          const sig = await connection.requestAirdrop(
            adminKeypair.publicKey,
            airdropLamports
          );
          await connection.confirmTransaction(sig, 'confirmed');
        }
      } catch {}

      transaction.sign(adminKeypair);
      const raw = transaction.serialize();
      
      try {
      const sig = await connection.sendRawTransaction(raw, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
      await connection.confirmTransaction(sig, 'confirmed');
      } catch (txError: any) {
        // CRITICAL: Handle "account already in use" error
        // This happens when wallet already exists but our check didn't catch it
        const errorMessage = txError?.message || String(txError);
        const errorLogs = txError?.logs || [];
        
        if (errorMessage.includes('already in use') || errorLogs.some((log: string) => log.includes('already in use'))) {
          console.warn('⚠️ Transaction failed: account already in use. Wallet likely already exists.');
          
          // Resolve wallet address and return it
          try {
            const expectedPda = client.getSmartWalletPubkey(walletIdBn);
            if (expectedPda) {
              const addr = expectedPda?.toBase58?.() || expectedPda?.toString?.() || expectedPda;
              const existingWalletAddress = String(addr);
              console.log('✅ Returning existing wallet address:', existingWalletAddress);
              
              return NextResponse.json({
                ok: true,
                walletAddress: existingWalletAddress,
                existing: true,
                smartWalletId: smartWalletIdRaw?.toString?.() || String(smartWalletIdRaw),
              });
            }
          } catch (resolveError) {
            console.error('❌ Failed to resolve wallet address after "already in use" error:', resolveError);
          }
        }
        
        // Re-throw if not "already in use" error
        throw txError;
      }
    }

    // CRITICAL: Resolve wallet address using getSmartWalletPubkey after transaction
    // This ensures we get the correct PDA address for the walletId
    // Note: We already checked if wallet exists BEFORE creating transaction above
    // This is just to get the final wallet address for response
    let finalWalletAddress: string | null = null;
    
    try {
      // Use getSmartWalletPubkey to get expected PDA (same as RampFi)
      const expectedPda = client.getSmartWalletPubkey(walletIdBn);
      if (expectedPda) {
        const addr = expectedPda?.toBase58?.() || expectedPda?.toString?.() || expectedPda;
        finalWalletAddress = String(addr);
        console.log('✅ Resolved final wallet address via getSmartWalletPubkey:', finalWalletAddress);
      }
    } catch (e: any) {
      console.warn('⚠️ getSmartWalletPubkey failed:', e?.message || e);
    }

    // Fallback: try getSmartWalletByCredentialId and getSmartWalletByPasskey
    if (!finalWalletAddress) {
      try {
    const candidates: string[] = [];
        
    try {
          const byCred = await client.getSmartWalletByCredentialId(credentialIdBase64);
          const p = byCred?.smartWallet?.toBase58?.() || byCred?.smartWallet?.toString?.() || byCred?.smartWallet || null;
          if (p) candidates.push(String(p));
        } catch (e: any) {
          console.log('ℹ️ getSmartWalletByCredentialId failed:', e?.message || e);
        }
        
    try {
          const byPk = await client.getSmartWalletByPasskey(Buffer.from(passkeyPublicKeyBase64, 'base64'));
          const p = byPk?.smartWallet?.toBase58?.() || byPk?.smartWallet?.toString?.() || byPk?.smartWallet || null;
          if (p) candidates.push(String(p));
        } catch (e: any) {
          console.log('ℹ️ getSmartWalletByPasskey failed:', e?.message || e);
        }

    // Prefer LazorKit-owned account if resolvable
        if (candidates.length > 0) {
      const programId = (() => {
        try {
          return (
            client?.programId?.toBase58?.() ||
                client?.programId?.toString?.() ||
                null
          );
        } catch {
          return null;
        }
      })();
          
      for (const addr of candidates) {
        try {
          const info = await connection.getAccountInfo(new PublicKey(addr));
          const owner = info?.owner?.toBase58?.() || info?.owner?.toString?.();
          if (info && programId && owner === programId) {
                finalWalletAddress = addr;
                console.log('✅ Found existing wallet via getSmartWalletByCredentialId/Passkey:', finalWalletAddress);
                // Wallet already exists, return it (no need to create new)
                return NextResponse.json({
                  ok: true,
                  walletAddress: finalWalletAddress,
                  existing: true,
                  smartWalletId: smartWalletIdRaw?.toString?.() || String(smartWalletIdRaw),
                });
          }
        } catch {}
      }
          
          // If no Lazorkit-owned account found, use first candidate
          if (!finalWalletAddress && candidates.length > 0) {
            finalWalletAddress = candidates[0];
            console.log('⚠️ Using first candidate wallet address (may not be Lazorkit-owned):', finalWalletAddress);
          }
        }
      } catch (e: any) {
        console.warn('⚠️ Error resolving wallet address:', e?.message || e);
      }
    }

    // If we still don't have a wallet address, use getSmartWalletPubkey result
    if (!finalWalletAddress) {
      try {
        const expectedPda = client.getSmartWalletPubkey(walletIdBn);
        if (expectedPda) {
          const addr = expectedPda?.toBase58?.() || expectedPda?.toString?.() || expectedPda;
          finalWalletAddress = String(addr);
          console.log('✅ Using getSmartWalletPubkey result as wallet address:', finalWalletAddress);
        }
      } catch (e: any) {
        console.error('❌ Failed to get wallet address via getSmartWalletPubkey:', e?.message || e);
      }
    }

    if (!finalWalletAddress) {
      return NextResponse.json(
        { error: 'Failed to resolve smart wallet address' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      walletAddress: finalWalletAddress,
      smartWalletId: smartWalletIdRaw?.toString?.() || String(smartWalletIdRaw),
    });
  } catch (err: any) {
    console.error('Create smart wallet failed:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
