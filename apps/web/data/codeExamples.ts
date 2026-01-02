export const codeExamples = {
  login: {
    title: 'Login with Passkey',
    description: 'Connect wallet using Face ID / Touch ID authentication',
    code: `const { connect, isConnected, wallet } = useSmartWallet();

const handleLogin = async () => {
  await connect();
  console.log('Wallet:', wallet?.smartWallet);
};`,
  },
  transfer: {
    title: 'Gasless Transfer',
    description: 'Send SOL or USDC without paying gas fees',
    code: `const { transferSOL, transferSPLToken } = useGaslessTx();

// Transfer SOL
const signature = await transferSOL(
  recipientAddress,
  amount // in SOL
);

// Or transfer USDC
const usdcSignature = await transferSPLToken(
  recipientAddress,
  amount, // in USDC
  usdcMintAddress,
  6 // decimals
);`,
  },
  airdrop: {
    title: 'Request Airdrop',
    description: 'Get test tokens from devnet faucet',
    code: `const { requestSOLAirdrop, requestUSDCAirdrop } = useAirdrop();

// Request SOL
const signature = await requestSOLAirdrop(
  walletAddress,
  amount // e.g., 1 SOL
);

// Or request USDC (opens Circle Faucet)
await requestUSDCAirdrop(walletAddress, 1);`,
  },
  swap: {
    title: 'Jupiter Swap',
    description: 'Swap tokens on Jupiter DEX gaslessly',
    code: `const { executeSwap, getQuote } = useJupiterSwap();

// Get quote first
const quote = await getQuote({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: 1.0,
  slippageBps: 50,
});

// Execute swap
const signature = await executeSwap({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: 1.0,
  slippageBps: 50,
});`,
  },
  nftMinting: {
    title: 'NFT Minting',
    description: 'Mint standard NFTs using Metaplex Token Metadata',
    code: `const { wallet, signAndSendTransaction } = useSmartWallet();
const { buildMetaplexInstructions } = require('@/lib/nft-utils');

// Build mint instructions
const instructions = [
  // Create mint account
  SystemProgram.createAccountWithSeed({...}),
  // Initialize mint
  createInitializeMintInstruction(...),
  // Create ATA
  createAssociatedTokenAccountInstruction(...),
  // Mint token
  createMintToInstruction(...),
];

// Add Metaplex metadata
const metaplexInstructions = await buildMetaplexInstructions(
  wallet.smartWallet,
  mintPubkey.toBase58(),
  name,
  metadataUri
);
instructions.push(...metaplexInstructions);

// Send transaction
const signature = await signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 400_000 },
});`,
  },
  cnftMinting: {
    title: 'Compressed NFT',
    description: 'Mint compressed NFTs using Metaplex Bubblegum',
    code: `const { wallet, signAndSendTransaction } = useSmartWallet();
const { buildCNftMintInstruction } = require('@/lib/nft-utils');

// Build cNFT mint instruction
const instructions = buildCNftMintInstruction(
  wallet.smartWallet,
  merkleTreeAddress,
  name,
  metadataUri
);

// Add smart wallet for validation
addSmartWalletToInstructions(instructions, wallet.smartWallet);

// Send transaction
const signature = await signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 400_000 },
});

// Extract asset ID from transaction
const assetId = await extractCNftAssetId(signature);`,
  },
};

