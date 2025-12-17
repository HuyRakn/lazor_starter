export interface PasskeyData {
  credentialId: string;
  userId: string;
  publicKey: {
    x: Uint8Array | string;
    y: Uint8Array | string;
  };
  smartWalletAddress?: string;
  smartWalletId?: string;
}

export interface WalletState {
  hasPasskey: boolean;
  hasWallet: boolean;
  pubkey?: string;
  walletName?: string;
  passkeyData?: PasskeyData;
}

export interface GaslessTxOptions {
  paymasterUrl?: string;
  skipPreflight?: boolean;
  /** Token address for gas fees (e.g. USDC mint address) */
  feeToken?: string;
  /** Max compute units for the transaction */
  computeUnitLimit?: number;
  /** Network to use for simulation */
  clusterSimulation?: 'devnet' | 'mainnet';
}


