import { nativeTokens } from '@/constants';
import { SorobanContextType, useSorobanReact } from '@soroban-react/core';
import useSWRImmutable from 'swr/immutable';
import { tokenBalance } from './useBalances';

const fetchBalance = async (sorobanContext: SorobanContextType, address?: string) => {
    if (!sorobanContext || !address) throw new Error('Missing sorobanContext or address');

    const currentNetwork = sorobanContext.activeChain?.name?.toLowerCase();

    const networkNativeToken = nativeTokens.find((nativeToken) => nativeToken.network === currentNetwork);

    if (!networkNativeToken) throw new Error(`Native token not found for network ${currentNetwork}`);

    try {
        await sorobanContext.server?.getAccount(address);
    } catch (err: any) {
        console.error(err.message);
        throw new Error('Not valid account');
    }

    try {
        return tokenBalance(networkNativeToken.address, address, sorobanContext);
    } catch (err: any) {
        console.error(err.message);
        throw new Error('Error while getting token balance');
    }
};

const useGetNativeTokenBalance = () => {
    const sorobanContext = useSorobanReact();
    const { address } = sorobanContext;

    const { data, error, isLoading, mutate } = useSWRImmutable(
        address ? ['native-balance', sorobanContext, address] : null,
        ([, sorobanContext, address]) => fetchBalance(sorobanContext, address)
    );

    return { balance: data, error, isLoading, mutate };
};

export default useGetNativeTokenBalance;
