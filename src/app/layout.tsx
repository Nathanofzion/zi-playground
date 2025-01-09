import type { Metadata } from "next";
import localFont from "next/font/local";

import { Flex } from "@chakra-ui/react";

import BgParticles from "@/components/BgParticles";
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
          <BgParticles />
          <Flex position='fixed' inset={0} direction='column' overflowY='auto'>
            <Header />
            {children}
          </Flex>
        </Provider>
      </body>
    </html>
  );
}
