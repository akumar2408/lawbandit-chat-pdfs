import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LawBandit – Chat with PDFs (RAG)",
  description: "Upload legal PDFs and ask questions with page-cited answers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
