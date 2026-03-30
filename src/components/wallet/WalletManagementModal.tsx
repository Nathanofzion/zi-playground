/* eslint-disable */
import { FC, useState, useEffect } from "react";
import { 
  Flex, 
  Text, 
  Button, 
  Input, 
  HStack, 
  VStack, 
  Icon, 
  IconButton,
  Badge,
  Box 
} from "@chakra-ui/react";
import { FiKey, FiPlus, FiTrash2, FiUser } from 'react-icons/fi';
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";
import { useColorModeValue } from "../ui/color-mode";
import { toaster } from "@/components/ui/toaster";
import { 
  getStoredWallets, 
  createNamedWallet, 
  connectToWallet, 
  removeWallet,
  formatWalletAddress,
  getWalletDisplayName,
  WalletInfo 
} from '@/lib/walletManager';
import { requestPasskeyRecovery, requestNewWalletCreation } from '@/lib/passkeyClient';

interface WalletManagementModalProps extends ModalProps {
  onWalletSelected?: () => void;
}

const WalletManagementModal: FC<WalletManagementModalProps> = ({ 
  isOpen, 
  onClose,
  onWalletSelected
}) => {
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [newWalletName, setNewWalletName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWallets();
      setNewWalletName('');
      setShowCreateForm(false);
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
        type: 'success',
        duration: 3000,
      });
      onWalletSelected?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to connect to wallet:', error);
      toaster.create({
        title: 'Connection failed',
        description: error.message || 'Failed to connect to wallet',
        type: 'error',
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
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await createNamedWallet(newWalletName.trim());
      requestNewWalletCreation(); // Set session flags
      toaster.create({
        title: 'Wallet created',
        description: `Created new wallet "${newWalletName.trim()}"`,
        type: 'success',
        duration: 3000,
      });
      onWalletSelected?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to create wallet:', error);
      toaster.create({
        title: 'Creation failed',
        description: error.message || 'Failed to create wallet',
        type: 'error',
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
        type: 'info',
        duration: 3000,
      });
    }
  };

  const handleScanForPasskeys = () => {
    requestPasskeyRecovery();
    onWalletSelected?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        p="24px"
        w="full"
        maxW="500px"
        direction="column"
        gap="20px"
      >
        <ModalCloseButton />
        <Text fontSize="20px" fontWeight="bold">
          {showCreateForm ? 'Create New Wallet' : 'Manage PasskeyID Wallets'}
        </Text>

        {!showCreateForm ? (
          <VStack gap="16px" align="stretch">
            {/* Saved Wallets */}
            {wallets.length > 0 && (
              <Box>
                <Text fontSize="14px" fontWeight="semibold" color="gray.600" mb="12px">
                  Saved Wallets
                </Text>
                <VStack gap="8px" align="stretch">
                  {wallets.map((wallet) => (
                    <Flex
                      key={wallet.id}
                      p="12px"
                      bg={cardBg}
                      border="1px"
                      borderColor={borderColor}
                      borderRadius="8px"
                      justify="space-between"
                      align="center"
                    >
                      <VStack align="start" gap="4px" flex={1}>
                        <HStack>
                          <Icon as={FiUser} color="blue.500" />
                          <Text fontWeight="medium" fontSize="14px">
                            {getWalletDisplayName(wallet)}
                          </Text>
                          {wallet.isActive && (
                            <Badge colorScheme="green" size="sm">
                              Active
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="12px" color="gray.500" ml="20px">
                          {formatWalletAddress(wallet.contractId)}
                        </Text>
                      </VStack>
                      <HStack gap="8px">
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
            )}

            {/* Action Buttons */}
            <VStack gap="12px" align="stretch">
              <Button
                leftIcon={<Icon as={FiKey} />}
                variant="outline"
                onClick={handleScanForPasskeys}
                isLoading={isLoading}
              >
                Scan for Existing Passkeys
              </Button>
              
              <Button
                leftIcon={<Icon as={FiPlus} />}
                colorScheme="blue"
                onClick={() => setShowCreateForm(true)}
              >
                Create New Named Wallet
              </Button>
            </VStack>
          </VStack>
        ) : (
          <VStack gap="16px" align="stretch">
            <Text fontSize="14px" color="gray.600">
              Enter a name to help you identify this wallet
            </Text>
            
            <Input
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
              placeholder="e.g. My Main Wallet, Trading Wallet"
              maxLength={50}
              bg={cardBg}
            />
            
            <Text fontSize="12px" color="gray.500">
              Maximum 50 characters
            </Text>

            <HStack gap="12px">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                flex={1}
              >
                Back
              </Button>
              <Button
                colorScheme="blue"
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
      </ModalContent>
    </Modal>
  );
};

export default WalletManagementModal;