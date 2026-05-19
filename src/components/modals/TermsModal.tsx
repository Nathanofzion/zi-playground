'use client';

import { FC } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from '../common';
import { ModalProps } from '../common/Modal';
import { useColorModeValue } from '../ui/color-mode';

const TermsModal: FC<ModalProps> = ({ isOpen, onClose }) => {
  const headingColor = useColorModeValue('#1a1a1a', '#ffffff');
  const bodyColor = useColorModeValue('#374151', '#d1d5db');
  const sectionBg = useColorModeValue('#f9fafb', '#111318');
  const borderColor = useColorModeValue('#e5e7eb', '#2d2f3a');

  const Section: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <Box
      p="16px"
      bg={sectionBg}
      border="1px solid"
      borderColor={borderColor}
      rounded="12px"
    >
      <Text fontWeight="700" fontSize="14px" color={headingColor} mb="8px">
        {title}
      </Text>
      <Text fontSize="13px" color={bodyColor} lineHeight="1.7">
        {children}
      </Text>
    </Box>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        p="28px"
        w="full"
        maxW="600px"
        direction="column"
        gap="0"
        maxH="85vh"
        overflow="hidden"
      >
        <ModalCloseButton />

        <Text fontSize="22px" fontWeight="bold" color={headingColor} mb="4px">
          Terms of Use
        </Text>
        <Text fontSize="13px" color={bodyColor} mb="20px">
          Last Updated: May 2026 — please read carefully before connecting.
        </Text>

        <Box overflowY="auto" flex="1" pr="4px">
          <Flex direction="column" gap="12px">
            <Text fontSize="13px" color={bodyColor} lineHeight="1.7">
              Welcome to Zig3, operated by Zioncoin Foundation (&quot;Zig3&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms of Use (&quot;Terms&quot;) govern your access to and use of the Zig3 website and application (the &quot;Platform&quot;). By accessing or using Zig3, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.
            </Text>

            <Section title="1. Services">
              Zig3 is a user interface and front-end application for interacting with the Stellar blockchain and its decentralized exchange (DEX). Zig3 is not an exchange, a broker, or a custodian of funds. It allows users to create accounts, establish trustlines (including for the native Zioncoin Zi token), and interact directly with the Stellar network via the Horizon API operated by the Stellar Development Foundation.
            </Section>

            <Section title="2. Eligibility">
              You must be at least 18 years old or the legal age of majority in your jurisdiction. By using Zig3, you represent and warrant that you meet this requirement and are not located in, or a resident of, any jurisdiction where the use of decentralized cryptocurrency services is prohibited or restricted.
            </Section>

            <Section title="3. Geographic Restrictions">
              Zig3 is not offered in jurisdictions where its use would violate applicable laws or regulations (including sanctions lists administered by OFAC or similar authorities). You agree not to use Zig3 if you are in such a restricted jurisdiction.
            </Section>

            <Section title="4. Cryptocurrency Risks">
              Cryptocurrency assets are highly volatile and subject to significant market risks. Past performance is not indicative of future results. You may lose part or all of your investment. Zig3 does not provide financial, investment, tax, or legal advice. You are solely responsible for your own research and investment decisions. Zig3 is not responsible for any investment losses. Cryptocurrencies, tokens, and decentralized exchanges operate in an unregulated or lightly regulated environment in many jurisdictions and lack governmental oversight.
            </Section>

            <Section title="5. Stellar Network">
              The Stellar network is entirely separate from Zig3. Zig3 does not operate, control, or own the Stellar blockchain. When using Zig3, you directly interact with the Stellar network via its public Horizon API. Transactions on Stellar are irreversible. Zig3 has no ability to reverse, cancel, or modify transactions once submitted.
            </Section>

            <Section title="6. Non-Custodial Service">
              Zig3 is a fully non-custodial platform. We do not hold, control, or have access to your private keys, secret seeds, funds, or assets. All assets remain in your own wallet at all times. You are solely responsible for the security of your wallet and private keys.
            </Section>

            <Section title="7. User Responsibilities and Conduct">
              You are solely responsible for compliance with all applicable laws, regulations, and tax obligations in your jurisdiction; maintaining the security of your private keys and backups; and all transactions you initiate. You agree not to use Zig3 for any illegal purpose, including money laundering, fraud, market manipulation, or trading of prohibited assets.
            </Section>

            <Section title="8. Intellectual Property">
              Zioncoin Foundation and/or its licensors own all intellectual property rights in the Zig3 Platform (except for open-source components). You are granted a limited, revocable license to access and use Zig3 for personal use only, subject to these Terms. You may not create iFrames or otherwise alter the visual presentation of our website without prior written permission.
            </Section>

            <Section title="9. Open Source">
              Zig3 is based on open-source software (Stellar demo wallet, WebAuthn, and related components). The source code is publicly viewable.
            </Section>

            <Section title="10. Limitation of Liability">
              To the maximum extent permitted by law, Zig3 and Zioncoin Foundation shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Platform, including loss of funds, data, or profits.
            </Section>

            <Section title="12. Cookies">
              We use cookies and similar technologies. By using Zig3, you consent to our use of cookies as described in our Privacy Policy (/privacy).
            </Section>

            <Section title="13. Modifications">
              We reserve the right to modify these Terms at any time. Continued use of Zig3 after changes constitutes acceptance of the updated Terms.
            </Section>

            <Section title="14. Governing Law">
              These Terms are governed by the laws of the Netherlands. Any disputes shall be subject to the exclusive jurisdiction of the courts of the Netherlands.
            </Section>

            <Box
              p="16px"
              bg={useColorModeValue('#fff7ed', '#1c1206')}
              border="1px solid"
              borderColor={useColorModeValue('#fed7aa', '#78350f')}
              rounded="12px"
            >
              <Text fontWeight="700" fontSize="14px" color={useColorModeValue('#9a3412', '#fb923c')} mb="8px">
                11. Disclaimer of Warranty
              </Text>
              <Text fontSize="13px" color={bodyColor} lineHeight="1.7">
                The Platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without any warranties of any kind. We disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.
              </Text>
            </Box>
          </Flex>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default TermsModal;
