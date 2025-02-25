import { useMemo } from 'react';

import { useSorobanReact } from '@soroban-react/core';
import { Asset, fetchAssetList } from '@stellar-asset-lists/sdk';
import { useQueries, useQuery } from '@tanstack/react-query';

import { nativeTokens } from '@/constants';
import { tokenBalance } from '@/services/contract';
import { fetchAssetImage } from '@/utils';

const network = process.env.PUBLIC_STELLAR_NETWORK || 'testnet'
const ziAirdropContractId = process.env.NEXT_PUBLIC_ZI_CONTRACT_ID!;
const assetListUrl = process.env.NEXT_PUBLIC_ASSET_LIST_URL!;

const useAssets = () => {
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;

  const { data } = useQuery<Asset[]>({
    queryKey: ['getAssets'],
    queryFn: async () => {
      const nativeToken = nativeTokens.find((nativeToken) => nativeToken.network === network);
      if (!nativeToken)
        throw new Error(`Native token not found for network ${network}`);
      const { assets } = await fetchAssetList(assetListUrl);
      return [
        {
          name: 'Lumens',
          code: 'XLM',
          org: 'Stellar',
          domain: 'stellar.org',
          icon: 'https://static.lobstr.co/media/XLM-None.png',
          contract: nativeToken.address,
          decimals: 7,
        } as Asset,
        {
          name: 'ZIONCOIN',
          code: 'Zi',
          org: 'Zioncoin Foundation',
          domain: 'zioncoin.org.uk',
          icon: 'https://zioncoin.org.uk/wp-content/uploads/2023/12/Zi_Zioncoin_Ticker.png',
          contract: ziAirdropContractId,
          decimals: 7,
        } as Asset,
        ...assets,
      ];
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const imageTable = useQueries({
    queries: (data ?? []).map(asset => ({
      queryKey: ['getAssetImage', asset.contract],
      queryFn: () => fetchAssetImage(asset),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })),
  });

  const balanceTable = useQueries({
    queries: (data ?? []).map(asset => ({
      queryKey: ['getAssetBalance', address, asset.contract],
      queryFn: async () => {
        try {
          const balance = await tokenBalance(sorobanContext, asset.contract);
          return balance / Math.pow(10, asset.decimals);
        } catch (err) {
          console.error(err);
          return 0;
        }
      },
      enabled: !!address,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })),
  });

  const assets = useMemo(
    () => {
      return (data ?? []).map((asset, index) => {
        return {
          ...asset,
          icon: imageTable[index].data ?? asset.icon,
          balance: balanceTable[index].data ?? 0,
        };
      });
    },
    [data, imageTable, balanceTable],
  );

  return { assets };
}

export default useAssets;
