/**
 * Stub file for LazorkitProvider
 * This file exists because the @lazorkit/wallet package is missing
 * the compiled LazorkitProvider.js file in dist/react/
 * 
 * The actual functionality is handled by useWalletStore in LazorProvider
 */

import React from 'react';

export const LazorkitProvider = ({ children }) => {
  // This is a stub - actual implementation uses useWalletStore directly
  return React.createElement(React.Fragment, null, children);
};

export default LazorkitProvider;

