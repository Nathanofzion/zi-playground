"use client";
import { FC, useContext } from "react";

import { Box, Flex, Heading, List, Text } from "@chakra-ui/react";

import { AppContext } from "@/providers/AppProvider";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import Button from "../common/Button";
import { ModalProps } from "../common/Modal";
import { useColorModeValue } from "../ui/color-mode";

interface LowLiquidityModalProps extends ModalProps {
  assetIn?: string;
  assetOut?: string;
  requested?: string;
  available?: string;
}

const LowLiquidityModal: FC<LowLiquidityModalProps> = ({
  assetIn,
  assetOut,
  requested,
  available,
  ...props
}) => {
  const { openLiquidityModal } = useContext(AppContext);
  const sectionBg = useColorModeValue(
    "linear-gradient(#F8F8F8, #F8F8F8) padding-box, linear-gradient(to bottom right, #a588e4, #b7fee0) border-box",
    "linear-gradient(#1a1d2e, #1a1d2e) padding-box, linear-gradient(to bottom right, #a588e4, #b7fee0) border-box"
  );
  const subtleText = useColorModeValue("gray.600", "whiteAlpha.700");

  const handleAddLiquidity = () => {
    props.onClose();
    openLiquidityModal?.();
  };

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        p={{ base: 5, lg: 8 }}
        w="full"
        maxW={{ base: "340px", lg: "460px" }}
        direction="column"
        gap={5}
      >
        <ModalCloseButton />

        {/* Header */}
        <Flex direction="column" align="center" gap={2} pt={2}>
          <Box fontSize="2.5rem" lineHeight={1}>⚠️</Box>
          <Heading as="h2" textAlign="center" size="lg">
            Insufficient Pool Liquidity
          </Heading>
          <Text textAlign="center" fontSize="sm" color={subtleText}>
            This swap cannot complete right now
          </Text>
        </Flex>

        {/* What went wrong */}
        <Box
          p={4}
          border="2px solid transparent"
          bg={sectionBg}
          rounded="12px"
        >
          <Text fontWeight="bold" fontSize="sm" mb={2}>
            What happened?
          </Text>
          <Text fontSize="sm" color={subtleText}>
            The{" "}
            <Box as="span" fontWeight="bold" color="inherit">
              {assetIn ?? "token"} / {assetOut ?? "token"}
            </Box>{" "}
            liquidity pool does not hold enough tokens to fulfil your swap.
          </Text>
          {requested && available && (
            <Flex direction="column" gap={1} mt={3} fontSize="sm">
              <Flex justify="space-between">
                <Text color={subtleText}>You requested</Text>
                <Text fontWeight="bold">{requested}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text color={subtleText}>Pool available</Text>
                <Text fontWeight="bold">{available}</Text>
              </Flex>
            </Flex>
          )}
        </Box>

        {/* Opportunity callout */}
        <Box
          p={4}
          border="2px solid transparent"
          bg={sectionBg}
          rounded="12px"
        >
          <Text fontWeight="bold" fontSize="sm" mb={2}>
            💰 Earn fees by providing liquidity
          </Text>
          <Text fontSize="sm" color={subtleText} mb={3}>
            Liquidity providers deposit equal values of both tokens into the pool
            and earn a share of every swap fee. The thinner the pool, the higher
            your share of fees.
          </Text>
          <List.Root gap={2} fontSize="sm">
            <List.Item>
              <List.Indicator color="green.400">✓</List.Indicator>
              Earn a percentage of every trade in this pool
            </List.Item>
            <List.Item>
              <List.Indicator color="green.400">✓</List.Indicator>
              Withdraw your tokens + accumulated fees at any time
            </List.Item>
            <List.Item>
              <List.Indicator color="green.400">✓</List.Indicator>
              Higher demand = higher returns for early providers
            </List.Item>
          </List.Root>
        </Box>

        {/* Actions */}
        <Flex direction="column" gap={2}>
          <Button w="full" onClick={handleAddLiquidity}>
            Add Liquidity to this Pool
          </Button>
          <Button w="full" variant="outline" onClick={props.onClose}>
            Try a Smaller Amount
          </Button>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default LowLiquidityModal;
