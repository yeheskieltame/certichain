"use server";

import {
  createWalletClient,
  http,
  isAddress,
  parseEther,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BSC_TESTNET_RPC_URL, bnbSmartChainTestnet } from "@/lib/chains";

const FAUCET_AMOUNT_BNB = "0.002";

export type FaucetResult =
  | { success: true; txHash: `0x${string}`; amount: string }
  | { success: false; error: string };

function normalizePrivateKey(key: string): Hex {
  const trimmed = key.trim();
  return (trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`) as Hex;
}

export async function sendFaucetTokens(
  rawAddress: string
): Promise<FaucetResult> {
  const address = rawAddress.trim();

  if (!isAddress(address)) {
    return { success: false, error: "Invalid wallet address" };
  }

  const privateKey = process.env.FAUCET_PRIVATE_KEY;
  if (!privateKey) {
    return {
      success: false,
      error: "Faucet is not configured. Please set FAUCET_PRIVATE_KEY.",
    };
  }

  try {
    const account = privateKeyToAccount(normalizePrivateKey(privateKey));

    const client = createWalletClient({
      account,
      chain: bnbSmartChainTestnet,
      transport: http(BSC_TESTNET_RPC_URL),
    });

    const txHash = await client.sendTransaction({
      to: address as Address,
      value: parseEther(FAUCET_AMOUNT_BNB),
    });

    return { success: true, txHash, amount: FAUCET_AMOUNT_BNB };
  } catch (err) {
    console.error("Faucet error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to send tokens";
    return { success: false, error: message };
  }
}
