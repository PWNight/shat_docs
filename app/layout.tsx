import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import {Navbar} from "@/components/NavMain";
import {Footer} from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SHAT Docs",
  description: "SHAT Docs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-100 grid grid-rows-[64px_1fr_64px]`}
      >
        <Navbar />
        <main className={'sm:w-full lg:w-[98%] w-[90%] mx-auto'}>
          {children}
        </main>
        <Footer/>
      </body>
    </html>
  );
}
