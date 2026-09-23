import Link from "next/link";
import { Shield, FileText, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full mt-12 bg-[#15181f] border-t border-[#2a2d3a] py-8 px-6 text-[#7a819c]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <div className="font-black text-white text-xl tracking-wider uppercase">GrowSpin</div>
          <p className="text-xs max-w-md">
            This is a virtual casino simulator. No real money is involved or paid out. All currency holds zero real-world value.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-sm font-bold">
          <Link href="/fairness" className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Shield size={16} className="text-accent-blue" />
            Provably Fair
          </Link>
          <Link href="/tos" className="flex items-center gap-1.5 hover:text-white transition-colors">
            <FileText size={16} className="text-yellow-500" />
            Terms of Service
          </Link>
          <Link href="/privacy" className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Lock size={16} className="text-green-500" />
            Privacy Policy
          </Link>
        </div>
      </div>
      <div className="text-center text-[10px] uppercase tracking-widest mt-8 border-t border-[#2a2d3a] pt-6 opacity-50">
        © {new Date().getFullYear()} GrowSpin. All rights reserved. Not affiliated with Ubisoft or Growtopia.
      </div>
    </footer>
  );
}
