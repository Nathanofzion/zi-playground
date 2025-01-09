"use client"
import { createContext, FC, ReactNode, useState } from "react";

import { Provider as ThemeProvider } from "@/components/ui/provider";

import SorobanReactProvider from "./SorobanReactProvider";

interface IApp {
    startAnimation?: boolean;
    setStartAnimation?: (startAnimation: boolean) => void;
}

export const AppContext = createContext<IApp>({});

interface Props {
    children: ReactNode;
}

const Provider: FC<Props> = ({ children }) => {
    const [startAnimation, setStartAnimation] = useState(false);

    return (
        <AppContext.Provider value={{ startAnimation, setStartAnimation }}>
            <ThemeProvider>
                <SorobanReactProvider>
                    {children}
                </SorobanReactProvider>
            </ThemeProvider>
        </AppContext.Provider>
    )
}

export default Provider;
