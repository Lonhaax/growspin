export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-8 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-wider">Privacy Policy</h1>
          </div>
          
          <p className="text-[#8e95ad] leading-relaxed text-lg">
            We respect your privacy. Here is a simple breakdown of what data we collect and how it is used.
          </p>
        </div>
      </div>

      <div className="bg-[#15181f] border border-[#2a2d3a] rounded-xl p-8 shadow-lg text-[#8e95ad] space-y-6">
        
        <section className="space-y-3">
          <h2 className="text-white font-bold text-xl">1. Information Collection</h2>
          <p>
            When you create an account, we collect the username and password you provide. We do not require emails, phone numbers, or any personally identifiable information (PII).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-white font-bold text-xl">2. Cookies and Local Storage</h2>
          <p>
            We use essential cookies and browser local storage to maintain your login session and save UI preferences (such as your mute settings). We do not use third-party tracking cookies or advertising networks.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-white font-bold text-xl">3. Data Security</h2>
          <p>
            Your passwords are cryptographically hashed using standard security protocols (bcrypt) before being stored in our database. However, as this is a simulator project, we recommend you do not use passwords that you use on other, more sensitive websites.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-white font-bold text-xl">4. Third-Party Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your information to outside parties. Your data remains entirely within the MockBet database.
          </p>
        </section>

      </div>
    </div>
  );
}
