import { FC, useEffect } from "react";

import {
  Box,
  Flex,
  Heading,
  HStack,
  Link,
  Separator,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuArrowLeftRight } from "react-icons/lu";

import { useSodaxBridge, SODAX_CHAINS } from "@/hooks/useSodaxBridge";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import Button from "../common/Button";
import Input from "../common/Input";
import { ModalProps } from "../common/Modal";
import { useColorModeValue } from "../ui/color-mode";

// ── Chain picker ──────────────────────────────────────────────────────────────
interface ChainPickerProps {
  label: string;
  selectedKey: string;
  onSelect: (key: string) => void;
}

const ChainPicker: FC<ChainPickerProps> = ({ label, selectedKey, onSelect }) => {
  const selectBg = useColorModeValue("#F8F8F8", "#13141E");
  const selectColor = useColorModeValue("#00615F", "white");
  const selectBorder = useColorModeValue("#a588e480", "#a588e480");

  return (
    <Flex direction="column" gap={1} flex="1">
      <Text fontSize="xs" color="gray.500">{label}</Text>
      <select
        value={selectedKey}
        onChange={(e) => onSelect(e.target.value)}
        style={{
          background: selectBg,
          color: selectColor,
          border: `2px solid ${selectBorder}`,
          borderRadius: 999,
          padding: "10px 14px",
          fontSize: 13,
          fontWeight: 600,
          width: "100%",
          cursor: "pointer",
          outline: "none",
        }}
      >
        {SODAX_CHAINS.map((c) => (
          <option key={c.key} value={c.key} style={{ background: selectBg }}>
            {c.logo} {c.label}
          </option>
        ))}
      </select>
    </Flex>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
const BridgeModal: FC<ModalProps> = ({ onClose, ...props }) => {
  const {
    srcChain, setSrcChain,
    dstChain, setDstChain,
    amount, setAmount,
    quote, status, error,
    swapChains, fetchQuote, executeBridge, reset,
  } = useSodaxBridge();

  const rowBg = useColorModeValue("blackAlpha.50", "whiteAlpha.50");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

  // Auto-fetch quote 700 ms after user stops typing
  useEffect(() => {
    if (!amount || Number(amount) <= 0) return;
    const t = setTimeout(() => { fetchQuote(); }, 700);
    return () => clearTimeout(t);
  }, [amount, srcChain.key, dstChain.key, fetchQuote]);

  const isBusy = status === "fetching_quote" || status === "executing";
  const canBridge = status === "quote_ready" && !!quote && !isBusy;

  return (
    <Modal onClose={() => { reset(); onClose?.(); }} {...props}>
      <ModalOverlay />
      <ModalContent
        px={{ base: 4, lg: 8 }}
        py={{ base: 6, lg: 10 }}
        w="full"
        maxW={{ base: "340px", lg: "480px" }}
        direction="column"
        gap={5}
        overflowY="auto"
        maxH="92vh"
      >
        <ModalCloseButton />

        {/* Title */}
        <Flex direction="column" align="center" gap={1}>
          <Heading as="h2" size="lg" textAlign="center">Bridge</Heading>
          <HStack gap={1} fontSize="xs" color="gray.500">
            <Text>Powered by</Text>
            <Link
              href="https://sodax.com"
              target="_blank"
              rel="noopener noreferrer"
              fontWeight="700"
              color="yellow.400"
            >
              SODAX
            </Link>
            <Text>· 20 networks</Text>
          </HStack>
        </Flex>

        {/* Mainnet-only notice */}
        <Box
          bg={useColorModeValue("orange.50", "rgba(251,146,60,0.12)")}
          border="1px solid"
          borderColor="orange.400"
          borderRadius="xl"
          px={4}
          py={3}
        >
          <Text fontSize="xs" color={useColorModeValue("orange.700", "orange.300")} lineHeight={1.7}>
            🔶 <strong>Preview mode</strong> — SODAX has no testnet. This modal is
            fully wired and ready to activate on mainnet launch. Quotes shown are
            simulated for demonstration.{" "}
            <Link
              href="https://docs.sodax.com"
              target="_blank"
              rel="noopener noreferrer"
              color="orange.400"
              textDecoration="underline"
            >
              SODAX docs →
            </Link>
          </Text>
        </Box>

        {/* Chain selectors */}
        <HStack gap={2} align="flex-end">
          <ChainPicker
            label="From"
            selectedKey={srcChain.key}
            onSelect={(k) => {
              const c = SODAX_CHAINS.find((x) => x.key === k);
              if (c) setSrcChain(c);
            }}
          />
          <Box pb={1}>
            <Button size="sm" px={2} onClick={swapChains} title="Swap direction">
              <LuArrowLeftRight />
            </Button>
          </Box>
          <ChainPicker
            label="To"
            selectedKey={dstChain.key}
            onSelect={(k) => {
              const c = SODAX_CHAINS.find((x) => x.key === k);
              if (c) setDstChain(c);
            }}
          />
        </HStack>

        {/* Amount */}
        <Flex direction="column" gap={1}>
          <Text fontSize="xs" color="gray.500">Amount (XLM / ZI)</Text>
          <Input
            type="number"
            min={0}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Flex>

        {/* Quote loading */}
        {status === "fetching_quote" && (
          <HStack justify="center" gap={2}>
            <Spinner size="sm" />
            <Text fontSize="sm" color="gray.400">Fetching quote…</Text>
          </HStack>
        )}

        {/* Quote card */}
        {quote && status === "quote_ready" && (
          <Box
            bg={rowBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="xl"
            p={4}
          >
            <VStack gap={2} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">You send</Text>
                <Text fontSize="sm" fontWeight="700">{quote.inputAmount} XLM</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">You receive (est.)</Text>
                <Text fontSize="sm" fontWeight="700" color="teal.400">
                  {quote.outputAmount} on {quote.dstChain}
                </Text>
              </HStack>
              <Separator />
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">SODAX fee (0.1%)</Text>
                <Text fontSize="xs">{quote.solverFee} XLM</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">Price impact</Text>
                <Text fontSize="xs" color="green.400">{quote.priceImpact}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">Route</Text>
                <Text fontSize="xs">{quote.srcChain} → Sonic → {quote.dstChain}</Text>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Text fontSize="sm" color="red.400" textAlign="center">{error}</Text>
        )}

        {/* Success */}
        {status === "success" && (
          <Box
            bg={useColorModeValue("green.50", "rgba(52,211,153,0.1)")}
            border="1px solid"
            borderColor="green.500"
            borderRadius="xl"
            p={4}
          >
            <Text fontSize="sm" fontWeight="700" color="green.400" textAlign="center">
              ✅ Bridge intent submitted!
            </Text>
            <Text fontSize="xs" color="gray.400" textAlign="center" mt={1}>
              The SODAX Solver will complete settlement across networks.
            </Text>
            <Button mt={4} w="full" size="sm" onClick={reset}>New bridge</Button>
          </Box>
        )}

        {/* CTA */}
        {status !== "success" && (
          <Button
            w="full"
            size="xl"
            disabled={!canBridge}
            loading={isBusy}
            onClick={executeBridge}
          >
            {status === "fetching_quote"
              ? "Getting quote…"
              : canBridge
              ? `Bridge ${amount} XLM → ${dstChain.label}`
              : "Enter an amount to get a quote"}
          </Button>
        )}

        {/* Footer */}
        <HStack justify="center" gap={4}>
          <Link
            href="https://docs.sodax.com/developers/packages/foundation/sdk/functional-modules/swaps"
            target="_blank"
            rel="noopener noreferrer"
            fontSize="10px"
            color="gray.600"
          >
            SODAX Swap SDK →
          </Link>
          <Link
            href="https://builders.sodax.com"
            target="_blank"
            rel="noopener noreferrer"
            fontSize="10px"
            color="gray.600"
          >
            Builders MCP →
          </Link>
        </HStack>
      </ModalContent>
    </Modal>
  );
};

export default BridgeModal;
