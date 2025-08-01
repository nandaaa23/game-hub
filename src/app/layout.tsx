import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import './globals.css';
 
const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  weight: "400", 
  display: "swap",
});

export const metadata: Metadata = {
  title: "Retro Game Hub",
  description: "A cool retro game hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={pressStart2P.className}>{children}</body>
    </html>
  );
}