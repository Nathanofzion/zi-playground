import { useEffect, useMemo, useState } from 'react';

import { useSorobanReact } from '@soroban-react/core';
import { fetchAssetList } from '@stellar-asset-lists/sdk';
import { useQuery } from '@tanstack/react-query';

import { nativeTokens } from '@/constants';
import { AssetWithBalance } from '@/interfaces';
import { fetchAssetImage } from '@/utils';

import { tokenBalance } from './useBalances';

const network = process.env.PUBLIC_STELLAR_NETWORK || 'testnet'
const ziAirdropContractId = process.env.NEXT_PUBLIC_ZI_CONTRACT_ID!;
const assetListUrl = process.env.NEXT_PUBLIC_ASSET_LIST_URL!;

interface BalanceTable {
  [key: string]: number,
}

const useAssets = () => {
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;

  const [assets, setAssets] = useState<AssetWithBalance[]>();
  const [balance, setBalance] = useState<BalanceTable>({});

  const assetsWithBalance = useMemo(
    () => (assets ?? []).map(asset => ({
      ...asset,
      balance: balance[asset.code],
    })),
    [assets, balance],
  );

  const { data } = useQuery<AssetWithBalance[]>({
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
        } as AssetWithBalance,
        {
          name: 'ZIONCOIN',
          code: 'Zi',
          org: 'Zioncoin Foundation',
          domain: 'zioncoin.org.uk',
          icon: 'https://zioncoin.org.uk/wp-content/uploads/2023/12/Zi_Zioncoin_Ticker.png',
          contract: ziAirdropContractId,
        } as AssetWithBalance,
        ...assets,
      ];
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const fetchAssetsImage = async () => {
    if (!data) return;
    setAssets(
      await Promise.all(
        data.map(async asset => ({
          ...asset,
          icon: await fetchAssetImage(asset) ?? asset.icon,
        }))
      )
    );
  }

  const fetchAssetBalance = async (contract: string, code: string) => {
    if (!address) return;
    const balance = await tokenBalance(contract, address, sorobanContext);
    setBalance((prev) => {
      prev[code] = balance;
      return prev;
    });
  }

  const fetchAssetsBalance = async () => {
    if (!data || !address) return;
    await Promise.all(
      data.map(async asset => {
        await fetchAssetBalance(asset.contract, asset.code);
      })
    );
  }

  useQuery({
    queryKey: ['getAssetsImage'],
    queryFn: () => {
      setAssets(data);
      return fetchAssetsImage();
    },
    enabled: !!data,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useQuery({
    queryKey: ['getAssetsBalance'],
    queryFn: fetchAssetsBalance,
    enabled: (!!data && !!address),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return { assets: assetsWithBalance, fetchAssetBalance, fetchAssetsBalance };
}

export default useAssets;
