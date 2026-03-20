import React, { useState, useEffect } from 'react';
import {
  Button,
  Text,
  VStack,
  HStack,
  Icon,
  Input,
  Box,
  IconButton,
  Badge,
  Flex,
  Separator,
} from '@chakra-ui/react';
import { FiKey, FiPlus, FiTrash2, FiUser } from 'react-icons/fi';
import { requestPasskeyRecovery, requestNewWalletCreation } from '@/lib/passkeyClient';
import Modal from '@/components/common/Modal';
import ModalContent from '@/components/common/ModalContent';
import { useColorModeValue } from '@/components/ui/color-mode';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import { 
  getStoredWallets, 
  createNamedWallet, 
  connectToWallet, 
  removeWallet,
  formatWalletAddress,
  getWalletDisplayName,
  WalletInfo 
} from '@/lib/walletManager';

interface PasskeyChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChoice: (choice: 'recover' | 'new') => void;
}

const PasskeyChoiceModal: React.FC<PasskeyChoiceModalProps> = ({
  isOpen,
  onClose,
  onChoice,
}) => {
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [newWalletName, setNewWalletName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'list' | 'create'>('list');

  useEffect(() => {
    if (isOpen) {
      loadWallets();
      setNewWalletName('');
      setMode('list');
    }
  }, [isOpen]);

  const loadWallets = () => {
    const storedWallets = getStoredWallets();
    setWallets(storedWallets);
  };

  const handleConnectToWallet = async (wallet: WalletInfo) => {
    setIsLoading(true);
    try {
      await connectToWallet(wallet);
      requestPasskeyRecovery(); // Set session flags
      toaster.create({
        title: 'Connected to wallet',
        description: `Connected to "${getWalletDisplayName(wallet)}"`,
        status: 'success',
        duration: 3000,
      });
      onChoice('recover');
      onClose();
    } catch (error: any) {
      console.error('Failed to connect to wallet:', error);
      toaster.create({
        title: 'Connection failed',
        description: error.message || 'Failed to connect to wallet',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewWallet = async () => {
    if (!newWalletName.trim()) {
      toaster.create({
        title: 'Wallet name required',
        description: 'Please enter a name for your new wallet',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await createNamedWallet('ZI Playground', newWalletName.trim());
      requestNewWalletCreation(); // Set session flags
      toaster.create({
        title: 'Wallet created',
        description: `Created new wallet "${newWalletName.trim()}"`,
        status: 'success',
        duration: 3000,
      });
      onChoice('new');
      onClose();
    } catch (error: any) {
      console.error('Failed to create wallet:', error);
      toaster.create({
        title: 'Creation failed',
        description: error.message || 'Failed to create wallet',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWallet = (walletId: string, walletName: string) => {
    if (confirm(`Are you sure you want to remove "${walletName}" from this device? This will not delete the actual wallet, just remove it from your saved wallets list.`)) {
      removeWallet(walletId);
      loadWallets();
      toaster.create({
        title: 'Wallet removed',
        description: `"${walletName}" removed from saved wallets`,
        status: 'info',
        duration: 3000,
      });
    }
  };

  const handleRecoverChoice = () => {
    requestPasskeyRecovery();
    onChoice('recover');
    onClose();
  };

  const handleNewChoice = () => {
    setMode('create');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent p={6} maxW="500px">
        <VStack spacing={4} align="stretch">
          <VStack spacing={2} textAlign="center">
            <Text fontSize="lg" fontWeight="bold">
              {mode === 'list' ? 'Connect PasskeyID Wallet' : 'Create New Wallet'}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {mode === 'list' ? 'Choose how you\'d like to connect' : 'Enter a name for your new wallet'}
            </Text>
          </VStack>
          
          {mode === 'list' ? (
            <VStack spacing={4} align="stretch">
              {/* Saved Wallets */}
              {wallets.length > 0 && (
                <>
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={3}>
                      Saved Wallets
                    </Text>
                    <VStack spacing={2} align="stretch">
                      {wallets.map((wallet) => (
                        <Flex
                          key={wallet.id}
                          p={3}
                          bg={cardBg}
                          border="1px"
                          borderColor={borderColor}
                          borderRadius="md"
                          justify="space-between"
                          align="center"
                        >
                          <VStack align="start" spacing={1} flex={1}>
                            <HStack>
                              <Icon as={FiUser} color="blue.500" />
                              <Text fontWeight="medium" fontSize="sm">
                                {getWalletDisplayName(wallet)}
                              </Text>
                              {wallet.isActive && (
                                <Badge colorScheme="green" size="sm">
                                  Active
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="xs" color="gray.500" ml={6}>
                              {formatWalletAddress(wallet.contractId)}
                            </Text>
                            <Text fontSize="xs" color="gray.400" ml={6}>
                              Last used: {new Date(wallet.lastUsed).toLocaleDateString()}
                            </Text>
                          </VStack>
                          <HStack>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              isLoading={isLoading}
                              onClick={() => handleConnectToWallet(wallet)}
                            >
                              Connect
                            </Button>
                            <IconButton
                              size="sm"
                              icon={<Icon as={FiTrash2} />}
                              aria-label="Remove wallet"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteWallet(wallet.id, wallet.name)}
                            />
                          </HStack>
                        </Flex>
                      ))}
                    </VStack>
                  </Box>
                  <Separator />
                </>
              )}

              {/* Recovery Option */}
              <Button
                w="full"
                h="auto"
                p={4}
                bg={cardBg}
                border="1px"
                borderColor={borderColor}
                borderRadius="md"
                onClick={handleRecoverChoice}
                _hover={{ borderColor: 'blue.300' }}
                isLoading={isLoading}
              >
                <HStack spacing={3} w="full">
                  <Icon as={FiKey} boxSize={6} color="blue.500" />
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="semibold" fontSize="sm">
                      Scan for Existing Passkeys
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Find passkeys not in your saved list
                    </Text>
                  </VStack>
                </HStack>
              </Button>

              {/* Create New Option */}
              <Button
                w="full"
                h="auto"
                p={4}
                bg={cardBg}
                border="1px"
                borderColor={borderColor}
                borderRadius="md"
                onClick={handleNewChoice}
                _hover={{ borderColor: 'green.300' }}
              >
                <HStack spacing={3} w="full">
                  <Icon as={FiPlus} boxSize={6} color="green.500" />
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="semibold" fontSize="sm">
                      Create New Wallet
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Set up a fresh passkey wallet with custom name
                    </Text>
                  </VStack>
                </HStack>
              </Button>
            </VStack>
          ) : (
            <VStack spacing={4} align="stretch">
              <Field
                label="Wallet Name"
                helperText="Choose a name to help you identify this wallet (max 50 characters)"
              >
                <Input
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder="e.g. My Main Wallet, Trading Wallet"
                  maxLength={50}
                  bg={cardBg}
                />
              </Field>

              <HStack spacing={2}>
                <Button
                  variant="outline"
                  onClick={() => setMode('list')}
                  flex={1}
                >
                  Back
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleCreateNewWallet}
                  isLoading={isLoading}
                  flex={1}
                  isDisabled={!newWalletName.trim()}
                >
                  Create Wallet
                </Button>
              </HStack>
            </VStack>
          )}
        </VStack>
      </ModalContent>
    </Modal>
  );
};

export default PasskeyChoiceModal;