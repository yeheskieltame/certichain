"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, FileBadge, FileText, Loader2, Search } from "lucide-react";
import { useReadContract } from "wagmi";
import { bnbSmartChainTestnet } from "@/lib/chains";
import { CERTICHAIN_ABI, CERTICHAIN_ADDRESS, contractUrl, tokenUrl } from "@/lib/contract";
import { useSearchParams } from "next/navigation";
import { fetchFromIpfs, ipfsGatewayUrls } from "@/lib/pinata";

type IjazahTuple = readonly [string, string, string];

export function VerifyDiploma({ initialTokenId = "1" }: { initialTokenId?: string }) {
  const searchParams = useSearchParams();
  const [verifyInput, setVerifyInput] = useState(initialTokenId || "");
  const [resolvedTokenId, setResolvedTokenId] = useState<string | null>(null);
  const [loadingFromUuid, setLoadingFromUuid] = useState(false);

  useEffect(() => {
    // If navigating directly or URL changes with UUID
    const uuidParam = searchParams.get("uuid");
    if (uuidParam) {
      setVerifyInput(uuidParam);
    }
  }, [searchParams]);

  // Update token ID when prop changes (from table selection)
  useEffect(() => {
    if (initialTokenId) {
      setVerifyInput(initialTokenId);
    }
  }, [initialTokenId]);

  // Resolve input to token ID
  useEffect(() => {
    const val = verifyInput.trim();
    if (/^\d+$/.test(val)) {
      // It's a number
      setResolvedTokenId(val);
    } else if (val.startsWith("CC-") || (val.length === 36 && val.includes("-"))) {
      // It's a UUID/Cert ID
      setLoadingFromUuid(true);
      setResolvedTokenId(null);
      fetch(`/api/certificates?uuid=${val}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.certificate?.tokenId !== undefined && data.certificate?.tokenId !== null) {
            setResolvedTokenId(String(data.certificate.tokenId));
          }
        })
        .catch(console.error)
        .finally(() => setLoadingFromUuid(false));
    } else {
      setResolvedTokenId(null);
    }
  }, [verifyInput]);

  const parsedTokenId = useMemo(() => {
    if (!resolvedTokenId || !/^\d+$/.test(resolvedTokenId)) {
      return undefined;
    }
    return BigInt(resolvedTokenId);
  }, [resolvedTokenId]);

  const issuedData = useReadContract({
    address: CERTICHAIN_ADDRESS,
    abi: CERTICHAIN_ABI,
    functionName: "dataIjazah",
    args: [parsedTokenId ?? 0n],
    chainId: bnbSmartChainTestnet.id,
    query: {
      enabled: parsedTokenId !== undefined
    }
  });

  const tokenUri = useReadContract({
    address: CERTICHAIN_ADDRESS,
    abi: CERTICHAIN_ABI,
    functionName: "tokenURI",
    args: [parsedTokenId ?? 0n],
    chainId: bnbSmartChainTestnet.id,
    query: {
      enabled: parsedTokenId !== undefined
    }
  });

  const owner = useReadContract({
    address: CERTICHAIN_ADDRESS,
    abi: CERTICHAIN_ABI,
    functionName: "ownerOf",
    args: [parsedTokenId ?? 0n],
    chainId: bnbSmartChainTestnet.id,
    query: {
      enabled: parsedTokenId !== undefined
    }
  });

  const verifiedIjazah = issuedData.data as IjazahTuple | undefined;

  const diplomaGatewayUrls = useMemo(
    () => (verifiedIjazah?.[2] ? ipfsGatewayUrls(verifiedIjazah[2]) : []),
    [verifiedIjazah]
  );
  const [imageGatewayIndex, setImageGatewayIndex] = useState(0);

  useEffect(() => {
    setImageGatewayIndex(0);
  }, [verifiedIjazah?.[2]]);

  return (
    <section id="verify" className="grid gap-6 lg:grid-cols-[430px_minmax(0,1fr)] mb-8">
      <div className="line-panel corner-cut p-6">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#ff6b00] text-white">
            <Search size={30} />
          </div>
          <div>
            <h2 className="text-2xl font-black">Verify Diploma</h2>
            <p className="text-sm font-medium text-muted">Read langsung dari smart contract.</p>
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block font-extrabold">ID NFT / Certificate ID</span>
          <span className="field-shell">
            <span className="icon-box h-10 w-10">
              <FileBadge size={22} />
            </span>
            <input
              value={verifyInput}
              onChange={(event) => setVerifyInput(event.target.value)}
              placeholder="Masukkan Token ID (0, 1...) atau ID Sertifikat (CC-2026-...)"
            />
          </span>
        </label>

        <a className="secondary-button mt-5 w-full px-5" href={contractUrl()} target="_blank" rel="noreferrer">
          <FileText size={20} /> Open Contract
        </a>
      </div>

      <div className="line-panel corner-cut p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-[#ff6b00]">ONCHAIN RESULT</p>
            <h2 className="text-2xl font-black">Certificate Registry</h2>
          </div>
          <span className="status-pill mono">chainId {bnbSmartChainTestnet.id}</span>
        </div>

        {issuedData.isLoading || tokenUri.isLoading || owner.isLoading || loadingFromUuid ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-[#ffd1ad] bg-[#fff8ef]">
            <Loader2 className="animate-spin text-[#ff6b00]" size={34} />
          </div>
        ) : verifiedIjazah ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-lg border border-[#ffd1ad] bg-white p-3 shadow-sm">
                <img
                  src={diplomaGatewayUrls[imageGatewayIndex]}
                  alt="Diploma Preview"
                  className="w-full h-auto object-contain rounded"
                  onError={() => {
                    if (imageGatewayIndex < diplomaGatewayUrls.length - 1) {
                      setImageGatewayIndex(imageGatewayIndex + 1);
                    }
                  }}
                />
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await fetchFromIpfs(verifiedIjazah[2]);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Diploma-${verifiedIjazah[0] || "download"}.png`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (error) {
                    console.error("Download failed:", error);
                  }
                }}
                className="primary-button flex items-center justify-center gap-2"
              >
                <Download size={20} /> Download Diploma PNG
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ResultRow label="Nama" value={verifiedIjazah[0] || "-"} />
              <ResultRow label="Universitas" value={verifiedIjazah[1] || "-"} />
              <ResultRow label="Diploma URI" value={verifiedIjazah[2] || "-"} copyable />
              <ResultRow label="Token URI" value={String(tokenUri.data || "-")} copyable />
              <ResultRow label="Owner" value={String(owner.data || "-")} copyable />
              <div className="flex items-end">
                <a
                  className="secondary-button w-full px-5"
                  href={tokenUrl(resolvedTokenId || "0")}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileText size={20} /> View Token
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-[#ffd1ad] bg-[#fff8ef] px-5 py-10 text-center font-bold text-[#7a3410]">
            Masukkan Token ID untuk verifikasi data ijazah.
          </div>
        )}

        {issuedData.error || tokenUri.error || owner.error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            Token belum ditemukan atau RPC gagal membaca data.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ResultRow({
  label,
  value,
  copyable
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-[#ffd1ad] bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-muted">{label}</p>
        {copyable ? (
          <button
            className="flex items-center gap-1.5 text-[#ff6b00]"
            onClick={handleCopy}
            aria-label={`Copy ${label}`}
            title={`Copy ${label}`}
          >
            {copied ? (
              <>
                <span className="text-[10px] font-black uppercase">Copied!</span>
                <Check size={16} />
              </>
            ) : (
              <Copy size={16} />
            )}
          </button>
        ) : null}
      </div>
      <p className="break-all font-black">{value}</p>
    </div>
  );
}
