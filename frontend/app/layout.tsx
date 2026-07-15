import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "IntakeForge",
  description: "Generate and publish intake forms to Google Forms",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
