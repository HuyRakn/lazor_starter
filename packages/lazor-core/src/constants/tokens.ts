/**
 * Default token mints for convenience (can be overridden per environment)
 */
export const TOKEN_MINTS = {
  USDC_DEVNET: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  USDC_MAINNET: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT_DEVNET: 'BQ31Z1E1s3P6KyHRxY6z3n9JVpaz6RtWLpmjH8obaN6D',
  USDT_MAINNET: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  SOL_MINT: 'So11111111111111111111111111111111111111112',
} as const;

export type TokenMintKey = keyof typeof TOKEN_MINTS;


