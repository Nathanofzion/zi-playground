import axios from "axios";

import { contractInvoke } from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
import { scValToBigInt, xdr } from "@stellar/stellar-sdk";
import { useMutation, useQuery } from "@tanstack/react-query";

import { toaster } from "@/components/ui/toaster";
import { accountToScVal } from "@/utils";

import useAssets from "./useAssets";

const contractAddress = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID;
const ziContractId = process.env.NEXT_PUBLIC_ZI_CONTRACT_ID!;

export enum Action {
    SpinCube = 1,
    CreateParticles = 2,
    ChangeTheme = 3
}

const useAirdrop = () => {
    const sorobanContext = useSorobanReact();
    const { address } = sorobanContext;
    const { fetchAssetBalance } = useAssets();

    const { data: status, refetch: refetchStatus } = useQuery({
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
        mutationFn: (action: Action) => {
            if (!address)
                throw new Error('Please connect wallet to get airdrop.');
            return axios.post('/api/airdrop', { address, action });
        },
        onSuccess: () => {
            toaster.create({
                title: 'You have successfully received the airdrop.',
                type: 'success',
            });
            fetchAssetBalance(ziContractId, "Zi");
            refetchStatus();
        },
        onError: (err: any) => {
            toaster.create({
                title: `Error: ${err.response?.data.error}`,
                type: 'error',
            });
        }
    });

    refetchStatus();

    return { status: status || 0, refetchStatus, getAirdrop, isGettingAirdrop };
}

export default useAirdrop;
