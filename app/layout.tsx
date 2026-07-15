import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "IntakeForge — AI Intake Form Builder",
  description: "Generate and publish professional intake forms to Google Forms in seconds using AI.",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  openGraph: {
    title: "IntakeForge — AI Intake Form Builder",
    description: "Generate and publish professional intake forms to Google Forms in seconds using AI.",
    url: "https://intakeforge-sigma.vercel.app",
    siteName: "IntakeForge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IntakeForge — AI Intake Form Builder",
    description: "Generate and publish professional intake forms to Google Forms in seconds using AI.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="IntakeForge" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
