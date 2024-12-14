import AddLiquidityComponent from '@/components/Liquidity/Add/AddLiquidityComponent';
import SEO from '@/components/SEO';
import { useApiTokens } from '@/hooks/tokens/useApiTokens';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function AddLiquidityPage() {
  const { tokens } = useApiTokens();
  const router = useNavigate();

  useEffect(() => {
    if (!tokens) return;

    const xlm = tokens.find((token) => token.code === 'XLM');
    if (xlm) router.push(`/liquidity/add/${xlm.contract}`);
  }, [tokens, router]);

  return (
    <>
      <SEO title="Add - Soroswap" description="Soroswap Add" />
      <AddLiquidityComponent />
    </>
  );
}
