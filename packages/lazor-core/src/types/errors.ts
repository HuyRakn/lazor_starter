/**
 * Base error class for Lazor Core utilities
 *
 * @param code - Machine readable error code
 * @param message - Human friendly error message
 */
export class LazorError extends Error {
  code: string;

  /**
   * Constructs a LazorError
   *
   * @param code - Machine readable error code
   * @param message - Human friendly error message
   */
  constructor(code: string, message: string) {
    super(message);
    this.name = 'LazorError';
    this.code = code;
  }
}


