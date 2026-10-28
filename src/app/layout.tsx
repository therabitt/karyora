import type { Metadata } from "next";
import { Caveat, Cormorant_Garamond, DM_Sans, Playwrite_NL } from "next/font/google";
import "./globals.css";

const playwriteNL = Playwrite_NL({
  variable: "--font-playwrite-nl",
  display: "swap",
});

const caveat = Caveat({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Karyora — Artist Portfolio & Commission Management",
    template: "%s | Karyora",
  },
  description:
    "An editorial portfolio and commission inquiry management platform for independent artists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={playwriteNL.variable + " " + caveat.variable + " " + cormorantGaramond.variable + " " + dmSans.variable + " h-full antialiased"}
    >
      <body className="min-h-full flex flex-col font-sans bg-paper text-ink selection:bg-accent-soft selection:text-ink">
        {children}
      </body>
    </html>
  );
}
