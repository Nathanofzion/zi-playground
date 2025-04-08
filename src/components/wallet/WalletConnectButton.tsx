import { FC, useState } from "react";

import { Flex, FlexProps, HStack, Image, Spinner, Text } from "@chakra-ui/react";

import { IWallet } from "@/interfaces";

import { useColorModeValue } from "../ui/color-mode";

interface Props extends FlexProps {
  wallet: IWallet;
  onConnect?: () => void;
}

const WalletConnectButton: FC<Props> = ({ wallet, onConnect, ...props }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await wallet.connect?.();
      onConnect?.();
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <Flex
      p='16px'
      justify='space-between'
      bg={useColorModeValue('#F8F8F8', '#0F1016')}
      rounded='16px'
      cursor='pointer'
      onClick={handleConnect}
      {...props}
    >
      <Flex gap='16px'>
        <Image alt={wallet?.sname} src={wallet?.iconUrl} w='24px' h='24px' rounded='8px' />
        <Text>
          {wallet?.name} Wallet
        </Text>
      </Flex>
      <HStack>
        {isConnecting && (
          <Spinner size='sm' />
        )}
        {wallet?.isConnected ? (
          <Text color={useColorModeValue('#F66B3C', '#B4EFAF')}>
            {wallet?.sname == 'Passkey' ? 'Available' : 'Detected'}
          </Text>
        ) : <Text color='#F66B3C'>Install</Text>}
      </HStack>
    </Flex>
  )
}

export default WalletConnectButton;
