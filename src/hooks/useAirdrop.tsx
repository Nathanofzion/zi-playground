import axios from "axios";

import { contractInvoke } from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
import { scValToBigInt, xdr } from "@stellar/stellar-sdk";
import { useMutation, useQuery } from "@tanstack/react-query";

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

    const { mutate, isPending } = useMutation({
        mutationFn: async (action: Action) => {
            if (!address)
                throw new Error('Please connect wallet to get airdrop.');
            return await axios.post('/api/airdrop', { address, action })
        },
        onSuccess: () => {
            toaster.create({
                title: 'You have successfully received the airdrop.',
                type: 'success',
            });
            refetch();
        },
        onError: (_err: any) => {
            toaster.create({
                title: `Error: You've already received this type of airdrop.`,
                type: 'error',
            });
        }
    })

    return { balance: data || 0, refetch, getAirdrop: mutate, isLoading: isPending };
}

export default useAirdrop;
