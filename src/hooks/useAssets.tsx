import { useEffect, useState } from 'react';

import { useSorobanReact } from '@soroban-react/core';
import { fetchAssetList } from '@stellar-asset-lists/sdk';
import { useQuery } from '@tanstack/react-query';

import { nativeTokens } from '@/constants';
import { AssetWithBalance } from '@/interfaces';
import { fetchAssetImage } from '@/utils';

import { tokenBalance } from './useBalances';

const network = process.env.PUBLIC_STELLAR_NETWORK || 'testnet'
const ziAirdropContractId = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID!;
const assetListUrl = process.env.NEXT_PUBLIC_ASSET_LIST_URL!;

interface BalanceTable {
  [key: string]: number,
}

const useAssets = () => {
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;

  const [assets, setAssets] = useState<AssetWithBalance[]>();
  const [balance, setBalance] = useState<BalanceTable>({});

  const assetsWithBalance = (assets ?? []).map(asset => ({
    ...asset,
    balance: balance[asset.code],
  }));

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

  useEffect(() => {
    if (!data) return;
    setAssets(data);
    fetchAssetsImage();
  }, [data]);

  useEffect(() => {
    if (!data || !address) return;
    data.forEach(async asset => {
      const balance = await tokenBalance(asset.contract, address, sorobanContext);
      setBalance((prev) => {
        prev[asset.code] = balance;
        return prev;
      });
    });
  }, [data, address]);

  return { assets: assetsWithBalance };
}

export default useAssets;
