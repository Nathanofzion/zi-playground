'use client';

import { FC } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from '../common';
import { ModalProps } from '../common/Modal';
import { useColorModeValue } from '../ui/color-mode';

const PrivacyModal: FC<ModalProps> = ({ isOpen, onClose }) => {
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
          Privacy Policy
        </Text>
        <Text fontSize="13px" color={bodyColor} mb="20px">
          Last Updated: May 2026
        </Text>

        <Box overflowY="auto" flex="1" pr="4px">
          <Flex direction="column" gap="12px">
            <Text fontSize="13px" color={bodyColor} lineHeight="1.7">
              Zioncoin Foundation (&quot;Zig3&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the non-custodial platform at Zig3. This Privacy Policy explains how we collect, use, and disclose information when you visit our website and use our services.
            </Text>

            <Section title="1. Information We Collect">
              As a non-custodial decentralized interface, we collect minimal personal data. We do not collect, store, or track your Stellar addresses, transactions, balances, or any on-chain activity. When you visit the site, we may automatically collect technical data such as your IP address, browser type/version, device information, and pages visited. We use cookies to enable basic functionality and analyze usage — you can manage or disable cookies through your browser settings.
            </Section>

            <Section title="2. How We Use the Information">
              We use the collected data to provide and improve the functionality of the Platform, monitor and maintain security, and analyze aggregate (anonymous) usage statistics.
            </Section>

            <Section title="3. Information Sharing">
              We do not sell personal data. We may share technical or aggregate data with service providers who assist with website hosting, analytics, or security, or when required by law.
            </Section>

            <Section title="4. International Transfers">
              Technical data may be processed in countries outside your jurisdiction. We take reasonable measures to protect such data.
            </Section>

            <Section title="5. Your Rights">
              You may request access to, correction of, or deletion of any personal data we hold about you by contacting us at privacy@zig3.com. Users in the EEA have additional rights under GDPR including access, rectification, erasure, restriction, objection, and data portability.
            </Section>

            <Section title="6. Children's Privacy">
              Our services are not directed at children under 18. We do not knowingly collect data from minors.
            </Section>

            <Section title="7. Security">
              We implement reasonable technical and organizational measures to protect the data we collect. However, no system is completely secure.
            </Section>

            <Section title="8. Changes to this Policy">
              We may update this Privacy Policy from time to time. We will post the revised version with an updated date. Continued use of Zig3 after changes means you accept the new policy.
            </Section>

            <Section title="9. Contact Us">
              For any questions regarding this Privacy Policy, please contact us at: privacy@zig3.com
            </Section>
          </Flex>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default PrivacyModal;
