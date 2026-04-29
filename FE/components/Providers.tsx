"use client";

import { createContext, useContext, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider as PrivyWagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { bnbSmartChainTestnet, privyWagmiConfig, wagmiConfig } from "@/lib/chains";

const PrivyRuntimeContext = createContext(false);

export function usePrivyRuntime() {
  return useContext(PrivyRuntimeContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <PrivyRuntimeContext.Provider value={false}>{children}</PrivyRuntimeContext.Provider>
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        supportedChains: [bnbSmartChainTestnet],
        defaultChain: bnbSmartChainTestnet,
        loginMethods: ["wallet", "email"],
        appearance: {
          accentColor: "#ff6b00",
          theme: "light",
          showWalletLoginFirst: true
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets"
          }
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PrivyWagmiProvider config={privyWagmiConfig}>
          <PrivyRuntimeContext.Provider value>{children}</PrivyRuntimeContext.Provider>
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
