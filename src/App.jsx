import React from "react";
import SRSForm from "./components/SRSForm";

export default function App() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex items-center justify-between w-full">
          <h1 className="text-2xl md:text-3xl font-semibold text-heading">SRS PDF Generator</h1>
          <p className="text-sm text-gray-500 hidden md:block">Enter minimal info → generate full SRS → download PDF</p>
        </header>

        <main className="flex max-sm:grid max-sm:grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SRSForm />
          </div>
        </main>
      </div>
    </div>
  );
}
