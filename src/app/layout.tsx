import type { Metadata } from "next";
import localFont from "next/font/local";

import { Box, Flex } from "@chakra-ui/react";

import Background from "@/components/common/Background";
import Header from "@/components/Header";
import Provider from "@/providers";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Zi Airdrop Playground",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Provider>
          <Background />
          <Flex h='100vh' direction='column'>
            <Header />
            {children}
          </Flex>
        </Provider>
      </body>
    </html>
  );
}
