import type { Metadata } from "next";
import { Gabarito, Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const gabarito = Gabarito({ subsets: ["latin"], variable: "--font-gabarito" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Hej Bingo!",
  description: "Samla dina kollegor!",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.className} ${gabarito.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
