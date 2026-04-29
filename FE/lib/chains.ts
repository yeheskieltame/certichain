import { createConfig as createPrivyWagmiConfig } from "@privy-io/wagmi";
import { defineChain } from "viem";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";

export const BSC_TESTNET_RPC_URL =
  process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL ||
  "https://bsc-testnet-rpc.publicnode.com";

export const bnbSmartChainTestnet = defineChain({
  id: 97,
  name: "BNB Smart Chain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "tBNB",
    symbol: "tBNB"
  },
  rpcUrls: {
    default: {
      http: [BSC_TESTNET_RPC_URL]
    },
    public: {
      http: [BSC_TESTNET_RPC_URL]
    }
  },
  blockExplorers: {
    default: {
      name: "BscScan Testnet",
      url: "https://testnet.bscscan.com"
    }
  },
  testnet: true
});

export const wagmiConfig = createConfig({
  chains: [bnbSmartChainTestnet],
  connectors: [injected()],
  transports: {
    [bnbSmartChainTestnet.id]: http(BSC_TESTNET_RPC_URL)
  }
});

export const privyWagmiConfig = createPrivyWagmiConfig({
  chains: [bnbSmartChainTestnet],
  transports: {
    [bnbSmartChainTestnet.id]: http(BSC_TESTNET_RPC_URL)
  }
});
