import type { Metadata } from "next";
import { Karla, Rubik } from "next/font/google";
import { Toaster } from "sonner";

import { SessionProvider } from "@/providers/session-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orbit Flag",
  description: "Feature flagging for modern applications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${karla.variable} ${rubik.variable} min-h-dvh overflow-x-hidden antialiased flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
            <Toaster />
            <div id="modal-root" />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
