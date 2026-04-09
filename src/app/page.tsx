import LandingPage from "@/components/LandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CarMD | Visión 2.0 Prototipo",
  description: "Propuesta de diseño premium para CarMD.",
};

export default function WebTestPage() {
  return <LandingPage />;
}
