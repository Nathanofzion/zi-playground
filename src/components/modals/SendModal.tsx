import { FC, useEffect, useState } from "react";

import { Flex, Heading, Image, Input, Spinner, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";
import { Asset } from "@stellar-asset-lists/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import useAssets from "@/hooks/useAssets";
import { sendAsset } from "@/services/contract";

import Button from "../Button";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";
import { toaster } from "../ui/toaster";

const SendModal: FC<ModalProps> = (props) => {
    const sorobanContext = useSorobanReact();
    const queryClient = useQueryClient();
    const { assets } = useAssets();
    const [asset, setAsset] = useState<Asset>();
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");

    const { mutate, isPending } = useMutation({
        mutationFn: () => {
            if (!asset) {
                throw new Error('Please select asset to send.');
            }
            return sendAsset(sorobanContext, asset, recipient, Number(amount));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['getAssetBalance', asset?.contract] }),
                toaster.create({
                    title: `You've sent asset successfully.`,
                    type: 'success',
                });
        }
    });

    const handleSend = () => {
        if (!asset) return;
        mutate();
    }

    return (
        <Modal {...props}>
            <ModalOverlay />
            <ModalContent left={{ base: '50%', lg: '75%' }} p={8} w='full' maxW={{ base: '320px', lg: '420px' }} direction='column' gap={4}>
                <ModalCloseButton />
                <Heading as="h2" textAlign="center" size="lg">
                    SEND
                </Heading>
                {asset ? (
                    <Flex direction="column" gap={2}>
                        <Flex direction="column" gap={1}>
                            <Text pl={2}>
                                Recipient stellar address
                            </Text>
                            <Input
                                p='1rem'
                                bg='rgba(255, 255, 255, 0.15)'
                                border='none'
                                rounded='full'
                                shadow='0 8px 32px 0 rgba(31, 38, 135, 0.37)'
                                onChange={(e) => setRecipient(e.target.value)}
                            />
                        </Flex>
                        <Flex direction="column" gap={1}>
                            <Text pl={2}>
                                Amount
                            </Text>
                            <Input
                                p='1rem'
                                bg='rgba(255, 255, 255, 0.15)'
                                border='none'
                                rounded='full'
                                shadow='0 8px 32px 0 rgba(31, 38, 135, 0.37)'
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </Flex>
                        <Flex justify="right">
                            <Button onClick={handleSend}>
                                {isPending && <Spinner size="sm" />}
                                Send
                            </Button>
                        </Flex>
                    </Flex>
                ) : (
                    <Flex
                        maxH='480px'
                        direction='column'
                        gap={1}
                        overflowY='auto'
                    >
                        {assets.filter(asset => asset.balance && asset.balance > 0).map((asset, index) => (
                            <Flex
                                key={index}
                                p={2}
                                gap={2}
                                rounded="md"
                                cursor="pointer"
                                _hover={{
                                    bg: "rgba(255, 255, 255, 0.15)",
                                }}
                                onClick={() => setAsset(asset)}
                            >
                                <Flex flex='1 1 0' gap={2}>
                                    <Image flex='none' w={10} h={10} alt={asset.code} src={asset.icon} />
                                    <Flex direction='column' justify='space-around'>
                                        <Text maxW='120px' fontSize='small' truncate>
                                            {asset.name}
                                        </Text>
                                        <Text fontSize='x-small'>
                                            {asset.code} ({asset.domain})
                                        </Text>
                                    </Flex>
                                </Flex>
                                <Flex direction='column' justify='space-around'>
                                    {asset.balance != undefined ? (
                                        <Text>
                                            {asset.balance}
                                        </Text>
                                    ) : (
                                        <Spinner size='sm' />
                                    )}
                                </Flex>
                            </Flex>
                        ))}
                    </Flex>
                )}

            </ModalContent>
        </Modal>
    )
}

export default SendModal;
