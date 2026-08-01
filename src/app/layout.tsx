import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoAlert",
  description: "Vehicle maintenance and expense management.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
