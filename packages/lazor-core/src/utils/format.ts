/**
 * Formats a wallet address to a shortened form
 *
 * @param address - Base58 public key string
 * @param visibleChars - Number of visible chars at start/end
 * @returns Shortened address string (e.g., 5xA1...9KpQ)
 */
export function formatAddress(address: string, visibleChars = 4): string {
  if (!address) return '';
  if (address.length <= visibleChars * 2) return address;
  return `${address.slice(0, visibleChars)}...${address.slice(-visibleChars)}`;
}

/**
 * Truncates a wallet address (alias for formatAddress)
 *
 * @param address - Base58 public key string
 * @param visibleChars - Number of visible chars at start/end
 * @returns Shortened address string
 */
export function truncateAddress(address: string, visibleChars = 4): string {
  return formatAddress(address, visibleChars);
}

/**
 * Formats a numeric balance with trimming trailing zeros
 *
 * @param amount - Balance amount
 * @param decimals - Decimal places to keep (default 6)
 * @returns Formatted balance string
 */
export function formatBalance(amount: number | null | undefined, decimals = 6): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '0';
  }
  return Number(amount).toFixed(decimals).replace(/\.?0+$/, '');
}


