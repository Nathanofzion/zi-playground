import { UseInkathonProvider, alephzeroTestnet } from '@scio-labs/use-inkathon';
import { FC, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const InkathonProvider: FC<Props> = ({ children }) => {
  return (
    <UseInkathonProvider appName="Soroswap" defaultChain={alephzeroTestnet} connectOnInit={false}>
      {children}
    </UseInkathonProvider>
  );
};

export default InkathonProvider;
