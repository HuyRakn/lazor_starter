// Polyfill module for global variable
// This is used by webpack ProvidePlugin to inject global into all modules

if (typeof window !== 'undefined') {
  if (typeof window.global === 'undefined') {
    window.global = window;
  }
}

if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.global === 'undefined') {
    globalThis.global = globalThis;
  }
}

// Export global for webpack ProvidePlugin
module.exports = typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : {};


