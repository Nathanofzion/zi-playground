import { contractInvoke } from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
import { scValToBigInt, xdr } from "@stellar/stellar-sdk";
import { useQuery } from "@tanstack/react-query";

import { toaster } from "@/components/ui/toaster";
import { accountToScVal } from "@/utils";

const contractAddress = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID;

export enum Action {
    Unknown = 0,
    SpinCube = 1,
    CreateParticles = 2,
    ChangeTheme = 3
}

const useAirdrop = () => {
    const sorobanContext = useSorobanReact();
    const { address } = sorobanContext;

    const { data, refetch } = useQuery({
        queryKey: ['getAirdropBalance', address],
        queryFn: async () => {
            if (!address) return 0;
            const response = await contractInvoke({
                contractAddress,
                method: 'get_balance',
                args: [accountToScVal(address)],
                sorobanContext,
            });
            return Number(scValToBigInt(response as xdr.ScVal));
        },
        enabled: !!address,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    const getAirdrop = async (action: Action) => {
        if (!address) return;
        try {
            await contractInvoke({
                contractAddress,
                method: 'distribute_tokens',
                args: [accountToScVal(address), xdr.ScVal.scvU32(action)],
                signAndSend: true,
                sorobanContext,
            });
            toaster.create({
                title: 'You have successfully received the airdrop.',
                type: 'success',
            });
            refetch();
        } catch (err: any) {
            console.error(err.message);
        }
    }

    return { balance: data || 0, refetch, getAirdrop };
}

export default useAirdrop;
