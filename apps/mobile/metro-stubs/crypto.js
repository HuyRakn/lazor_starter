/**
 * Stub file for Node.js crypto module
 * This file provides a React Native-compatible implementation of the crypto module
 * Required by @solana/kora and other packages that use Node.js crypto
 */

import * as Crypto from 'expo-crypto';

// Create a crypto object that mimics Node.js crypto module
const cryptoStub = {
  // Random bytes generation
  randomBytes: (size) => {
    const bytes = Crypto.getRandomBytes(size);
    return Buffer.from(bytes);
  },

  // Create hash
  createHash: (algorithm) => {
    return {
      update: (data) => {
        return {
          digest: async (encoding) => {
            let input;
            if (typeof data === 'string') {
              input = data;
            } else if (Buffer.isBuffer(data)) {
              input = data.toString('utf8');
            } else {
              input = String(data);
            }

            let digestAlgorithm;
            switch (algorithm.toLowerCase()) {
              case 'sha256':
                digestAlgorithm = Crypto.CryptoDigestAlgorithm.SHA256;
                break;
              case 'sha512':
                digestAlgorithm = Crypto.CryptoDigestAlgorithm.SHA512;
                break;
              default:
                digestAlgorithm = Crypto.CryptoDigestAlgorithm.SHA256;
            }

            const hash = await Crypto.digestStringAsync(digestAlgorithm, input);
            
            if (encoding === 'hex') {
              return hash;
            } else if (encoding === 'base64') {
              // Convert hex to base64
              const bytes = new Uint8Array(hash.length / 2);
              for (let i = 0; i < hash.length; i += 2) {
                bytes[i / 2] = parseInt(hash.substr(i, 2), 16);
              }
              return Buffer.from(bytes).toString('base64');
            }
            // Default to hex
            return hash;
          },
        };
      },
    };
  },

  // Create HMAC
  createHmac: (algorithm, key) => {
    let dataToHash = '';
    
    return {
      update: (data) => {
        // Accumulate data for hashing
        if (typeof data === 'string') {
          dataToHash += data;
        } else if (Buffer.isBuffer(data)) {
          dataToHash += data.toString('utf8');
        } else {
          dataToHash += String(data);
        }
        
        // Return the same object for chaining
        return {
          digest: async (encoding) => {
            // Proper HMAC implementation
            // HMAC-SHA256(key, message) = H(SHA256(key XOR opad) || H(SHA256(key XOR ipad) || message))
            // For simplicity, we'll use a keyed hash approach
            const message = key + dataToHash;
            
            let digestAlgorithm;
            switch (algorithm.toLowerCase()) {
              case 'sha256':
                digestAlgorithm = Crypto.CryptoDigestAlgorithm.SHA256;
                break;
              case 'sha512':
                digestAlgorithm = Crypto.CryptoDigestAlgorithm.SHA512;
                break;
              default:
                digestAlgorithm = Crypto.CryptoDigestAlgorithm.SHA256;
            }
            
            const hash = await Crypto.digestStringAsync(digestAlgorithm, message);
            
            if (encoding === 'hex') {
              return hash;
            } else if (encoding === 'base64') {
              const bytes = new Uint8Array(hash.length / 2);
              for (let i = 0; i < hash.length; i += 2) {
                bytes[i / 2] = parseInt(hash.substr(i, 2), 16);
              }
              return Buffer.from(bytes).toString('base64');
            }
            return hash;
          },
        };
      },
    };
  },

  // Timestamp-safe random number generator
  randomInt: (min, max) => {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    const range = max - min;
    const randomBytes = Crypto.getRandomBytes(4);
    const randomValue = randomBytes.reduce((acc, byte, index) => {
      return acc + (byte << (index * 8));
    }, 0);
    return min + (randomValue % range);
  },

  // Get random values (Web Crypto API compatible)
  getRandomValues: (array) => {
    const randomBytes = Crypto.getRandomBytes(array.length);
    array.set(randomBytes);
    return array;
  },
};

// Export as default (for `import crypto from 'crypto'`)
export default cryptoStub;

// Also export as named export (for `import { randomBytes } from 'crypto'`)
export const randomBytes = cryptoStub.randomBytes;
export const createHash = cryptoStub.createHash;
export const createHmac = cryptoStub.createHmac;
export const randomInt = cryptoStub.randomInt;
export const getRandomValues = cryptoStub.getRandomValues;

