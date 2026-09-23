export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-8 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-wider">Terms of Service</h1>
          </div>
          
          <p className="text-[#8e95ad] leading-relaxed text-lg">
            By using MockBet, you agree to these terms. Read them carefully before proceeding.
          </p>
        </div>
      </div>

      <div className="bg-[#15181f] border border-[#2a2d3a] rounded-xl p-8 shadow-lg text-[#8e95ad] space-y-6">
        
        <section className="space-y-3">
          <h2 className="text-white font-bold text-xl">1. Acceptance of Terms</h2>
          <p>
            By accessing or using MockBet, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-white font-bold text-xl">2. Virtual Currency</h2>
          <p>
            The currencies used on this site (e.g., "DLs", "Diamond Locks", "WLS") are strictly virtual. They hold <span className="text-white font-bold">zero real-world value</span> and cannot be exchanged for fiat currency or other cryptocurrencies. MockBet is a simulator, not a real-money gambling platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-white font-bold text-xl">3. User Conduct</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>You agree not to use the platform for any unlawful purpose.</li>
            <li>You agree not to exploit bugs, glitches, or bypass site mechanics.</li>
            <li>You agree to behave respectfully in global chat. Automated spam, hate speech, or malicious links will result in a permanent ban.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-white font-bold text-xl">4. Disclaimer of Liability</h2>
          <p>
            MockBet is provided on an "as is" and "as available" basis. We are not responsible for any virtual losses, account resets, or server downtimes. We reserve the right to modify, suspend, or terminate the service at any time without prior notice.
          </p>
        </section>

      </div>
    </div>
  );
}
