"use client"
import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider, useTheme } from "next-themes";
import { FC, useState } from "react";

import { Box, ClientOnly, Flex, FlexProps, Image } from "@chakra-ui/react";

export interface ColorModeProviderProps extends ThemeProviderProps { }

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
  )
}

export function useColorMode() {
  const { resolvedTheme, setTheme } = useTheme()

  return {
    colorMode: resolvedTheme,
    setColorMode: setTheme,
  }
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode()
  return colorMode == "light" ? light : dark
}

interface Props extends FlexProps {
  guide?: boolean;
}

export const ColorModeButton: FC<Props> = ({ guide, ...props }) => {
  const { colorMode, setColorMode } = useColorMode()
  const [checked, setChecked] = useState(colorMode == 'dark')

  return (
    <ClientOnly>
      <Flex
        position='relative'
        w={guide ? '96px' : { base: '48px', lg: '96px' }}
        h={guide ? '48px' : { base: '24px', lg: '48px' }}
        cursor='pointer'
        onClick={() => {
          setColorMode(checked ? 'light' : 'dark');
          setChecked(!checked);
        }}
        {...props}
      >
        <Box
          position='absolute' left={0} top='50%'
          transform='auto'
          translateX={colorMode == 'dark' ? (guide ? '48px' : { base: '24px', lg: '48px' }) : (guide ? '4px' : { base: '2px', lg: '4px' })}
          translateY='-50%'
          w={guide ? '40px' : { base: '20px', lg: '40px' }}
        >
          {useColorModeValue(<Image alt="sun" src="/images/sun.png" />, <Image alt="moon" src="/images/moon.png" />)}
        </Box>
      </Flex>
    </ClientOnly >
  )
}
