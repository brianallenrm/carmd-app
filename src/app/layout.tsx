import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarMD® | Ingeniería y Transparencia Automotriz",
  description: "38 años redefiniendo la perfección mecánica. Diagnóstico avanzado, reparación de motores y mantenimiento preventivo con garantía real de 1 año en CDMX y Nezahualcóyotl.",
  keywords: ["mecánica automotriz", "diagnóstico avanzado", "reparación de motores", "taller mecánico Neza", "garantía automotriz", "CarMD"],
  authors: [{ name: "CarMD Engineering Team" }],
  openGraph: {
    title: "CarMD® | El Estándar Maestro en Mecánica",
    description: "Tecnología de vanguardia y un trato obsesivo por la calidad. Reserva tu inspección hoy.",
    url: "https://carmd.com.mx",
    siteName: "CarMD",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "es_MX",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
