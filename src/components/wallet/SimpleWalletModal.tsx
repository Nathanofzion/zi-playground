'use client';

import { FC, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  VStack,
  HStack,
  Text,
  Input,
  Box,
  Flex,
  Spinner,
} from '@chakra-ui/react';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import passkeyAnimation from '../../../public/assets/animations/passkey.json';

import Modal from '../common/Modal';
import ModalContent from '../common/ModalContent';
import ModalOverlay from '../common/ModalOverlay';
import ModalCloseButton from '../common/ModalCloseButton';
import { useColorModeValue } from '../ui/color-mode';

import { 
  getStoredWallets, 
  createNamedWallet, 
  connectToWallet, 
  removeWallet,
  formatWalletAddress,
  WalletInfo 
} from '@/lib/walletManager';
import { toaster } from "@/components/ui/toaster";

interface SimpleWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activateConnector?: () => Promise<void>;
}

type ViewType = 'main' | 'choose' | 'create' | 'delete' | 'confirm-delete';

const SimpleWalletModal: FC<SimpleWalletModalProps> = ({ isOpen, onClose, onSuccess, activateConnector }) => {
  const [view, setView] = useState<ViewType>('main');
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const [newWalletName, setNewWalletName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingWalletId, setLoadingWalletId] = useState<string | null>(null);

  const cardBg = useColorModeValue("#F8F8F8", "#0F1016");

  useEffect(() => {
    if (isOpen) {
      console.log('🔧 SimpleWalletModal opened - loading wallets...');
      const loadedWallets = getStoredWallets();
      console.log('📝 Loaded wallets:', loadedWallets);
      setWallets(loadedWallets);
      setView('main');
      setNewWalletName('');
      setSelectedWallet(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setView('main');
    setNewWalletName('');
    setSelectedWallet(null);
    setIsLoading(false);
    setLoadingWalletId(null);
    onClose();
  };

  const handleChooseWallet = () => {
    setView('choose');
  };

  const handleCreateWallet = () => {
    setView('create');
  };

  const handleDeleteWallet = () => {
    setView('delete');
  };

  const handleWalletSelect = async (wallet: WalletInfo) => {
    setIsLoading(true);
    setLoadingWalletId(wallet.id);
    try {
      // First, set up the wallet data in LocalKeyStorage
      await connectToWallet(wallet);
      
      // Then, activate the PasskeyID connector in SorobanReactProvider
      if (activateConnector) {
        await activateConnector();
      }
      
      toaster.create({
        title: 'Success',
        description: `Connected to ${wallet.name}`,
        type: 'success',
      });
      onSuccess();
      handleClose();
    } catch (error) {
      toaster.create({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect wallet',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
      setLoadingWalletId(null);
    }
  };

  const handleCreateSubmit = async () => {
    if (!newWalletName.trim()) return;
    
    setIsLoading(true);
    try {
      console.log('🔨 Creating new wallet:', newWalletName.trim());
      const walletInfo = await createNamedWallet(newWalletName.trim());
      console.log('✅ Wallet created with contract:', walletInfo.contractId.substring(0, 8) + '...');
      
      // The wallet is already created and saved, now we just need to connect to it
      // Use connectToWallet instead of setActiveConnectorAndConnect to avoid duplicate creation
      console.log('🔗 Connecting to newly created wallet...');
      await connectToWallet(walletInfo);
      
      toaster.create({
        title: 'Success',
        description: `Wallet "${newWalletName}" created successfully!`,
        type: 'success',
      });
      onSuccess();
      handleClose();
    } catch (error) {
      toaster.create({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'Failed to create wallet',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSelect = (wallet: WalletInfo) => {
    setSelectedWallet(wallet);
    setView('confirm-delete');
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWallet) return;
    
    setIsLoading(true);
    try {
      removeWallet(selectedWallet.id); // Use wallet.id, not wallet.keyId
      toaster.create({
        title: 'Success',
        description: `Wallet "${selectedWallet.name}" deleted successfully!`,
        type: 'success',
      });
      setWallets(getStoredWallets());
      setView('main');
    } catch (error) {
      toaster.create({
        title: 'Deletion Failed',
        description: error instanceof Error ? error.message : 'Failed to delete wallet',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
      setSelectedWallet(null);
    }
  };

  const renderMainView = () => (
    <VStack gap={4} align="stretch">
      <Box mx="auto" w="160px" h="213px" mt={6} mb={4} overflow="hidden">
        <Lottie animationData={passkeyAnimation} loop autoplay />
      </Box>

      <Text fontSize="lg" fontWeight="bold" textAlign="center">
        PasskeyID Wallet Manager
      </Text>
      
      <Text fontSize="sm" color="gray.600" textAlign="center">
        Choose an option to manage your PasskeyID wallets
      </Text>
      
      <Flex
        p="16px"
        direction="column"
        gap="8px"
        bg={cardBg}
        rounded="16px"
        cursor="pointer"
        onClick={handleChooseWallet}
        opacity={wallets.length === 0 ? 0.5 : 1}
        pointerEvents={wallets.length === 0 ? 'none' : 'auto'}
        _hover={{ transform: wallets.length > 0 ? 'translateY(-2px)' : 'none' }}
        transition="all 0.2s"
      >
        <Flex justify="space-between" align="center">
          <Text fontWeight="bold">Choose Wallet from list</Text>
          <Text fontSize="xs" opacity={0.8}>
            {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} available
          </Text>
        </Flex>
      </Flex>

      <Flex
        p="16px"
        direction="column"
        gap="8px"
        bg={cardBg}
        rounded="16px"
        cursor="pointer"
        onClick={handleCreateWallet}
        _hover={{ transform: 'translateY(-2px)' }}
        transition="all 0.2s"
      >
        <Flex justify="space-between" align="center">
          <Text fontWeight="bold">Create New Wallet</Text>
          <Text fontSize="xs" opacity={0.8}>Add a new PasskeyID wallet</Text>
        </Flex>
      </Flex>

      <Flex
        p="16px"
        direction="column"
        gap="8px"
        bg={cardBg}
        rounded="16px"
        cursor="pointer"
        onClick={handleDeleteWallet}
        opacity={wallets.length === 0 ? 0.5 : 1}
        pointerEvents={wallets.length === 0 ? 'none' : 'auto'}
        _hover={{ transform: wallets.length > 0 ? 'translateY(-2px)' : 'none' }}
        transition="all 0.2s"
      >
        <Flex justify="space-between" align="center">
          <Text fontWeight="bold" color={wallets.length === 0 ? 'gray.400' : 'red.500'}>
            Delete wallet from list
          </Text>
          <Text fontSize="xs" opacity={0.8}>Remove an existing wallet</Text>
        </Flex>
      </Flex>
    </VStack>
  );

  const renderChooseView = () => (
    <VStack gap={4} align="stretch">
      <HStack>
        <Flex
          p="8px"
          bg={cardBg}
          rounded="8px"
          cursor="pointer"
          onClick={() => setView('main')}
          _hover={{ transform: 'translateY(-1px)' }}
          transition="all 0.2s"
        >
          <Text fontSize="sm">← Back</Text>
        </Flex>
        <Text fontWeight="bold">Select Wallet</Text>
      </HStack>
      
      {wallets.map((wallet) => {
        const isWalletLoading = loadingWalletId === wallet.id;
        return (
          <Flex
            key={wallet.keyId}
            p="16px"
            direction="column"
            gap="8px"
            bg={cardBg}
            rounded="16px"
            cursor={isWalletLoading ? 'not-allowed' : 'pointer'}
            onClick={() => !isWalletLoading && handleWalletSelect(wallet)}
            opacity={isWalletLoading ? 0.7 : 1}
            _hover={{ transform: isWalletLoading ? 'none' : 'translateY(-2px)' }}
            transition="all 0.2s"
          >
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                {isWalletLoading && <Spinner size="sm" />}
                <Text fontWeight="bold">{wallet.name}</Text>
              </Flex>
              <Text fontSize="xs" color="gray.500">
                {formatWalletAddress(wallet.contractId)}
              </Text>
            </Flex>
            {isWalletLoading && (
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Connecting with TouchID/FaceID...
              </Text>
            )}
          </Flex>
        );
      })}
    </VStack>
  );

  const renderCreateView = () => (
    <VStack gap={4} align="stretch">
      <HStack>
        <Flex
          p="8px"
          bg={cardBg}
          rounded="8px"
          cursor="pointer"
          onClick={() => setView('main')}
          _hover={{ transform: 'translateY(-1px)' }}
          transition="all 0.2s"
        >
          <Text fontSize="sm">← Back</Text>
        </Flex>
        <Text fontWeight="bold">Create New Wallet</Text>
      </HStack>
      
      <Input
        placeholder="Enter wallet name"
        value={newWalletName}
        onChange={(e) => setNewWalletName(e.target.value)}
        maxLength={50}
        bg={cardBg}
        rounded="16px"
        p="16px"
        border="none"
      />
      
      <Flex
        p="16px"
        direction="column"
        gap="8px"
        bg={cardBg}
        rounded="16px"
        cursor="pointer"
        onClick={handleCreateSubmit}
        opacity={!newWalletName.trim() || isLoading ? 0.5 : 1}
        pointerEvents={!newWalletName.trim() || isLoading ? 'none' : 'auto'}
        _hover={{ transform: newWalletName.trim() && !isLoading ? 'translateY(-2px)' : 'none' }}
        transition="all 0.2s"
      >
        <Flex justify="center" align="center" gap={2}>
          {isLoading && <Spinner size="sm" />}
          <Text fontWeight="bold">
            {isLoading ? 'Creating...' : 'Create Wallet'}
          </Text>
        </Flex>
      </Flex>
    </VStack>
  );

  const renderDeleteView = () => (
    <VStack gap={4} align="stretch">
      <HStack>
        <Flex
          p="8px"
          bg={cardBg}
          rounded="8px"
          cursor="pointer"
          onClick={() => setView('main')}
          _hover={{ transform: 'translateY(-1px)' }}
          transition="all 0.2s"
        >
          <Text fontSize="sm">← Back</Text>
        </Flex>
        <Text fontWeight="bold">Delete Wallet</Text>
      </HStack>
      
      {wallets.map((wallet) => (
        <Flex
          key={wallet.keyId}
          p="16px"
          direction="column"
          gap="8px"
          bg={cardBg}
          rounded="16px"
          cursor="pointer"
          onClick={() => handleDeleteSelect(wallet)}
          _hover={{ transform: 'translateY(-2px)' }}
          transition="all 0.2s"
        >
          <Flex justify="space-between" align="center">
            <Text fontWeight="bold" color="red.500">{wallet.name}</Text>
            <Text fontSize="xs" color="gray.500">
              {formatWalletAddress(wallet.contractId)}
            </Text>
          </Flex>
        </Flex>
      ))}
    </VStack>
  );

  const renderConfirmDeleteView = () => (
    <VStack gap={4} align="stretch">
      <Text fontWeight="bold" color="red.500" textAlign="center">
        Confirm Deletion
      </Text>
      
      <Flex
        p="16px"
        direction="column"
        gap="8px"
        bg={cardBg}
        rounded="16px"
      >
        <Flex justify="space-between" align="center">
          <Text fontWeight="bold">{selectedWallet?.name}</Text>
          <Text fontSize="xs" color="gray.500">
            {formatWalletAddress(selectedWallet?.contractId || '')}
          </Text>
        </Flex>
      </Flex>
      
      <Text fontSize="sm" color="gray.600" textAlign="center">
        Are you sure you want to delete this wallet? This action cannot be undone.
      </Text>
      
      <HStack gap={3}>
        <Flex
          flex={1}
          p="16px"
          bg={cardBg}
          rounded="16px"
          cursor="pointer"
          onClick={() => setView('delete')}
          _hover={{ transform: 'translateY(-2px)' }}
          transition="all 0.2s"
          justify="center"
        >
          <Text fontWeight="bold">Cancel</Text>
        </Flex>
        <Flex
          flex={1}
          p="16px"
          bg={cardBg}
          rounded="16px"
          cursor="pointer"
          onClick={handleDeleteConfirm}
          opacity={isLoading ? 0.5 : 1}
          pointerEvents={isLoading ? 'none' : 'auto'}
          _hover={{ transform: !isLoading ? 'translateY(-2px)' : 'none' }}
          transition="all 0.2s"
          justify="center"
        >
          <Flex justify="center" align="center" gap={2}>
            {isLoading && <Spinner size="sm" color="red.500" />}
            <Text fontWeight="bold" color="red.500">
              {isLoading ? 'Deleting...' : 'Delete'}
            </Text>
          </Flex>
        </Flex>
      </HStack>
    </VStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent maxW="md" p={6}>
        <ModalCloseButton />
        {view === 'main' && renderMainView()}
        {view === 'choose' && renderChooseView()}
        {view === 'create' && renderCreateView()}
        {view === 'delete' && renderDeleteView()}
        {view === 'confirm-delete' && renderConfirmDeleteView()}
      </ModalContent>
    </Modal>
  );
};

export default SimpleWalletModal;