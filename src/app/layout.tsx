import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import Script from "next/script";

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CarMD OS",
  },
  formatDetection: {
    telephone: false,
  },
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

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "AutoRepair",
  "name": "CarMD Diagnóstico Mecánico Automotriz",
  "image": "https://carmd.com.mx/logo.png",
  "@id": "https://carmd.com.mx",
  "url": "https://carmd.com.mx",
  "telephone": "+525611904066",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Calle Palacio de Iturbide No. 233 Col. Metropolitana 2da. Secc.",
    "addressLocality": "Nezahualcóyotl",
    "addressRegion": "Estado de México",
    "postalCode": "57740",
    "addressCountry": "MX"
  },
  "priceRange": "$$",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Saturday"
      ],
      "opens": "09:00",
      "closes": "14:00"
    }
  ],
  "sameAs": [
    "https://wa.me/525611904066"
  ]
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        {children}
        <CookieBanner />
        
        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
