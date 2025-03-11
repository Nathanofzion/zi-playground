import { FC, useEffect, useMemo, useRef, useState } from "react";

import { Box, Flex, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";
import { Connector } from "@soroban-react/types";

import Button from "@/components/Button";
import { ModalCloseButton, ModalContent, ModalOverlay } from "@/components/common";
import GetAirdropButton from "@/components/common/GetAirdropButton";
import Modal, { ModalProps } from "@/components/common/Modal";
import Viewer from "@/components/Earth";
import { MouseClickIcon } from "@/components/icons";
import { WalletConnectButton } from "@/components/wallet";
import useAirdrop, { Action } from "@/hooks/useAirdrop";
import useWallets from "@/hooks/useWallets";
import { connect } from "@/lib/wallet";

interface StepProps {
  step: number;
  onFinish: () => void;
}

const Step: FC<StepProps> = ({ step, onFinish }) => {
  const { connectors, setActiveConnectorAndConnect } = useSorobanReact();
  const wallets = useWallets();

  const clickedRef = useRef(0);
  const isDownRef = useRef(false);
  const [startAnimation, setStartAnimation] = useState(false);

  const wallet = useMemo(() => wallets.find(wallet => wallet.id == 'passkey')!, [wallets]);
  const connector = useMemo(() => connectors[wallets.findIndex(wallet => wallet.id == 'passkey')]!, [connectors, wallets]);

  const handleConnect = async (connector: Connector) => {
    await connect(connector);
    setActiveConnectorAndConnect?.(connector);
  }

  if (step == 0) {
    return (
      <WalletConnectButton wallet={wallet} onClick={() => handleConnect(connector)} />
    )
  }

  if (step == 1) {
    return (
      <Box
        aspectRatio={1}
        onMouseMove={() => {
          if (isDownRef.current) {
            onFinish();
            setStartAnimation(true);
          }
        }}
        onTouchMove={() => {
          if (isDownRef.current) {
            onFinish();
            setStartAnimation(true);
          }
        }}
        onMouseDown={() => isDownRef.current = true}
        onTouchStart={() => isDownRef.current = true}
        onMouseUp={() => isDownRef.current = false}
        onTouchEnd={() => isDownRef.current = false}
      >
        <Viewer startAnimation={startAnimation} />
      </Box>
    )
  }

  if (step == 2) {
    return (
      <Flex justify="center">
        <MouseClickIcon
          w="64px"
          h="64px"
          onClick={() => {
            if (++clickedRef.current >= 3)
              onFinish();
          }}
        />
      </Flex>
    )
  }

  return <></>
}

const airdrops = [
  {
    title: 'Connect passkey',
    description: (
      <Text fontSize="sm">
        Try to connect your passkey and get your ZI airdrop
      </Text>
    ),
    action: Action.Unknown,
  },
  {
    title: 'Spin block',
    description: (
      <Text fontSize="sm">
        Try Spinning the Block to get your 1st Zi Airdrop,
      </Text>
    ),
    action: Action.SpinCube,
  },
  {
    title: 'Create Some Particles',
    description: (
      <Text fontSize="sm">
        Create some Particles on the screen by Clicking Here.
      </Text>
    ),
    action: Action.Partices,
  },
  {
    title: 'Congratulation',
    description: (
      <>
        <Text fontSize='sm' fontWeight='bold'>
          Well done!!
        </Text>
        <Text fontSize='sm'>
          You’ve now got the last Particle Theme Zi Airdrop.
        </Text>
        <Text mt={2} fontSize='sm'>
          Now invite your friends & family  by clicking the Rewards button & signing up.
        </Text>
        <Text fontSize='sm'>
          You will earn 10 Zi for everyone that clicks your link & receive the Zi Airdrop.
        </Text>
        <Text fontSize='sm'>
          You will get another 100 Zi for every 10 members that join via your link.
        </Text>
        <Text mt={2} fontSize='sm' fontWeight='bold'>
          Coming Soon
        </Text>
        <Text fontSize='sm'>
          And then;  if you want to earn even more Zi. Stake it to get 100% ARP on selected Smart contracts. Create Liquidity pools to earn 0.3% for everyone transaction within that pool Plus bonus.
        </Text>
      </>
    ),
    action: Action.Unknown,
  },
];

const ParticlesModal: FC<ModalProps> = ({ ...props }) => {
  const { address } = useSorobanReact();
  const { status } = useAirdrop();
  const [step, setStep] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (step == 0 && address) {
      setFinished(true);
    }
  }, [address, step]);

  useEffect(() => {
    if (status[airdrops[step].action].data)
      setFinished(true);
  }, [step, status]);

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        w="360px"
      >
        <ModalCloseButton />
        <Flex w="full" p={4} direction="column" gap={2} overflow="hidden">
          <Flex direction="column" gap={1}>
            <Text fontSize="xl">{airdrops[step].title}</Text>
            {airdrops[step].description}
          </Flex>
          <Step step={step} onFinish={() => setShowButton(true)} />
          {showButton && <GetAirdropButton action={airdrops[step].action} onReceive={() => setFinished(true)} />}
          {finished && (
            <Button onClick={() => {
              setShowButton(false);
              setFinished(false);
              setStep(step + 1);
            }}>
              Move to step {step + 2}
            </Button>
          )}
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default ParticlesModal;
