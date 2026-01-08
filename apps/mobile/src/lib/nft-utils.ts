/**
 * NFT Utilities for Metaplex Integration (Mobile)
 * Ported from web implementation
 */

import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    createMetadataAccountV3,
    createMasterEditionV3,
    mplTokenMetadata,
    findMetadataPda,
    findMasterEditionPda,
} from '@metaplex-foundation/mpl-token-metadata';
import { mplBubblegum, mintV1 } from '@metaplex-foundation/mpl-bubblegum';
import {
    publicKey as umiPublicKey,
    signerIdentity,
    Signer,
    none,
} from '@metaplex-foundation/umi';
import { toWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters';
import { getConnection } from '@lazor-starter/core';
import Constants from 'expo-constants';
import 'text-encoding-polyfill';

// Constants
export const NFT_NAME_MAX_LENGTH = 32;
export const NFT_DESCRIPTION_MAX_LENGTH = 200;
export const REGULAR_NFT_SYMBOL = 'LKST';
export const CNFT_SYMBOL = 'cLKST';

// Pre-created merkle tree on devnet for cNFT demo
export const DEMO_MERKLE_TREE = 'HiTxt5DJMYSpwZ7i3Kx5qzYsuAfEWMZMnyGCNokC7Y2u';

import { Platform } from 'react-native';

/**
 * Get API Base URL
 * Handles Android Emulator (10.0.2.2) and Physical Devices (LAN IP)
 */
const getApiBaseUrl = () => {
    // 1. Check for configured base URL in Expo config
    const configuredUrl = Constants.expoConfig?.extra?.apiBaseUrl ||
        Constants.manifest?.extra?.apiBaseUrl;

    if (configuredUrl) return configuredUrl;

    // 2. Development fallbacks
    if (__DEV__) {
        // Android Emulator specific (localhost is 10.0.2.2)
        // Check if running on emulator vs physical device could be tricky, 
        // but 10.0.2.2 is safe for emulator.
        // For physical Android device, we need LAN IP.

        // Try to get dev machine IP from Expo Host URI
        if (Constants.expoConfig?.hostUri) {
            const host = Constants.expoConfig.hostUri.split(':')[0];
            return `http://${host}:3000`;
        }

        // Fallback for Android Emulator if hostUri is missing
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:3000';
        }
    }

    // 3. Default fallback
    return 'http://localhost:3000';
};

/**
 * Create a dummy signer for building Umi instructions
 * LazorKit handles the actual signing via passkey
 */
export function createDummySigner(walletAddress: string): Signer {
    return {
        publicKey: umiPublicKey(walletAddress),
        signMessage: async () => new Uint8Array(64),
        signTransaction: async (tx) => tx,
        signAllTransactions: async (txs) => txs,
    };
}

/**
 * Build Metaplex metadata and master edition instructions for a regular NFT
 */
export async function buildMetaplexInstructions(
    walletAddress: string,
    mintAddress: string,
    nftName: string,
    metadataUri: string,
    symbol: string = REGULAR_NFT_SYMBOL
): Promise<TransactionInstruction[]> {
    const connection = getConnection();
    const rpcUrl = connection.rpcEndpoint;

    const umi = createUmi(rpcUrl).use(mplTokenMetadata());

    const mintPublicKey = umiPublicKey(mintAddress);
    const walletPublicKey = umiPublicKey(walletAddress);
    const dummySigner = createDummySigner(walletAddress);

    umi.use(signerIdentity(dummySigner));

    const instructions: TransactionInstruction[] = [];

    // Derive PDAs
    const metadata = findMetadataPda(umi, { mint: mintPublicKey });
    const masterEdition = findMasterEditionPda(umi, { mint: mintPublicKey });

    // Build CreateMetadataAccountV3 instruction
    const createMetadataBuilder = createMetadataAccountV3(umi, {
        metadata,
        mint: mintPublicKey,
        mintAuthority: dummySigner,
        payer: dummySigner,
        updateAuthority: walletPublicKey,
        data: {
            name: nftName,
            symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: 0,
            creators: [
                {
                    address: walletPublicKey,
                    verified: false,
                    share: 100,
                },
            ],
            collection: null,
            uses: null,
        },
        isMutable: true,
        collectionDetails: null,
    });

    const metadataIxs = createMetadataBuilder.getInstructions();
    for (const ix of metadataIxs) {
        instructions.push(toWeb3JsInstruction(ix));
    }

    // Build CreateMasterEditionV3 instruction
    const createMasterEditionBuilder = createMasterEditionV3(umi, {
        edition: masterEdition,
        mint: mintPublicKey,
        updateAuthority: dummySigner,
        mintAuthority: dummySigner,
        payer: dummySigner,
        metadata,
        maxSupply: 0, // 0 means no prints allowed (true 1/1)
    });

    const masterEditionIxs = createMasterEditionBuilder.getInstructions();
    for (const ix of masterEditionIxs) {
        instructions.push(toWeb3JsInstruction(ix));
    }

    return instructions;
}

