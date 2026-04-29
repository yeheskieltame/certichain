"use client";

import { useState, Suspense } from "react";
import { VerifyDiploma } from "@/components/VerifyDiploma";
import { CertificateTable } from "@/components/CertificateTable";
import { Database } from "lucide-react";

export default function ExplorePage() {
  const [selectedTokenId, setSelectedTokenId] = useState<string>("");

  const handleSelectTokenId = (id: string) => {
    setSelectedTokenId(id);
    // Scroll to verify section
    document.getElementById("verify")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="mx-auto mt-6 max-w-[1780px] px-6">
      <Suspense fallback={<div className="h-48 flex items-center justify-center font-bold text-muted">Loading verification module...</div>}>
        <VerifyDiploma initialTokenId={selectedTokenId} />
      </Suspense>

      <section className="mt-12">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff6b00] text-white">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black">Certificate Database</h2>
            <p className="text-sm font-medium text-muted">Daftar semua ijazah yang pernah diterbitkan.</p>
          </div>
        </div>
        
        <CertificateTable onSelectTokenId={handleSelectTokenId} />
      </section>
    </main>
  );
}
