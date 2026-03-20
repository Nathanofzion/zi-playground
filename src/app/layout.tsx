import type { Metadata } from "next";
import localFont from "next/font/local";

import Background from "@/components/common/Background";
import Header from "@/components/Header";
import Provider from "@/providers";

import "./globals.css";
import { ToastContainer, toast } from 'react-toastify';

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
        <ToastContainer/>
        <Provider>
          <Background />
          <div className="app-layout">
            <Header />
            {children}
          </div>
        </Provider>
      </body>
    </html>
  );
}
