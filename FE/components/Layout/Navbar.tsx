"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, Loader2, LogOut, Menu, X, Home, Compass, Wallet as WalletIcon } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { usePrivyRuntime } from "@/components/Providers";
import { bnbSmartChainTestnet } from "@/lib/chains";

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] w-full px-4 pt-4 pb-2">
      <div className="mx-auto max-w-[1880px]">
        <div className="line-panel corner-cut relative flex items-center justify-between px-6 py-4 transition-all duration-300">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm border border-[#ffd7b8]">
                <img src="/logo-devweb3-jogja.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="hidden flex-col sm:flex">
                <h1 className="text-xl font-black leading-tight tracking-tighter">IJAZAH</h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff6b00]">
                  Onchain Credentials
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink href="/" icon={<Home size={18} />} active={pathname === "/"} label="Issue" />
            <NavLink href="/explore" icon={<Compass size={18} />} active={pathname === "/explore"} label="Explore" />
          </nav>

          {/* Wallet Section & Mobile Trigger */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <ConnectPanel />
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#ff6b00] text-[#ff6b00] lg:hidden hover:bg-[#fff0df] transition-colors"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="absolute left-0 top-full mt-3 w-full lg:hidden">
            <div className="line-panel corner-cut flex flex-col gap-2 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <MobileNavLink 
                href="/" 
                icon={<Home size={20} />} 
                active={pathname === "/"} 
                label="Issue Certificate" 
                onClick={() => setIsMenuOpen(false)} 
              />
              <MobileNavLink 
                href="/explore" 
                icon={<Compass size={20} />} 
                active={pathname === "/explore"} 
                label="Explore & Verify" 
                onClick={() => setIsMenuOpen(false)} 
              />
              <div className="mt-2 border-t border-[#ffd7b8] pt-4 md:hidden">
                <ConnectPanel />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, icon, active, label }: { href: string; icon: React.ReactNode; active: boolean; label: string }) {
  return (
    <Link 
      href={href} 
      className={`group relative flex items-center gap-2 px-4 py-2 transition-all ${
        active ? "text-[#ff6b00]" : "text-[#1f2937] hover:text-[#ff6b00]"
      }`}
    >
      <span className={`transition-transform duration-200 group-hover:scale-110 ${active ? "scale-110" : ""}`}>
        {icon}
      </span>
      <span className="text-sm font-black uppercase tracking-wide">{label}</span>
      {active && (
        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#ff6b00] rounded-full" />
      )}
    </Link>
  );
}

function MobileNavLink({ href, icon, active, label, onClick }: { href: string; icon: React.ReactNode; active: boolean; label: string; onClick: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`flex items-center gap-4 rounded-lg px-4 py-4 transition-colors ${
        active ? "bg-[#fff0df] text-[#ff6b00]" : "text-[#1f2937] hover:bg-[#fffdf8]"
      }`}
    >
      <span className={active ? "text-[#ff6b00]" : "text-[#ff6b00]"}>{icon}</span>
      <span className="text-base font-black uppercase tracking-wide">{label}</span>
    </Link>
  );
}

function ConnectPanel() {
  const hasPrivy = usePrivyRuntime();

  return (
    <div className="flex min-w-[200px] items-center justify-between gap-4 rounded-xl border-2 border-[#ff6b00] bg-white px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff0df] text-[#ff6b00]">
          <WalletIcon size={20} />
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-black uppercase text-[#1f2937]">Network</p>
          <p className="text-[10px] font-bold text-[#ff6b00]">BSC Testnet</p>
        </div>
      </div>
      <div className="h-8 w-[1.5px] bg-[#ffd7b8] hidden sm:block" />
      {hasPrivy ? <PrivyConnectAction /> : <InjectedConnectAction />}
    </div>
  );
}

function PrivyConnectAction() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();

  if (!ready) {
    return (
      <button className="secondary-button min-w-28 px-4" disabled>
        <Loader2 className="animate-spin" size={18} /> Loading
      </button>
    );
  }

  if (authenticated) {
    return (
      <button className="secondary-button h-10 min-w-28 border-none bg-[#fff0df] px-4 text-sm" onClick={logout}>
        <LogOut size={16} /> <span className="font-mono">{address ? shortAddress(address) : "Logout"}</span>
      </button>
    );
  }

  return (
    <button className="primary-button h-10 min-w-28 px-4 text-sm" onClick={login}>
      Connect
    </button>
  );
}

function InjectedConnectAction() {
  const { address, isConnected } = useAccount();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const connector = connect.connectors[0];

  if (isConnected) {
    return (
      <button className="secondary-button h-10 min-w-28 border-none bg-[#fff0df] px-4 text-sm" onClick={() => disconnect.mutate()}>
        <LogOut size={16} /> <span className="font-mono">{address ? shortAddress(address) : "Disconnect"}</span>
      </button>
    );
  }

  return (
    <button
      className="primary-button h-10 min-w-28 px-4 text-sm"
      onClick={() => connector && connect.mutate({ connector, chainId: bnbSmartChainTestnet.id })}
      disabled={!connector || connect.isPending}
    >
      {connect.isPending ? <Loader2 className="animate-spin" size={16} /> : <WalletIcon size={16} />}
      Connect
    </button>
  );
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
