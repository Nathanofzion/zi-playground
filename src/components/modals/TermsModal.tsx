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
          Terms and Conditions
        </Text>
        <Text fontSize="13px" color={bodyColor} mb="20px">
          Welcome to Zig3 — please read carefully before connecting.
        </Text>

        <Box overflowY="auto" flex="1" pr="4px">
          <Flex direction="column" gap="12px">
            <Text fontSize="13px" color={bodyColor} lineHeight="1.7">
              These terms and conditions outline the rules and regulations for the use of Zig3 (Zioncoin Foundation) Website. By accessing this website we assume you accept these terms and conditions. Do not continue to use Zig3 if you do not agree to take all of the terms and conditions stated on this page.
            </Text>

            <Text fontSize="13px" color={bodyColor} lineHeight="1.7">
              The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: &quot;Client&quot;, &quot;You&quot; and &quot;Your&quot; refers to you, the person logged on this website and compliant to the Foundation&apos;s terms and conditions. &quot;The Foundation&quot;, &quot;Ourselves&quot;, &quot;We&quot;, &quot;Our&quot; and &quot;Us&quot;, refers to our Company. All terms refer to the offer, acceptance and consideration of payment necessary to undertake the process of our assistance to the Client in the most appropriate manner, in accordance with and subject to, prevailing law of Netherlands.
            </Text>

            <Section title="Cookies">
              We employ the use of cookies. By accessing Zig3, you agreed to use cookies in agreement with Zig3&apos;s Privacy Policy. Most interactive websites use cookies to let us retrieve the user&apos;s details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website.
            </Section>

            <Section title="License">
              Unless otherwise stated, Zioncoin Foundation and/or its licensors own the intellectual property rights for all material on Website Zig3. All intellectual property rights are reserved. You may access this from Website Zig3 for your own personal use subjected to restrictions set in these terms and conditions.
            </Section>

            <Section title="iFrames">
              Without prior approval and written permission, you may not create frames around our Webpages that alter in any way the visual presentation or appearance of our Website.
            </Section>

            <Section title="Content Liability">
              We shall not be held responsible for any content that appears on your Website. You agree to protect and defend us against all claims that are rising on your Website. No link(s) should appear on any Website that may be interpreted as libelous, obscene or criminal, or which infringes or otherwise violates any third party rights.
            </Section>

            <Section title="Reservation of Rights">
              We reserve the right to request that you remove all links or any particular link to our Website. We also reserve the right to amend these terms and conditions and its linking policy at any time. By continuously linking to our Website, you agree to be bound to and follow these linking terms and conditions.
            </Section>

            <Section title="Removal of links from our website">
              If you find any link on our Website that is offensive for any reason, you are free to contact and inform us at any moment. We will consider requests to remove links but we are not obligated to do so or to respond to you directly. We do not ensure that the information on this website is correct, we do not warrant its completeness or accuracy.
            </Section>

            <Section title="Cryptocurrency Risks">
              Cryptocurrency assets are subject to high market risks and volatility. Past performance is not indicative of future results. Investments in blockchain assets may result in loss of part or all of your investment. Please do your own research and use caution. You are solely responsible for your actions on the Stellar network. Zig3 is not responsible for your investment losses. Cryptocurrency assets and the Stellar decentralized exchange are unregulated and do not have governmental oversight.
            </Section>

            <Section title="The Stellar Network (separate from Zig3)">
              Zig3 is not an exchange. By using the Zig3 app or creating a new account, you are agreeing to create a Zioncoin Zi Trustline (Zi is the Zig3 native token). Zig3 is only a user interface to the Stellar DEX and does not operate the Stellar network. Zig3 is unable to control the actions of others on the Stellar network. When using Zig3, you are directly communicating with the Horizon Stellar API operated by the Stellar Development Foundation. Transactions on the Stellar network are irreversible.
            </Section>

            <Section title="Your Own Responsibilities">
              You, the user, are solely responsible for ensuring your own compliance with laws and taxes in your jurisdiction. Cryptocurrencies may be illegal in your area. You are solely responsible for your own security including keeping your account secret keys safe and backed up.
            </Section>

            <Section title="Zig3 Does Not Endorse Anything">
              Zig3 is open source software — a monorepo of Stellar demo wallet, WebAuthn and social login bar the UI. As part of the open source community, it is viewable to anyone who wishes to do so.
            </Section>

            <Box
              p="16px"
              bg={useColorModeValue('#fff7ed', '#1c1206')}
              border="1px solid"
              borderColor={useColorModeValue('#fed7aa', '#78350f')}
              rounded="12px"
            >
              <Text fontWeight="700" fontSize="14px" color={useColorModeValue('#9a3412', '#fb923c')} mb="8px">
                Disclaimer of Warranty
              </Text>
              <Text fontSize="13px" color={bodyColor} lineHeight="1.7">
                This website is provided &quot;as is&quot; without any representations or warranties, express or implied. Zioncoin Foundation makes no representations or warranties in relation to this website or the information and materials provided on this website. Nothing on this website constitutes, or is meant to constitute, advice of any kind.
              </Text>
            </Box>
          </Flex>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default TermsModal;
