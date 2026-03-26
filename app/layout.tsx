import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/providers/ToastProvider";

export const metadata: Metadata = {
  title: "Finance App",
  description: "Personal expense management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[var(--color-background)] text-[var(--color-foreground)]">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
