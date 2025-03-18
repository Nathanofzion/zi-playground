"use client";
import { SignerStore } from "passkey-kit";
import { useContext, useState } from "react";

import { Box, Flex, Image } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";
import { Keypair } from "@stellar/stellar-sdk";

import { getSigners, passkeyKit, send } from "@/lib/passkeyClient";
import { AppContext } from "@/providers";
import { truncateAddress } from "@/utils";
import Button from "./Button";
import BalanceModal from "./modals/BalanceModal";
import ConnectWalletModal from "./modals/ConnectWalletModal";
import ServicesModal from "./modals/ServicesModal";
import { ColorModeButton, useColorModeValue } from "./ui/color-mode";
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "./ui/menu";

const Header = () => {
  const { address, disconnect } = useSorobanReact();
  const {
    openAirdropModal,
    openStakingModal,
    openLoginModal,
  } = useContext(AppContext);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showConnectWalletModal, setShowConnectWalletModal] = useState(false);

  const handleAddEd25519Signer = async () => {
    const pair = Keypair.random();
    const publicKey = pair.publicKey();
    const at = await passkeyKit.addEd25519(publicKey!, undefined, SignerStore.Temporary);
    await passkeyKit.sign(at);
    await send(at.built!.toXDR());
    await getSigners(address!);
  }

  return (
    <>
      <Flex position="sticky" top={0} zIndex={5} px="16px" direction="column">
        <Flex
          p={{ base: "24px 0px", lg: "24px 64px" }}
          justify="space-between"
          align="center"
        >
          <Image
            width={{ base: "48px", lg: "70px" }}
            height={{ base: "48px", lg: "70px" }}
            alt="logo"
            src="/logo.png"
          />
          <Flex
            position={{ base: "fixed", lg: "static" }}
            left="50%"
            bottom={4}
            zIndex={1020}
            transform="auto"
            translateX={{ base: "-50%", lg: "unset" }}
            gap={{ base: "4px", lg: "16px" }}
          >
            <Button onClick={openAirdropModal}>
              Airdrop
            </Button>
            <Button onClick={openStakingModal}>Staking</Button>
            <Button onClick={openLoginModal}>Rewards</Button>
          </Flex>
          <Flex gap={{ base: "8px", lg: "16px" }} align="center">
            <ColorModeButton
              position={{ base: "fixed", lg: "relative" }}
              top={{ base: "112px", lg: "unset" }}
              right={{ base: "16px", lg: "unset" }}
            />
            {address ? (
              <>
                <Button onClick={() => setShowBalanceModal(true)}>
                  Balanace
                </Button>
                <Button onClick={() => setShowServicesModal(true)}>
                  Services
                </Button>
                <MenuRoot>
                  <MenuTrigger as={Button}>
                    {truncateAddress(address)}
                  </MenuTrigger>
                  <MenuContent
                    py={2}
                    bg={useColorModeValue(
                      "linear-gradient(#F8F8F8, #F8F8F8) padding-box, linear-gradient(to bottom right, #a588e4, #b7fee0) border-box;",
                      "linear-gradient(#13141E, #13141E) padding-box, linear-gradient(to bottom right, #a588e4, #b7fee0) border-box;"
                    )}
                    border="2px solid transparent"
                    rounded="xl"
                  >
                    <MenuItem
                      p="8px 16px"
                      value="add_ed25519_signer"
                      onClick={handleAddEd25519Signer}
                    >
                      Add Ed25519
                    </MenuItem>
                    <MenuItem
                      p="8px 16px"
                      value="disconnect"
                      onClick={() => disconnect()}
                    >
                      Disconnect
                    </MenuItem>
                  </MenuContent>
                </MenuRoot>
              </>
            ) : (
              <Button
                size="lg"
                onClick={() => setShowConnectWalletModal(true)}
              >
                Connect
              </Button>
            )}
          </Flex>
        </Flex>
        <Box w="full" bg="linear-gradient(90deg, #a588e4, #b7fee0);" h="8px" />
      </Flex>
      <BalanceModal
        isOpen={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
      />
      <ServicesModal
        isOpen={showServicesModal}
        onClose={() => setShowServicesModal(false)}
      />
      <ConnectWalletModal
        isOpen={showConnectWalletModal}
        onClose={() => setShowConnectWalletModal(false)}
      />
    </>
  );
};

export default Header;
