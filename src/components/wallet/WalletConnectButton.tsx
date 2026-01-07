import { FC, useEffect, useState } from "react";

import {
  Flex,
  FlexProps,
  HStack,
  Image,
  Spinner,
  Text,
} from "@chakra-ui/react";

import { IWallet } from "@/interfaces";
import { LocalKeyStorage } from "@/lib/localKeyStorage";

import { useColorModeValue } from "../ui/color-mode";

interface Props extends FlexProps {
  wallet?: IWallet;
  onConnect?: () => void;
}

const WalletConnectButton: FC<Props> = ({ wallet, onConnect, ...props }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [passkeyStatus, setPasskeyStatus] = useState<string | null>(null);
  const walletId = wallet?.id ?? "";
  const walletShortName = wallet?.sname ?? "";
  const cardBg = useColorModeValue("#F8F8F8", "#0F1016");
  const statusColor = useColorModeValue("#F66B3C", "#B4EFAF");
  const passkeyStatusColor = useColorModeValue("#6B7280", "#9CA3AF");

  useEffect(() => {
    const isPasskey = walletId === "passkey" || walletShortName === "Passkey";
    if (!isPasskey || typeof window === "undefined") {
      return;
    }

    setPasskeyStatus(LocalKeyStorage.getPasskeyStatus());

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string | null>).detail ?? null;
      setPasskeyStatus(detail);
    };

    window.addEventListener("passkey-status", handler as EventListener);
    return () => {
      window.removeEventListener("passkey-status", handler as EventListener);
    };
  }, [walletId, walletShortName]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await wallet.connect?.();
      onConnect?.();
    } finally {
      setIsConnecting(false);
    }
  };

  if (!wallet) {
    return null;
  }

  return (
    <Flex
      p="16px"
      direction="column"
      gap="8px"
      bg={cardBg}
      rounded="16px"
      cursor="pointer"
      onClick={handleConnect}
      {...props}
    >
      <Flex justify="space-between" align="center">
        <Flex gap="16px">
          <Image
            alt={wallet?.sname}
            src={wallet?.iconUrl}
            w="24px"
            h="24px"
            rounded="8px"
          />
          <Text>{wallet?.name} Wallet</Text>
        </Flex>
        <HStack>
          {isConnecting && <Spinner size="sm" />}
          {wallet?.isConnected ? (
            <Text color={statusColor}>
              {wallet?.sname == "Passkey" ? "Available" : "Detected"}
            </Text>
          ) : (
            <Text color="#F66B3C">Install</Text>
          )}
        </HStack>
      </Flex>
      {(walletId === "passkey" || walletShortName === "Passkey") &&
        passkeyStatus && (
          <Text fontSize="12px" color={passkeyStatusColor}>
            {passkeyStatus}
          </Text>
        )}
    </Flex>
  );
};

export default WalletConnectButton;
