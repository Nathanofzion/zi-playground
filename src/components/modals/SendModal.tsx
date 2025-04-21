import { FC, useState } from "react";

import { Box, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import useAssets from "@/hooks/useAssets";
import { sendAsset } from "@/services/contract";

import { IAsset } from "@/interfaces";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import AssetCard from "../common/AssetCard";
import Button from "../common/Button";
import Input from "../common/Input";
import { ModalProps } from "../common/Modal";
import QRCodeScanner from "../common/QRCodeScanner";
import { toaster } from "../ui/toaster";

const SendModal: FC<ModalProps> = (props) => {
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;
  const queryClient = useQueryClient();
  const { assets } = useAssets();
  const [asset, setAsset] = useState<IAsset>();
  const [recipient, setRecipient] = useState("");
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      if (!asset) {
        throw new Error("Please select asset to send.");
      }
      return sendAsset(sorobanContext, asset, recipient, memo, Number(amount));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["balance", address, asset?.contract],
      });
      setResult("Transaction Confirmed ! ✅");
    },
    onError: (err: any) => {
      toaster.create({
        title: err.message,
        type: "error",
      });
    },
  });

  const handleSend = () => {
    if (!asset) return;
    mutate();
  };

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        p={8}
        w="full"
        maxW={{ base: "320px", lg: "420px" }}
        direction="column"
        gap={4}
      >
        <ModalCloseButton />
        <Heading as="h2" textAlign="center" size="lg">
          SEND
        </Heading>
        {result ? (
          <VStack>
            <Text textAlign="center">{result}</Text>
            <Button onClick={() => setResult(null)}>Send again</Button>
          </VStack>
        ) : asset ? (
          <Flex direction="column" gap={2}>
            <Flex direction="column" gap={1}>
              <Text pl={2}>Recipient stellar address</Text>
              <Flex direction="column" gap={2}>
                <Flex gap={2}>
                  <Input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                  <QRCodeScanner onScanSuccess={(code) => setRecipient(code)} />
                </Flex>
                <Box id="qr-reader" w="full" />
              </Flex>
            </Flex>
            <Flex direction="column" gap={1}>
              <Text pl={2}>Memo</Text>
              <Input onChange={(e) => setMemo(e.target.value)} />
            </Flex>
            <Flex direction="column" gap={1}>
              <Text pl={2}>Amount</Text>
              <Input onChange={(e) => setAmount(e.target.value)} />
            </Flex>
            <Flex justify="right" gap={2}>
              <Button loading={isPending} onClick={handleSend}>
                Send
              </Button>
            </Flex>
          </Flex>
        ) : (
          <Flex maxH="480px" direction="column" gap={1} overflowY="auto">
            {assets
              .filter((asset) => asset.balance && asset.balance > 0)
              .map((asset, index) => (
                <AssetCard
                  key={index}
                  asset={asset}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.15)",
                  }}
                  onClick={() => setAsset(asset)}
                />
              ))}
          </Flex>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SendModal;
