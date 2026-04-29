import type { Abi, Address } from "viem";
import certiChainAbi from "@/contracts/CertiChainABI.json";

export const CERTICHAIN_ADDRESS =
  "0x405CcCda7EFd5AC9D7ae662069359cBfca6Fac6d" as Address;

export const CERTICHAIN_ABI = certiChainAbi as Abi;

export const BSCSCAN_TESTNET_URL = "https://testnet.bscscan.com";

export function contractUrl() {
  return `${BSCSCAN_TESTNET_URL}/address/${CERTICHAIN_ADDRESS}`;
}

export function txUrl(hash: `0x${string}`) {
  return `${BSCSCAN_TESTNET_URL}/tx/${hash}`;
}

export function tokenUrl(tokenId: string) {
  return `${BSCSCAN_TESTNET_URL}/token/${CERTICHAIN_ADDRESS}?a=${tokenId}`;
}
