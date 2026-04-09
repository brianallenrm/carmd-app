import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servicios Mecánicos Especializados | CarMD®",
  description: "Catálogo completo de servicios: Restauración de motor, sistemas de frenado, afinación maestro y diagnóstico avanzado con tecnología de grado industrial.",
};

export default function ServiciosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
