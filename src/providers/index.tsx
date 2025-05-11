"use client";
import { FC, ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import AppProvider from "./AppProvider";
import SorobanReactProvider from "./SorobanReactProvider";

const queryClient = new QueryClient();

interface Props {
  children: ReactNode;
}

const Provider: FC<Props> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SorobanReactProvider>
        <AppProvider>{children}</AppProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </SorobanReactProvider>
    </QueryClientProvider>
  );
};

export default Provider;
