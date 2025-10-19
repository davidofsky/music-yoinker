import type { Metadata } from "next";
import { Geist, Zain } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const zain = Zain({
  subsets: ["latin"],
  weight: ["200", "300", "400", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Music Yoinker",
  description: "Dont sue me",
};

import "./globals.css";



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.className} ${zain.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
