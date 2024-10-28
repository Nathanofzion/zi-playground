import { UseInkathonProvider, alephzeroTestnet } from '@scio-labs/use-inkathon';
import React, { ReactNode } from 'react';

const InkathonProvider = ({ children }) => {
  return (
    <UseInkathonProvider appName="Soroswap" defaultChain={alephzeroTestnet} connectOnInit={false}>
      {children}
    </UseInkathonProvider>
  );
};

export default InkathonProvider;
