import { FC } from "react";

import { Flex, HStack, Image, Link, Spinner, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import useAssets from "@/hooks/useAssets";
import { formatNumber, truncateAddress } from "@/utils";
import { explorerLink } from "../../lib/chain";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";

const BalanceModal: FC<ModalProps> = (props) => {
  const { address } = useSorobanReact();
  const { assets } = useAssets();

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        left={{ base: '50%', lg: '75%' }}
        px={{ base: 4, lg: 8 }}
        py={{ base: 6, lg: 12 }}
        w='full'
        maxW={{ base: '320px', lg: '420px' }}
        direction='column'
        gap='12px'
      >
        <ModalCloseButton />
        <Flex direction='column' gap='4px'>
          <Text fontSize='18px'>
            Your wallet
          </Text>
          <Text fontSize='12px'>
            {truncateAddress(address)}
          </Text>
        </Flex>
        <Flex
          maxH='480px'
          direction='column'
          gap={2}
          overflowY='auto'
        >
          {assets.map((asset, index) => (
            <Flex key={index} direction='column' gap={1}>
              <Flex gap={2}>
                <Flex flex='1 1 0' gap={2}>
                  <Image flex='none' w={10} h={10} alt={asset.code} src={asset.icon} />
                  <Flex direction='column' justify='space-around'>
                    <HStack fontSize='sm'>
                      <Text>
                        {asset.code}
                      </Text>
                      <Link href={`https://${asset.domain}`} color='blue.400' _hover={{ textDecoration: 'underline' }}>
                        {asset.domain}
                      </Link>
                    </HStack>
                    {asset.issuer && (
                      <HStack fontSize='xs'>
                        <Text>
                          Issued by
                        </Text>
                        <Link href={`${explorerLink}/account/${asset.issuer}`} color='blue.400' _hover={{ textDecoration: 'underline' }}>
                          {truncateAddress(asset.issuer)}
                        </Link>
                      </HStack>
                    )}
                    <HStack fontSize='xs'>
                      <Text>
                        Contract
                      </Text>
                      <Link href={`${explorerLink}/contract/${asset.contract}`} color='blue.400' _hover={{ textDecoration: 'underline' }}>
                        {truncateAddress(asset.contract)}
                      </Link>
                    </HStack>
                  </Flex>
                </Flex>
                <Flex pr={4} direction='column' justify='space-around'>
                  {asset.balance != undefined ? (
                    <Text fontSize='sm'>
                      {formatNumber(asset.balance, 2)}
                    </Text>
                  ) : (
                    <Spinner size='sm' />
                  )}
                </Flex>
              </Flex>
            </Flex>
          ))}
        </Flex>
      </ModalContent>
    </Modal>
  )
}

export default BalanceModal;
