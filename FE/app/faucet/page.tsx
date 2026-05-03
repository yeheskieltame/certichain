"use client";

import { useState } from "react";
import { ExternalLink, KeyRound, Wallet } from "lucide-react";
import { isAddress } from "viem";
import { sendFaucetTokens, type FaucetResult } from "./index";
import { txUrl } from "@/lib/contract";

const COOLDOWN_HOURS = 8;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;
const STORAGE_PREFIX = "faucet:lastClaim:";

function cooldownKey(address: string) {
  return `${STORAGE_PREFIX}${address.toLowerCase()}`;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default function FaucetPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FaucetResult | null>(null);

  const trimmed = address.trim();
  const isValid = isAddress(trimmed);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    if (!isValid) {
      setResult({ success: false, error: "Please enter a valid wallet address" });
      return;
    }

    const last = Number(localStorage.getItem(cooldownKey(trimmed)) ?? 0);
    if (last) {
      const elapsed = Date.now() - last;
      if (elapsed < COOLDOWN_MS) {
        setResult({
          success: false,
          error: `This address is on cooldown. Try again in ${formatRemaining(
            COOLDOWN_MS - elapsed
          )}.`,
        });
        return;
      }
    }

    setLoading(true);
    try {
      const res = await sendFaucetTokens(trimmed);
      if (res.success) {
        localStorage.setItem(cooldownKey(trimmed), String(Date.now()));
      }
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto mt-6 max-w-[1780px] px-6">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff6b00] text-white">
            <KeyRound size={24} />
          </div>
          <h1 className="text-3xl font-black">Faucet</h1>
        </div>
        <p className="text-lg font-medium text-muted">
          Get free tokens for testing purposes.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-4 flex w-full max-w-md flex-col gap-4"
        >
          <label className="block text-left">
            <span className="mb-2 block font-extrabold">Wallet Address</span>
            <span className="field-shell">
              <span className="icon-box h-10 w-10">
                <Wallet size={20} />
              </span>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="0x..."
                disabled={loading}
                spellCheck={false}
                autoComplete="off"
              />
            </span>
            {address && !isValid && (
              <span className="mt-1 block text-sm text-red-600">
                Invalid wallet address
              </span>
            )}
          </label>

          <button
            type="submit"
            className="primary-button disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || !isValid}
          >
            {loading ? "Sending..." : "Get Tokens"}
          </button>
        </form>

        {result?.success && (
          <div className="mt-2 w-full max-w-md rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-left text-sm text-green-800">
            <p className="font-semibold">
              Sent {result.amount} tBNB to your wallet!
            </p>
            <a
              href={txUrl(result.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 underline"
            >
              View transaction
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {result && !result.success && (
          <div className="mt-2 w-full max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
            {result.error}
          </div>
        )}
      </div>
    </main>
  );
}
