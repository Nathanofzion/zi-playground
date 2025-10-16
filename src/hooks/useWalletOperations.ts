import { useState } from 'react';
import { stellarService } from '@/services/stellarService';

export const useWalletOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fundAccount = async (publicKey: string, amount?: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await stellarService.fundAccount(publicKey, amount);
      console.log('✅ Account funded:', result);
      return result;
    } catch (err: any) {
      console.error('❌ Account funding failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const requestAirdrop = async (address: string, action?: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await stellarService.requestAirdrop(address, action);
      console.log('✅ Airdrop successful:', result);
      return result;
    } catch (err: any) {
      console.error('❌ Airdrop failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTransaction = async (xdr: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await stellarService.sendTransaction(xdr);
      console.log('✅ Transaction sent:', result);
      return result;
    } catch (err: any) {
      console.error('❌ Transaction failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fundAccount,
    requestAirdrop,
    sendTransaction,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};