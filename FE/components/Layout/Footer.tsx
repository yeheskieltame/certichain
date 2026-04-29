import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-[#ffd1ad] bg-[#fff8ef] py-10">
      <div className="mx-auto flex max-w-[1880px] flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-3">
          <img src="/logo-devweb3-jogja.png" alt="Logo" className="h-10 w-auto object-contain" />
          <p className="font-black text-[#0f172a]">Devweb3 Jogja</p>
        </div>
        
        <p className="text-sm font-medium text-[#4b5563]">
          © 2026 University Tour Lampung — DevWeb3 Jogja.
        </p>
        
        <div className="flex gap-4 text-sm font-bold">
          <Link href="/" className="hover:text-[#ff6b00]">Issue</Link>
          <Link href="/explore" className="hover:text-[#ff6b00]">Explore</Link>
        </div>
      </div>
    </footer>
  );
}
