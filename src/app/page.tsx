import LandingPage from "@/components/LandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CarMD® | Diagnóstico Mecánico Automotriz",
  description: "38 años redefiniendo la perfección mecánica. Diagnóstico avanzado y mantenimiento preventivo con garantía real.",
};

export default function WebTestPage() {
  return <LandingPage />;
}
