import axios from "axios";

import { useSorobanReact } from "@soroban-react/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toaster } from "@/components/ui/toaster";
import zionToken from "@/constants/zionToken";
import { getAirdropStatus } from "@/services/contract";

export enum Action {
    SpinCube = 1,
    CreateParticles = 2,
    ChangeTheme = 3
}

const useAirdrop = () => {
    const sorobanContext = useSorobanReact();
    const { address } = sorobanContext;
    const queryClient = useQueryClient();

    const { data: status, refetch: refetchStatus } = useQuery({
        queryKey: ['getAirdropStatus', address],
        queryFn: async () => {
            if (!address) return 0;
            return getAirdropStatus(sorobanContext, address);
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
            queryClient.invalidateQueries({
                queryKey: ['getAssetBalance', address, zionToken.contract],
            });
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
