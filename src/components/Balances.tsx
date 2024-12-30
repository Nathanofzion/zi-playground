import useGetNativeTokenBalance from '@/hooks/useGetNativeTokenBalance';
import { Box, Paper, styled, Typography } from '@mui/material';
import { useSorobanReact } from '@soroban-react/core';
import copy from 'copy-to-clipboard';
import { useState } from 'react';
import { Check, Clipboard } from 'react-feather';

const PageWrapper = styled(Paper)`
  padding: 32px 48px;
  width: 100%;
  max-width: 480px;
  background: ${({ theme }) => `linear-gradient(${theme.palette.customBackground.bg2}, ${theme.palette.customBackground.bg2}) padding-box, linear-gradient(150deg, rgba(136,102,221,1) 0%, rgba(${theme.palette.mode == 'dark' ? '33,29,50,1' : '255,255,255,1'}) 35%, rgba(${theme.palette.mode == 'dark' ? '33,29,50,1' : '255,255,255,1'}) 65%, rgba(136,102,221,1) 100%) border-box`};
  border: 1px solid transparent;
  border-radius: 16px;
`;

export function Balances() {
  const { address } = useSorobanReact();
  const { data: tokenBalance } = useGetNativeTokenBalance();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (address) {
      copy(address);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }

  if (address) {
    return (
      <PageWrapper>
        <Box display='flex' justifyContent='space-between'>
          <Box width='48px' height='48px' backgroundColor='#fff4' borderRadius='9999px' />
          <Box>
            <Typography fontWeight='bold'>Balance</Typography>
            <Typography fontWeight='bold'>{tokenBalance ? (Number(tokenBalance.data) / 10000000) : 0} XLM</Typography>
          </Box>
        </Box>
        <Box>
          <Typography fontWeight='bold'>
            Your wallet
          </Typography>
          <Box display='flex' gap='8px' alignItems='center'>
            <Typography p='4px' backgroundColor='rgba(6, 182, 212, 0.2)' fontSize='12px' borderRadius='4px'>
              {`${address.slice(0, 19)}...${address.slice(address.length - 3, address.length)}`}
            </Typography>
            <Box width='32px' height='32px' display='flex' justifyContent='center' alignItems='center' backgroundColor='rgba(100, 116, 139, 0.2)' borderRadius='9999px' onClick={handleCopy}>
              {copied ? (
                <Check size='16px' />
              ) : (
                <Clipboard size='16px' />
              )}
            </Box>
          </Box>
        </Box>
      </PageWrapper>
    )
  }

  return <></>
}
