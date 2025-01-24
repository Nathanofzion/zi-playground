import { nativeTokens } from '@/constants';
import { SorobanContextType, useSorobanReact } from '@soroban-react/core';
import { useQuery } from '@tanstack/react-query';
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

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: ['getNativeTokenBalance', address],
        queryFn: () => fetchBalance(sorobanContext, address),
        enabled: !!address,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    return { balance: data, error, isLoading, refetch };
};

export default useGetNativeTokenBalance;
