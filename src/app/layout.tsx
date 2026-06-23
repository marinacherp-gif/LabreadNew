import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Labread Bakery",
  description: "Fresh artisan bread and baked goods, baked with love.",
  keywords: ["bakery", "bread", "artisan", "fresh baked", "Labread"],
  openGraph: {
    title: "Labread Bakery",
    description: "Fresh artisan bread and baked goods, baked with love.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={playfair.variable}>
      <body>{children}</body>
    </html>
  );
}