/**
 * Build Bubblegum mint instruction for a compressed NFT
 */
export function buildCNftMintInstruction(
    walletAddress: string,
    merkleTreeAddress: string,
    nftName: string,
    metadataUri: string,
    symbol: string = CNFT_SYMBOL
): TransactionInstruction[] {
    const connection = getConnection();
    const rpcUrl = connection.rpcEndpoint;

    const umi = createUmi(rpcUrl).use(mplBubblegum());
    const dummySigner = createDummySigner(walletAddress);

    umi.use(signerIdentity(dummySigner));

    const mintBuilder = mintV1(umi, {
        leafOwner: umiPublicKey(walletAddress),
        merkleTree: umiPublicKey(merkleTreeAddress),
        metadata: {
            name: nftName,
            symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: 0,
            collection: none(),
            creators: [
                {
                    address: umiPublicKey(walletAddress),
                    verified: false,
                    share: 100,
                },
            ],
        },
    });

    const mintIxs = mintBuilder.getInstructions();
    const instructions: TransactionInstruction[] = [];

    for (const ix of mintIxs) {
        instructions.push(toWeb3JsInstruction(ix));
    }

    return instructions;
}

/**
 * Extract Asset ID from transaction logs
 * The Bubblegum program logs: "Leaf asset ID: <asset_id>"
 */
export async function extractCNftAssetId(signature: string): Promise<string> {
    const connection = getConnection();

    // Wait for transaction to be confirmed and logs available
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        const tx = await connection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
        });

        if (tx?.meta?.logMessages) {
            for (const log of tx.meta.logMessages) {
                const match = log.match(/Leaf asset ID: ([1-9A-HJ-NP-Za-km-z]{32,44})/);
                if (match) {
                    return match[1];
                }
            }
        }
    } catch (err) {
        console.error('Failed to extract asset ID:', err);
    }

    return 'Unknown (check transaction logs)';
}

/**
 * Store NFT metadata on the API and get the metadata URI
 */
export async function storeNftMetadata(
    mintId: string,
    metadata: { name: string; description: string }
): Promise<string> {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/api/nft-metadata/${mintId}`;

    console.log('Storing metadata at:', url);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                name: metadata.name.trim(),
                description: metadata.description.trim(),
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Metadata storage failed:', response.status, text);
            throw new Error(`Failed to store metadata: ${response.status}`);
        }

        const { metadataUri } = await response.json();

        // Ensure the URI is absolute if it's relative
        if (metadataUri.startsWith('/')) {
            return `${apiBaseUrl}${metadataUri}`;
        }

        return metadataUri;
    } catch (error) {
        console.warn('Backend unavailable, using mock metadata for testing:', error);
        // Fallback to a valid public metadata URI for testing functionality
        // This allows minting to proceed even if the local backend is offline
        return 'https://raw.githubusercontent.com/solana-developers/professional-education/main/labs/sample-nft-metadata.json';
    }
}

/**
 * Generate a unique mint ID
 */
export function generateMintId(prefix: string = 'nft'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
