import { FC } from "react";

import { Flex, FlexProps, Image, Text } from "@chakra-ui/react";

import { IWallet } from "@/interfaces";

import { useColorModeValue } from "../ui/color-mode";

interface Props extends FlexProps {
    wallet?: IWallet;
}

const WalletConnectButton: FC<Props> = ({ wallet, ...props }) => {
    return (
        <Flex p='16px' justify='space-between' bg={useColorModeValue('#F8F8F8', '#0F1016')} rounded='16px' cursor='pointer' {...props}>
            <Flex gap='16px'>
                <Image alt={wallet?.sname} src={wallet?.iconUrl} w='24px' h='24px' rounded='8px' />
                <Text>
                    {wallet?.name} Wallet
                </Text>
            </Flex>
            {wallet?.isConnected ? (
                <Text color={useColorModeValue('#F66B3C', '#B4EFAF')}>
                    {wallet?.sname == 'Passkey' ? 'Available' : 'Detected'}
                </Text>
            ) : <Text color='#F66B3C'>Install</Text>}
        </Flex>
    )
}

export default WalletConnectButton;
