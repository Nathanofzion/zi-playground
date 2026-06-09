import { FC } from "react";

import {
  Badge,
  Box,
  Flex,
  Heading,
  Link,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";

const CONTRIBUTORS = [
  { login: "journey-4u",   contributions: 303, role: "Lead Developer" },
  { login: "slycompiler",  contributions: 106, role: "Core Developer" },
  { login: "Nathanofzion", contributions: 31,  role: "Founder & Project Lead" },
  { login: "SaadUlHassan", contributions: 6,   role: "UI Lead" },
  { login: "proximom",     contributions: 5,   role: "Contributor" },
];

const HISTORY = [
  {
    version: "V1",
    year: "2022\u20132023",
    headline: "Proof of Concept",
    detail:
      "Initial prototype of Zioncoin Foundation's DeFi playground on Stellar testnet. Introduced the Zi token concept, basic airdrop mechanics and the passkey wallet architecture.",
  },
  {
    version: "V2",
    year: "2024",
    headline: "SCF #11 Award Winner \ud83c\udfc6",
    detail:
      "Full rebuild with Soroban smart contracts, Space Invaders & Tetris play-to-earn games, ZI airdrop flows, and the referral rewards system. Won the Stellar Community Fund round #11 grant.",
  },
  {
    version: "V3",
    year: "2025\u20132026",
    headline: "Passkey Wallet \u00b7 Hybrid PQC \u00b7 GameFi",
    detail:
      "Full passkey (WebAuthn) wallet with institutional-grade encryption, post-quantum hybrid signing (ML-DSA-65), Soroswap DEX integration, on-chain game rewards, Plex AI assistant, and Protocol-26 compatibility.",
  },
];

const InfoModal: FC<ModalProps> = (props) => {
  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        px={{ base: 4, lg: 8 }}
        py={{ base: 6, lg: 10 }}
        w="full"
        maxW={{ base: "340px", lg: "560px" }}
        direction="column"
        gap={6}
        overflowY="auto"
        maxH="90vh"
      >
        <ModalCloseButton />

        <Flex direction="column" align="center" gap={1}>
          <Heading as="h2" size="lg" textAlign="center">
            About Zig3
          </Heading>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Zioncoin Foundation \u00b7 Stellar Blockchain \u00b7 Soroban Smart Contracts
          </Text>
        </Flex>

        <Separator />

        <VStack gap={4} align="stretch">
          {HISTORY.map((h) => (
            <Box
              key={h.version}
              border="1px solid"
              borderColor="whiteAlpha.200"
              borderRadius="xl"
              p={4}
            >
              <Flex align="center" gap={2} mb={1}>
                <Badge colorScheme="purple" fontSize="0.75rem" px={2} py={0.5} borderRadius="md">
                  {h.version}
                </Badge>
                <Text fontSize="xs" color="gray.400">{h.year}</Text>
              </Flex>
              <Text fontWeight="700" fontSize="sm" mb={1}>{h.headline}</Text>
              <Text fontSize="xs" color="gray.400" lineHeight={1.6}>{h.detail}</Text>
            </Box>
          ))}
        </VStack>

        <Separator />

        <Flex direction="column" align="center" gap={3}>
          <Heading as="h3" size="sm" textAlign="center">
            \ud83c\udfc6 Stellar Community Fund #11 Winner
          </Heading>
          {/* Place the SCF winner banner at public/assets/images/scf-award.png */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/images/scf-award.png"
            alt="Zig3 — SCF #11 Winner"
            style={{ width: "100%", maxWidth: 420, borderRadius: 12 }}
          />
          <Text fontSize="xs" color="gray.400" textAlign="center">
            Nathaniel Denny (Founder) \u00b7 Saad Hassan (UI Lead, Zig3 Dev)
          </Text>
          <Link
            href="https://communityfund.stellar.org/project/zig3v2-j3u"
            target="_blank"
            rel="noopener noreferrer"
            fontSize="xs"
            color="blue.300"
          >
            View SCF project page \u2192
          </Link>
        </Flex>

        <Separator />

        <Flex direction="column" gap={3}>
          <Heading as="h3" size="sm">
            \ud83d\udc65 Development Team
          </Heading>
          <VStack gap={2} align="stretch">
            {CONTRIBUTORS.map((c) => (
              <Flex key={c.login} justify="space-between" align="center">
                <Flex gap={2} align="center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://github.com/${c.login}.png?size=28`}
                    alt={c.login}
                    style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }}
                  />
                  <Box>
                    <Link
                      href={`https://github.com/${c.login}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      fontSize="sm"
                      fontWeight="600"
                    >
                      {c.login}
                    </Link>
                    <Text fontSize="xs" color="gray.500">{c.role}</Text>
                  </Box>
                </Flex>
                <Badge colorScheme="teal" fontSize="0.7rem">
                  {c.contributions} commits
                </Badge>
              </Flex>
            ))}
          </VStack>
        </Flex>

        <Separator />

        <Box bg="whiteAlpha.50" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
          <Heading as="h3" size="sm" mb={2}>
            \ud83d\udc99 Special Thanks
          </Heading>
          <Text fontSize="xs" color="gray.400" lineHeight={1.7}>
            Zig3 is built on the shoulders of the open-source community.
            Heartfelt thanks to the{" "}
            <Link href="https://stellar.org" target="_blank" rel="noopener noreferrer" color="blue.300">
              Stellar Development Foundation
            </Link>
            , the{" "}
            <Link href="https://soroswap.finance" target="_blank" rel="noopener noreferrer" color="blue.300">
              Soroswap
            </Link>{" "}
            team, the{" "}
            <Link href="https://openzeppelin.com" target="_blank" rel="noopener noreferrer" color="blue.300">
              OpenZeppelin
            </Link>{" "}
            relayer project, the{" "}
            <Link href="https://supabase.com" target="_blank" rel="noopener noreferrer" color="blue.300">
              Supabase
            </Link>{" "}
            team, and every open-source contributor whose libraries power this DApp.
          </Text>
        </Box>

        <Text fontSize="10px" color="gray.600" textAlign="center">
          \u00a9 2026 Zioncoin Foundation \u00b7 MIT Licence \u00b7{" "}
          <Link
            href="https://github.com/Nathanofzion/zi-playground"
            target="_blank"
            rel="noopener noreferrer"
            color="gray.500"
          >
            github.com/Nathanofzion/zi-playground
          </Link>
        </Text>
      </ModalContent>
    </Modal>
  );
};

export default InfoModal;
