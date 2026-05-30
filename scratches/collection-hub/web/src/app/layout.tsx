import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Collection Hub",
  description: "Dashboard for imported collection items across sources.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("dark h-full antialiased", "font-sans", geist.variable)}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
