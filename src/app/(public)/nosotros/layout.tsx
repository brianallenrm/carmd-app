import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuestra Historia y Compromiso | CarMD®",
  description: "Un legado de ingeniería desde 1988. Conoce el rigor técnico, nuestra experiencia con flotas críticas y la pasión por la excelencia automotriz.",
};

export default function NosotrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
