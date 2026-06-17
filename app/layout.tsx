import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mobile Vet | Smart Livestock Protection for Ethiopia",
  description:
    "Mobile Vet leverages satellite intelligence, smart RFID-GPS ear tags, and SMS/USSD alerts to help pastoralist families in Ethiopia protect their animals and livelihoods before disaster strikes.",
  keywords: [
    "livestock protection",
    "Ethiopia",
    "pastoralist",
    "satellite intelligence",
    "RFID-GPS",
    "SMS alerts",
    "USSD",
    "veterinary",
    "drought prediction",
    "financial inclusion",
  ],
  openGraph: {
    title: "Mobile Vet | Smart Livestock Protection for Ethiopia",
    description:
      "Protecting Ethiopia's livestock, securing pastoralist futures through satellite intelligence and smart tracking.",
    url: "https://mobile-vet.vercel.app",
    siteName: "Mobile Vet",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
