import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agenda tu Cita Técnica | CarMD®",
  description: "Reserva tu inspección técnica 100% transparente. Recibe reportes multimedia y diagnósticos en tiempo real vía WhatsApp.",
};

export default function CitasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
