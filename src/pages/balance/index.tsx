import { Balances } from '@/components/Balances';
import { Box } from '@mui/material';

export default function BalancesPage() {
  return (
    <Box sx={{ py: '128px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Balances />
    </Box>
  )
}
