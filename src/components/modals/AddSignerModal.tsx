import { SignerStore } from "passkey-kit";
import { FC, useCallback, useContext, useEffect, useState } from "react";

import { Heading, Input } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import { getSigners, passkeyKit, send } from "@/lib/passkeyClient";
import { AppContext } from "@/providers";
import Button from "../Button";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";
import { toaster } from "../ui/toaster";

const AddSignerModal: FC<ModalProps> = (props) => {
  const { address } = useSorobanReact();
  const { setSigners } = useContext(AppContext);
  const [publicKey, setPublicKey] = useState('');

  const loadSigners = useCallback(async () => {
    if (address && address[0] == 'C') {
      const signers = await getSigners(address);
      setSigners?.(signers);
    } else {
      setSigners?.([]);
    }
  }, [address, setSigners]);

  useEffect(() => {
    loadSigners();
  }, [loadSigners]);

  const handleAddSigner = async () => {
    if (!["G", "C"].includes(publicKey[0]) || publicKey.length != 56) {
      toaster.create({
        title: 'Please input public key correctly.',
        type: 'error',
      });
    }
    const at = await passkeyKit.addEd25519(publicKey!, undefined, SignerStore.Temporary);
    await passkeyKit.sign(at);
    await send(at.built!.toXDR());
    await getSigners(address!);
    toaster.create({
      title: 'Ed25519 signer has been successfully added',
      type: 'success',
    });
  }

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent p={8} direction='column' gap={4}>
        <ModalCloseButton />
        <Heading as="h2" textAlign="center" size="lg">
          Add Ed25519 signer
        </Heading>
        <Input
          w='280px'
          p='1rem'
          bg='rgba(255, 255, 255, 0.15)'
          border='none'
          rounded='full'
          shadow='0 8px 32px 0 rgba(31, 38, 135, 0.37)'
          onChange={(e) => setPublicKey(e.target.value)}
        />
        <Button onClick={handleAddSigner}>
          Add signer
        </Button>
      </ModalContent>
    </Modal>
  )
}

export default AddSignerModal;
