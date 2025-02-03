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

    const { data: balance, refetch: refetchBalance } = useQuery({
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

    const { data: status, error, refetch: refetchStatus } = useQuery({
        queryKey: ['getAirdropStatus', address],
        queryFn: async () => {
            if (!address) return 0;
            const response = await contractInvoke({
                contractAddress,
                method: 'get_status',
                args: [accountToScVal(address)],
                sorobanContext,
            });
            return Number(scValToBigInt(response as xdr.ScVal));
        },
        enabled: !!address,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    const { mutateAsync: getAirdrop, isPending: isGettingAirdrop } = useMutation({
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
            refetchBalance();
            refetchStatus();
        },
        onError: (_err: any) => {
            toaster.create({
                title: `Error: You've already received this type of airdrop.`,
                type: 'error',
            });
        }
    });

    refetchStatus();

    return { balance: balance || 0, refetchBalance, status: status || 0, refetchStatus, getAirdrop, isGettingAirdrop };
}

export default useAirdrop;
