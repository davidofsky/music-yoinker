import type { Metadata } from "next";
import localFont from "next/font/local";
import Providers from "./Providers";
import "./globals.css";

const spaceGrotesk = localFont({
  src: [
    { path: "./fonts/SpaceGrotesk-300.ttf", weight: "300" },
    { path: "./fonts/SpaceGrotesk-400.ttf", weight: "400" },
    { path: "./fonts/SpaceGrotesk-500.ttf", weight: "500" },
    { path: "./fonts/SpaceGrotesk-600.ttf", weight: "600" },
    { path: "./fonts/SpaceGrotesk-700.ttf", weight: "700" },
  ],
  display: "swap",
});

const bbhBogle = localFont({
  src: "./fonts/BBHBogle-Regular.ttf",
  variable: "--font-bbh-bogle",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Music Yoinker",
  description: "Dont sue me",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.className} ${bbhBogle.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
