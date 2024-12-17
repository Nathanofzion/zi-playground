import { createContext, ReactNode, useEffect, useState } from "react";

import { ThemeProvider } from "@mui/material";

import { theme } from "@/themes";

export enum ColorMode {
    LIGHT = 'light',
    DARK = 'dark',
}

interface IColorMode {
    colorMode: ColorMode;
    toggleColorMode: () => void;
}

export const ColorModeContext = createContext<IColorMode>({
    colorMode: ColorMode.LIGHT,
    toggleColorMode: () => { },
});

export default function ({ children }: { children: ReactNode }) {
    const [colorMode, setColorMode] = useState(localStorage.getItem('color-mode') as ColorMode || ColorMode.LIGHT);

    useEffect(() => {
        localStorage.setItem('color-mode', colorMode);
    }, [colorMode]);

    const toggleColorMode = () => {
        setColorMode(colorMode == ColorMode.DARK ? ColorMode.LIGHT : ColorMode.DARK);
    }

    return (
        <ThemeProvider theme={theme(colorMode)}>
            <ColorModeContext.Provider value={{ colorMode, toggleColorMode }}>
                {children}
            </ColorModeContext.Provider>
        </ThemeProvider>
    )
}
