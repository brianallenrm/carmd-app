import ServiceNoteForm from "@/components/ServiceNoteForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-2">
            CarMD <span className="text-blue-600">OS</span>
          </h1>
          <p className="text-lg text-gray-600">
            Sistema de Gestión de Servicios Premium
          </p>
        </div>

        <ServiceNoteForm />
      </div>
    </main>
  );
}
