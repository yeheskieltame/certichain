"use client";

import { ChangeEvent, useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { decodeEventLog } from "viem";
import {
  BadgeCheck,
  Building2,
  Download,
  FileBadge,
  FileText,
  ImageUp,
  Loader2,
  ShieldCheck,
  Upload,
  User,
  Wallet
} from "lucide-react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi";
import { zeroAddress } from "viem";
import { bnbSmartChainTestnet } from "@/lib/chains";
import {
  CERTICHAIN_ABI,
  CERTICHAIN_ADDRESS,
  txUrl
} from "@/lib/contract";
import { generateDiplomaBlob, generateDiplomaDataUrl } from "@/lib/diploma";
import { ipfsUrl, uploadFileToPinata, uploadJsonToPinata } from "@/lib/pinata";

export function IssueDiploma() {
  const [uuid, setUuid] = useState<string>("");
  const [name, setName] = useState("John Doe");
  const [university, setUniversity] = useState("Blockchain University");
  const [photoDataUrl, setPhotoDataUrl] = useState<string>();
  const [diplomaImage, setDiplomaImage] = useState<string>("");
  const [formMessage, setFormMessage] = useState<string>("");
  const [uris, setUris] = useState({ diplomaUri: "", metadataUri: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [isSavingDb, setIsSavingDb] = useState(false);
  const processedTx = useRef<string | null>(null);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const switchChain = useSwitchChain();
  const mint = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    chainId: bnbSmartChainTestnet.id,
    hash: mint.data
  });

  useEffect(() => {
    setUuid("CC-2026-" + uuidv4().slice(0, 8).toUpperCase());
  }, []);

  const hasMinted = useReadContract({
    address: CERTICHAIN_ADDRESS,
    abi: CERTICHAIN_ABI,
    functionName: "hasMinted",
    args: [address ?? zeroAddress],
    chainId: bnbSmartChainTestnet.id,
    query: {
      enabled: Boolean(address)
    }
  });

  const isWrongNetwork = isConnected && chainId !== bnbSmartChainTestnet.id;
  const canMint =
    name.trim().length > 1 &&
    university.trim().length > 1 &&
    uuid.length > 0;

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      if (!uuid) return;
      
      const image = await generateDiplomaDataUrl({
        name,
        university,
        uuid,
        photoDataUrl
      });

      if (!cancelled) {
        setDiplomaImage(image);
      }
    }

    void generate().catch(() => {
      if (!cancelled) {
        setFormMessage("Preview canvas gagal dibuat di browser ini.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [name, photoDataUrl, university, uuid]);

  useEffect(() => {
    if (receipt.isSuccess && receipt.data && receipt.data.transactionHash !== processedTx.current) {
      processedTx.current = receipt.data.transactionHash;
      let tokenId = "";
      
      for (const log of receipt.data.logs) {
        try {
          const decoded = decodeEventLog({
            abi: CERTICHAIN_ABI,
            data: log.data,
            topics: log.topics,
          });
          
          if (decoded.eventName === 'Transfer' && decoded.args) {
            const args = decoded.args as any;
            if (args.tokenId !== undefined) {
              tokenId = args.tokenId.toString();
              break;
            }
          } else if (decoded.eventName === 'IjazahDiterbitkan' && decoded.args) {
            const args = decoded.args as any;
            if (args.id !== undefined) {
              tokenId = args.id.toString();
              break;
            }
          }
        } catch (e) {
          // Ignore
        }
      }

      if (tokenId && address) {
        setIsSavingDb(true);
        fetch("/api/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uuid,
            tokenId: parseInt(tokenId, 10),
            walletAddress: address,
            name: name.trim(),
            university: university.trim()
          })
        })
          .then(() => {
            setFormMessage(`Ijazah berhasil dicatat onchain dengan ID: ${tokenId}. QR Code sekarang aktif!`);
            setUuid("CC-2026-" + uuidv4().slice(0, 8).toUpperCase()); // Reset UUID for the next mint
          })
          .catch(() => {
            setFormMessage(`Ijazah berhasil dicatat onchain (ID: ${tokenId}), namun gagal sinkronisasi database.`);
          })
          .finally(() => {
            setIsSavingDb(false);
          });
      } else {
        setFormMessage("Transaksi berhasil, namun Token ID gagal diekstrak.");
      }

      void hasMinted.refetch();
    }
  }, [hasMinted, receipt.isSuccess, receipt.data, address, uuid, name, university]);

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setFormMessage("Gunakan file JPG atau PNG.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormMessage("Ukuran foto maksimal 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(String(reader.result));
      setFormMessage("");
    };
    reader.readAsDataURL(file);
  }

  async function handleMint() {
    setFormMessage("");

    if (!canMint) {
      setFormMessage("Lengkapi nama dan universitas terlebih dulu.");
      return;
    }

    if (!isConnected) {
      setFormMessage("Connect wallet dulu sebelum mint ijazah.");
      return;
    }

    setIsUploading(true);

    try {
      let photoCid: string | undefined;
      if (photoDataUrl) {
        setUploadStep("Uploading photo to IPFS...");
        const photoBlob = await (await fetch(photoDataUrl)).blob();
        photoCid = await uploadFileToPinata(photoBlob, `certichain-photo-${slugifyFile(name)}.png`);
      }

      setUploadStep("Generating & uploading diploma image...");
      const diplomaBlob = await generateDiplomaBlob({ name, university, uuid, photoDataUrl });
      const diplomaCid = await uploadFileToPinata(diplomaBlob, `certichain-diploma-${slugifyFile(name)}.png`);
      const diplomaUri = ipfsUrl(diplomaCid);

      setUploadStep("Uploading metadata to IPFS...");
      const metadata = {
        name: `CertiChain Diploma — ${name.trim()}`,
        description: `On-chain diploma for ${name.trim()} from ${university.trim()}. Issued via CertiChain on BNB Smart Chain Testnet.`,
        image: diplomaUri,
        attributes: [
          { trait_type: "Graduate", value: name.trim() },
          { trait_type: "University", value: university.trim() },
          { trait_type: "Program", value: "Bachelor of Computer Science" },
          { trait_type: "UUID", value: uuid },
          ...(photoCid ? [{ trait_type: "Photo CID", value: photoCid }] : [])
        ]
      };
      const metadataCid = await uploadJsonToPinata(metadata, `certichain-meta-${slugifyFile(name)}.json`);
      const metadataUri = ipfsUrl(metadataCid);

      setUris({ diplomaUri, metadataUri });
      setUploadStep("Confirm mint in your wallet...");

      if (address) {
        await fetch("/api/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uuid,
            tokenId: null, // pending
            walletAddress: address,
            name: name.trim(),
            university: university.trim()
          })
        });
      }

      const submitMint = () => {
        mint.mutate({
          address: CERTICHAIN_ADDRESS,
          abi: CERTICHAIN_ABI,
          functionName: "mintIjazah",
          args: [name.trim(), university.trim(), diplomaUri, metadataUri],
          chainId: bnbSmartChainTestnet.id
        });
      };

      if (isWrongNetwork) {
        switchChain.mutate(
          { chainId: bnbSmartChainTestnet.id },
          {
            onSuccess: submitMint,
            onError: () => setFormMessage("Ganti network ke BNB Smart Chain Testnet dulu.")
          }
        );
      } else {
        submitMint();
      }
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Upload ke IPFS gagal. Cek koneksi & PINATA_JWT.");
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  }

  function downloadPreview() {
    if (!diplomaImage) {
      return;
    }

    const link = document.createElement("a");
    link.href = diplomaImage;
    link.download = `${slugifyFile(name)}-certichain-diploma.png`;
    link.click();
  }

  return (
    <div className="mx-auto mt-6 grid max-w-[1780px] gap-6 xl:grid-cols-[560px_minmax(0,1fr)] px-6">
      <section className="line-panel corner-cut overflow-hidden">
        <div className="flex items-center gap-4 border-b-2 border-[#ff6b00] px-6 py-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#ff6b00] text-white">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">Issue New Diploma</h2>
            <p className="text-sm font-medium text-muted">Nama dan universitas langsung masuk preview.</p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <label className="block">
            <span className="mb-2 block font-extrabold">Name</span>
            <span className="field-shell">
              <span className="icon-box h-10 w-10">
                <User size={24} />
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter full name"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block font-extrabold">University</span>
            <span className="field-shell">
              <span className="icon-box h-10 w-10">
                <Building2 size={24} />
              </span>
              <input
                value={university}
                onChange={(event) => setUniversity(event.target.value)}
                placeholder="Enter university name"
              />
            </span>
          </label>

          <div>
            <span className="mb-2 block font-extrabold">Photo Upload</span>
            <div className="grid gap-4 sm:grid-cols-[260px_1fr]">
              <label className="upload-zone flex min-h-[210px] flex-col items-center justify-center rounded-lg p-4 text-center">
                {photoDataUrl ? (
                  <img
                    src={photoDataUrl}
                    alt="Graduate preview"
                    className="h-32 w-32 rounded-lg border border-[#ff6b00] object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-[#ff6b00] bg-white text-[#ff6b00]">
                    <ImageUp size={54} />
                  </div>
                )}
                <input className="hidden" type="file" accept="image/png,image/jpeg" onChange={handlePhoto} />
                <span className="secondary-button mt-4 px-4">
                  <Upload size={20} /> Choose File
                </span>
              </label>

              <div className="flex flex-col justify-center gap-3 text-sm text-[#374151]">
                <p className="font-extrabold text-ink">Upload Graduate Photo</p>
                <p>Recommended square image</p>
                <p>Max size 5MB</p>
                <p>Formats JPG, PNG</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-extrabold">Diploma URI</span>
              <span className="field-shell min-h-[48px]">
                <input
                  value={uris.diplomaUri}
                  readOnly
                  placeholder="Auto-filled after IPFS upload"
                  className="bg-[#f9fafb]"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block font-extrabold">Metadata URI</span>
              <span className="field-shell min-h-[48px]">
                <input
                  value={uris.metadataUri}
                  readOnly
                  placeholder="Auto-filled after IPFS upload"
                  className="bg-[#f9fafb]"
                />
              </span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button className="secondary-button px-5" onClick={downloadPreview} disabled={!diplomaImage}>
              <Download size={20} /> Download PNG
            </button>
            <button
              className="primary-button px-5"
              onClick={handleMint}
              disabled={!canMint || isUploading || mint.isPending || receipt.isLoading || isSavingDb}
            >
              {isUploading || mint.isPending || receipt.isLoading || isSavingDb ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <ShieldCheck size={20} />
              )}
              {isUploading
                ? uploadStep || "Uploading to IPFS..."
                : mint.isPending
                  ? "Confirm in Wallet"
                  : receipt.isLoading
                    ? "Minting..."
                    : isSavingDb
                      ? "Saving to DB..."
                      : "Mint Diploma"}
            </button>
          </div>

          {formMessage ? (
            <div className="rounded-lg border border-[#ffd1ad] bg-[#fff8ef] px-4 py-3 text-sm font-bold text-[#7a3410]">
              {formMessage}
            </div>
          ) : null}

          {mint.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {readableError(mint.error)}
            </div>
          ) : null}
        </div>
      </section>

      <section className="certificate-frame corner-cut min-h-[520px] p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-2">
            <div>
              <p className="text-sm font-black text-[#ff6b00]">LIVE DIPLOMA PREVIEW</p>
              <h2 className="text-2xl font-black">Generated from form input</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="status-pill">
                <BadgeCheck size={16} /> BNB Testnet
              </span>
              <span className="status-pill mono">{shortAddress(CERTICHAIN_ADDRESS)}</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#ffd1ad] bg-white p-3">
            {diplomaImage ? (
              <img
                src={diplomaImage}
                alt="Generated diploma preview"
                className="aspect-[14/9] w-full rounded-md object-contain"
              />
            ) : (
              <div className="flex aspect-[14/9] items-center justify-center rounded-md bg-[#fff8ef]">
                <Loader2 className="animate-spin text-[#ff6b00]" size={36} />
              </div>
            )}
          </div>

          <div id="issued" className="grid gap-3 rounded-lg border border-[#ffd1ad] bg-[#fff8ef] p-4 sm:grid-cols-3">
            <StatusItem
              icon={<Wallet size={22} />}
              label="Wallet"
              value={address ? shortAddress(address) : "Not connected"}
            />
            <StatusItem
              icon={<ShieldCheck size={22} />}
              label="Mint Status"
              value={
                hasMinted.isLoading
                  ? "Checking"
                  : hasMinted.data
                    ? "Already minted"
                    : "Ready"
              }
            />
            <StatusItem
              icon={<FileBadge size={22} />}
              label="Contract"
              value={shortAddress(CERTICHAIN_ADDRESS)}
            />
          </div>

          {mint.data ? (
            <a
              className="secondary-button px-5"
              href={txUrl(mint.data)}
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={20} /> View Transaction
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StatusItem({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#ff6b00]">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-extrabold text-muted">{label}</p>
        <p className="truncate font-black">{value}</p>
      </div>
    </div>
  );
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function readableError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Transaksi gagal diproses.";
}

function slugifyFile(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "diploma"
  );
}
