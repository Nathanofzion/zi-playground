import { AppContext } from '@/contexts';
import { shortenAddress } from '@/helpers/address';
import useGetNativeTokenBalance from '@/hooks/useGetNativeTokenBalance';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useSorobanReact } from '@soroban-react/core';
import copy from 'copy-to-clipboard';
import { useContext, useState } from 'react';
import { Check, Clipboard } from 'react-feather';
import OutsideClickHandler from 'react-outside-click-handler';
import { ButtonPrimary, SmallButtonPrimary } from '../Buttons/Buttons';

export default function ProfileSection() {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down(1220));
	const { ConnectWalletModal: { setConnectWalletModalOpen } } = useContext(AppContext);
	const { address } = useSorobanReact();
	const { data: tokenBalance } = useGetNativeTokenBalance();
	const [showMenu, setShowMenu] = useState(false);
	const [copied, setCopied] = useState(false);

	const Button = isMobile ? SmallButtonPrimary : ButtonPrimary;

	const handleCopy = () => {
		if (address) {
			copy(address);
			setCopied(true);
			setTimeout(() => {
				setCopied(false);
			}, 2000);
		}
	}

	return (
		<Box display='flex' flexDirection='column'>
			{address ? (
				<Button onClick={() => setShowMenu(true)}>
					{shortenAddress(address)}
				</Button>
			) : (
				<Button onClick={() => setConnectWalletModalOpen(true)}>
					Connect
				</Button>
			)}
			{(showMenu && address) && (
				<Box position='relative'>
					<OutsideClickHandler onOutsideClick={() => setShowMenu(false)}>
						<Box position='absolute' right='0' top='8px' p='16px' backgroundColor='#000e' color='white' borderRadius='16px'>
							<Box display='flex' justifyContent='space-between'>
								<Box width='48px' height='48px' backgroundColor='#fff4' borderRadius='9999px' />
								<Box>
									<Typography fontWeight='bold'>Balance</Typography>
									<Typography fontWeight='bold'>{tokenBalance ? (Number(tokenBalance.data) / 10000000) : 0} XLM</Typography>
								</Box>
							</Box>
							<Box>
								<Typography fontWeight='bold'>
									Your wallet
								</Typography>
								<Box display='flex' gap='8px' alignItems='center'>
									<Typography p='4px' backgroundColor='rgba(6, 182, 212, 0.2)' fontSize='12px' borderRadius='4px'>
										{`${address.slice(0, 19)}...${address.slice(address.length - 3, address.length)}`}
									</Typography>
									<Box width='32px' height='32px' display='flex' justifyContent='center' alignItems='center' backgroundColor='rgba(100, 116, 139, 0.2)' borderRadius='9999px' onClick={handleCopy}>
										{copied ? (
											<Check size='16px' />
										) : (
											<Clipboard size='16px' />
										)}
									</Box>
								</Box>
							</Box>
						</Box>
					</OutsideClickHandler>
				</Box>
			)}
		</Box>
	);
}
