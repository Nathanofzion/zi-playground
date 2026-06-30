'use client';

import { FC, useState } from 'react';
import { Box, Flex, Link, Text } from '@chakra-ui/react';
import { useColorModeValue } from './ui/color-mode';
import PrivacyModal from './modals/PrivacyModal';

const GitHubIcon: FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const XIcon: FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.262 5.636L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YouTubeIcon: FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const Footer: FC = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const bg = useColorModeValue('rgba(255,255,255,0.6)', 'rgba(10,11,16,0.7)');
  const borderTop = useColorModeValue('#e5e7eb', '#1e2030');
  const textColor = useColorModeValue('#6b7280', '#6b7280');
  const linkColor = useColorModeValue('#374151', '#9ca3af');
  const linkHover = '#F66B3C';

  const iconLinkStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: linkColor,
    transition: 'color 0.15s',
    lineHeight: 1,
  };

  return (
    <>
      <Box
        as="footer"
        w="full"
        borderTop="1px solid"
        borderColor={borderTop}
        bg={bg}
        backdropFilter="blur(8px)"
        py="14px"
        px={{ base: '16px', md: '32px' }}
        mt="auto"
      >
        <Flex
          align="center"
          justify="space-between"
          wrap="wrap"
          gap="12px"
          maxW="1200px"
          mx="auto"
        >
          {/* Left: copyright + links */}
          <Flex align="center" gap="16px" wrap="wrap">
            <Link
              href="https://Zioncoin.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              fontSize="12px"
              color={textColor}
              _hover={{ color: linkHover, textDecoration: 'none' }}
            >
              © 2026 Zioncoin Foundation
            </Link>
            <button
              type="button"
              onClick={() => setShowPrivacy(true)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: 12,
                color: textColor,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = linkHover)}
              onMouseLeave={e => (e.currentTarget.style.color = textColor)}
            >
              Privacy Policy
            </button>
          </Flex>

          {/* Right: social icons */}
          <Flex align="center" gap="20px">
            {/* SCF Award */}
            <Link
              href="https://communityfund.stellar.org/project/zig3v2-j3u"
              target="_blank"
              rel="noopener noreferrer"
              title="Stellar Award Winning Dapp"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: linkColor,
                transition: 'color 0.15s',
                textDecoration: 'none',
                lineHeight: 1,
              }}
              _hover={{ color: linkHover }}
            >
              <Text as="span" fontSize="11px" fontWeight="600" whiteSpace="nowrap">
                Stellar Award Winning Dapp
              </Text>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://communityfund.stellar.org/_next/image?url=%2Fsvg%2FSCFLogo.svg&w=96&q=75"
                alt="SCF"
                width={20}
                height={20}
                style={{ display: 'block', flexShrink: 0 }}
              />
            </Link>

            {/* GitHub */}
            <Link
              href="https://github.com/Nathanofzion/zi-playground"
              target="_blank"
              rel="noopener noreferrer"
              style={iconLinkStyle}
              title="GitHub"
              _hover={{ color: linkHover }}
            >
              <GitHubIcon />
            </Link>

            {/* X / Twitter */}
            <Link
              href="https://x.com/zig3io"
              target="_blank"
              rel="noopener noreferrer"
              style={iconLinkStyle}
              title="@zig3io on X"
              _hover={{ color: linkHover }}
            >
              <XIcon />
            </Link>

            {/* YouTube */}
            <Link
              href="https://www.youtube.com/@Zig3StellarCryptoDeFiWallet"
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...iconLinkStyle, color: linkColor }}
              title="Zig3 on YouTube"
              _hover={{ color: '#FF0000' }}
            >
              <YouTubeIcon />
            </Link>

            {/* Liquiplex */}
            <Link
              href="https://liquiplex.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...iconLinkStyle, gap: 5 }}
              title="Liquiplex"
              _hover={{ color: linkHover }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://liquiplex.com/favicon.ico"
                alt="Liquiplex"
                width={18}
                height={18}
                style={{ borderRadius: 4, display: 'block' }}
                onError={e => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  if (e.currentTarget.nextSibling) {
                    (e.currentTarget.nextSibling as HTMLElement).style.display = 'inline';
                  }
                }}
              />
              <Text as="span" fontSize="12px" display="none" fontWeight="600">
                Liquiplex
              </Text>
            </Link>
          </Flex>
        </Flex>
      </Box>

      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </>
  );
};

export default Footer;
