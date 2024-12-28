import { SorobanContextType, useSorobanReact } from '@soroban-react/core';
import useSWRImmutable from 'swr/immutable';
import nativeTokens from '../../public/native_tokens.json';
import { tokenBalance } from './useBalances';

interface FetchBalanceProps {
  sorobanContext: SorobanContextType;
  address?: string;
}

const fetchBalance = async ({ sorobanContext, address }: FetchBalanceProps) => {
  if (!sorobanContext || !address) throw new Error('Missing sorobanContext or address');

  const currentNetwork = sorobanContext.activeChain?.name?.toLowerCase();

  const networkNativeToken = nativeTokens.nativeTokens.find(
    (nativeToken) => nativeToken.network === currentNetwork,
  );

  if (!networkNativeToken) throw new Error(`Native token not found for network ${currentNetwork}`);

  try {
    await sorobanContext.server?.getAccount(address);
  } catch (err: any) {
    console.error('getAccount =>', err.message);
    return { data: 0, validAccount: false };
  }

  try {
    const balance = await tokenBalance(networkNativeToken.address, address, sorobanContext);
    return { data: balance, validAccount: true };
  } catch (err: any) {
    console.error('tokenBalance =>', err.message);
    return { data: 0, validAccount: true };
  }
};

const useGetNativeTokenBalance = () => {
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;

  const { data, error, isLoading, mutate } = useSWRImmutable(
    address ? ['native-balance', sorobanContext, address] : null,
    ([key, sorobanContext, address]) => fetchBalance({ sorobanContext, address })
  );

  return {
    data,
    isLoading,
    mutate,
    isError: error,
  };
};

export default useGetNativeTokenBalance;
