"use client"

import { BoxProps, Image } from "@chakra-ui/react"
import type { ThemeProviderProps } from "next-themes"
import { ThemeProvider, useTheme } from "next-themes"
import { FC, useState } from "react"

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
  return colorMode === "light" ? light : dark
}

export const ColorModeButton = () => {
  const { colorMode, setColorMode } = useColorMode()
  const [checked, setChecked] = useState(colorMode == 'dark')

  return (
    <label className="toggle" onClick={() => setColorMode(checked ? 'light' : 'dark')}>
      <input id="toggleSwitch" type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
      <span className="slider">
        <span>
          {useColorModeValue(<Image src="/images/sun.png" />, <Image src="/images/moon.png" />)}
        </span>
      </span>
    </label>
  )
}
