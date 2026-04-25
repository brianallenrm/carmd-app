import ServiceNoteForm from "@/components/ServiceNoteForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-4 md:py-12 px-2 md:px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-2">
            CarMD <span className="text-blue-600">OS</span>
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            Sistema de Gestión de Servicios Premium
          </p>
        </div>

        <ServiceNoteForm />
      </div>
    </main>
  );
}
