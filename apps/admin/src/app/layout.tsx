import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "MINIMALL Creator Studio",
  description: "Instagram-native shopping experience creator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white">
        {children}
      </body>
    </html>
  );
}