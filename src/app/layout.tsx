import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const logoPath = "/lacakkarirku_logo.png";

export const metadata: Metadata = {
  title: "LacakKarirku - AI-Assisted Job Search Workspace",
  description:
    "Parse a PDF CV, aggregate jobs, review CV-job matches, track applications, and plan follow-ups in one workspace.",
  icons: {
    icon: [{ url: logoPath, type: "image/png" }],
    shortcut: [logoPath],
    apple: [{ url: logoPath, type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="id" className="h-full antialiased" suppressHydrationWarning>
        <body
          className={`${fraunces.variable} ${inter.variable} min-h-full flex flex-col font-inter`}
          suppressHydrationWarning
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
