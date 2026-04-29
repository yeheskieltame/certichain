"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { format } from "date-fns";

type Certificate = {
  uuid: string;
  tokenId: number | null;
  walletAddress: string;
  name: string | null;
  university: string | null;
  createdAt: string;
};

export function CertificateTable({ onSelectTokenId }: { onSelectTokenId: (id: string) => void }) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCertificates = certificates.filter((cert) => {
    const query = searchQuery.toLowerCase();
    return (
      (cert.name?.toLowerCase() || "").includes(query) ||
      (cert.uuid?.toLowerCase() || "").includes(query) ||
      (cert.walletAddress?.toLowerCase() || "").includes(query) ||
      (cert.university?.toLowerCase() || "").includes(query) ||
      (cert.tokenId !== null && String(cert.tokenId).includes(query))
    );
  });

  useEffect(() => {
    fetch("/api/certificates")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch certificates");
        return res.json();
      })
      .then((data) => setCertificates(data.certificates || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-[#ff6b00]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
        {error}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="rounded-lg border border-[#ffd1ad] bg-[#fff8ef] p-8 text-center text-sm font-bold text-[#7a3410]">
        Belum ada Ijazah yang diterbitkan.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-[#ffd1ad] bg-white px-4 py-2 shadow-sm">
        <Search className="text-muted" size={20} />
        <input
          type="text"
          placeholder="Cari berdasarkan Nama, Certificate ID, Wallet, atau Universitas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent p-2 outline-none font-medium"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#ffd1ad] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fff8ef] text-xs font-black uppercase text-[#1f2937]">
            <tr>
              <th className="px-6 py-4">Certificate ID</th>
              <th className="px-6 py-4">Nama Lulusan</th>
            <th className="px-6 py-4">Universitas</th>
            <th className="px-6 py-4">Token ID</th>
            <th className="px-6 py-4">Wallet Issuer</th>
            <th className="px-6 py-4">Tanggal</th>
            <th className="px-6 py-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ffd1ad]">
          {filteredCertificates.map((cert) => (
            <tr key={cert.uuid} className="hover:bg-[#fffdf8]">
              <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-[#ff6b00]">
                {cert.uuid}
              </td>
              <td className="whitespace-nowrap px-6 py-4 font-bold">
                {cert.name || "-"}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {cert.university || "-"}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {cert.tokenId !== null ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    {cert.tokenId}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    Pending
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4 font-mono text-xs">
                {cert.walletAddress.slice(0, 6)}...{cert.walletAddress.slice(-4)}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {cert.createdAt ? format(new Date(cert.createdAt), "dd MMM yyyy, HH:mm") : "-"}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right">
                {cert.tokenId !== null && (
                  <button
                    onClick={() => onSelectTokenId(String(cert.tokenId))}
                    className="inline-flex items-center gap-1 font-bold text-[#ff6b00] hover:underline"
                  >
                    Verify <ExternalLink size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}
