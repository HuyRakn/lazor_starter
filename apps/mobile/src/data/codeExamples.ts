export const codeExamples = {
    login: {
        title: 'Login with Passkey',
        description: 'Connect wallet using Face ID / Touch ID',
        code: `const { connect, isConnected, wallet } = useSmartWallet();

const handleLogin = async () => {
  await connect();
  console.log('Wallet:', wallet?.smartWallet);
};`,
    },
    transfer: {
        title: 'Gasless Transfer',
        description: 'Send SOL/USDC without gas fees',
        code: `const { transferSOL, transferSPLToken } = useGaslessTx();

// Transfer SOL
const signature = await transferSOL(recipient, amount);

// Transfer USDC
const sig = await transferSPLToken(recipient, amount, usdcMint, 6);`,
    },
    airdrop: {
        title: 'Request Airdrop',
        description: 'Get devnet tokens',
        code: `const { requestSOLAirdrop } = useAirdrop();

// Request SOL
await requestSOLAirdrop(walletAddress, 1);`,
    },
    swap: {
        title: 'Jupiter Swap',
        description: 'Swap tokens gaslessly',
        code: `const { executeSwap } = useJupiterSwap();

// Execute swap
const signature = await executeSwap({
  inputMint: 'So111...',
  outputMint: 'EPjFW...',
  amount: 1.0,
  slippageBps: 50,
});`,
    },
    nftMinting: {
        title: 'NFT Minting',
        description: 'Mint standard NFTs',
        code: `const { signAndSendTransaction } = useSmartWallet();

// Build instructions
const instructions = [...mintInstructions, ...metaplexInstructions];

// Gasless Mint
const signature = await signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 400_000 },
});`,
    },
    cnftMinting: {
        title: 'Compressed NFT',
        description: 'Mint cNFTs (Bubblegum)',
        code: `const { signAndSendTransaction } = useSmartWallet();

// Build cNFT instruction
const instructions = buildCNftMintInstruction(
  wallet.smartWallet,
  merkleTree,
  name,
  metadataUri
);

// Gasless Mint
const signature = await signAndSendTransaction({
  instructions,
});`,
    },
};
