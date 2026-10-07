"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronDown } from "lucide-react";

export function AuthModal() {
  const { authModalType, closeAuthModal, openAuthModal, login, register } = useAuth();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authModalType) return null;

  const isLogin = authModalType === "login";

  // Password validation checks
  const passLength = password.length >= 8;
  const passCase = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
  const passNumber = /(?=.*\d)/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    let err = null;
    if (isLogin) {
      err = await login(username, password);
    } else {
      if (!agreeTerms) {
        setError("You must agree to the Terms of Service.");
        setLoading(false);
        return;
      }
      if (!passLength || !passCase || !passNumber) {
        setError("Password does not meet requirements.");
        setLoading(false);
        return;
      }
      err = await register(username, email, password);
    }
    
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      closeAuthModal();
      // Reset form
      setUsername("");
      setEmail("");
      setPassword("");
      setAgreeTerms(false);
    }
  };

  const handleSwitch = (type: "login" | "register") => {
    setError("");
    openAuthModal(type);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="absolute inset-0 bg-[#0f1118]/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-[420px] bg-[#11141e] border border-[#1f222b] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden z-10 flex flex-col"
        >
          {/* Top Tabs */}
          <div className="flex items-center pt-6 px-6 pb-2 gap-4">
            <button 
              type="button"
              onClick={() => handleSwitch("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? "bg-[#1b202e] text-white" : "text-[#878eab] hover:text-white"}`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => handleSwitch("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? "bg-[#1b202e] text-white" : "text-[#878eab] hover:text-white"}`}
            >
              Register
            </button>
          </div>

          <div className="p-6">
            {/* Logo Area */}
            <div className="flex flex-col items-center mb-6 text-center">
              <img src="/logo.png" alt="GrowSpin" className="h-10 mb-4" />
              <h1 className="text-xl font-bold text-white mb-2">
                {isLogin ? "Welcome back to GrowSpin!" : "Create Your Account. Roll Into Rewards."}
              </h1>
              <p className="text-[#878eab] text-sm leading-relaxed px-4">
                {isLogin 
                  ? "Sign in to continue playing, manage your balance, and pick up where you left off."
                  : "Create your account and get instant access to GrowSpin games and rewards."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white mb-2 tracking-wide">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-sm rounded-lg bg-[#1b202e] border border-transparent text-white placeholder-[#626983] focus:outline-none focus:border-[#2563eb]/50 transition-colors"
                  placeholder="Enter Username"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-white mb-2 tracking-wide">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-sm rounded-lg bg-[#1b202e] border border-transparent text-white placeholder-[#626983] focus:outline-none focus:border-[#2563eb]/50 transition-colors"
                    placeholder="Enter email"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-white mb-2 tracking-wide">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-sm rounded-lg bg-[#1b202e] border border-transparent text-white placeholder-[#626983] focus:outline-none focus:border-[#2563eb]/50 transition-colors"
                  placeholder="Enter Password"
                />
                
                {isLogin && (
                  <div className="flex justify-end mt-2">
                    <button type="button" className="text-xs text-[#878eab] hover:text-white transition-colors underline underline-offset-2">
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {/* Password Requirements (Register Only) */}
              {!isLogin && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-xs">
                    {passLength ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-[#626983]" />}
                    <span className={passLength ? "text-[#878eab]" : "text-[#626983]"}>Minimum 8 characters</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {passCase ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-[#626983]" />}
                    <span className={passCase ? "text-[#878eab]" : "text-[#626983]"}>Includes lower and upper case character</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {passNumber ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-[#626983]" />}
                    <span className={passNumber ? "text-[#878eab]" : "text-[#626983]"}>At least 1 number</span>
                  </div>
                </div>
              )}

              {/* Referrer Code (Register Only) */}
              {!isLogin && (
                <div className="pt-2">
                  <button type="button" className="flex items-center justify-between w-full text-[#878eab] hover:text-white transition-colors text-sm font-bold">
                    Referrer Code (Optional)
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}

              {/* Terms (Register Only) */}
              {!isLogin && (
                <div className="flex items-start gap-3 pt-2">
                  <div 
                    className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer flex-shrink-0 mt-0.5 transition-colors ${agreeTerms ? 'bg-[#2563eb] border-[#2563eb]' : 'bg-[#1b202e] border-[#2a2f3e]'}`}
                    onClick={() => setAgreeTerms(!agreeTerms)}
                  >
                    {agreeTerms && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-xs text-[#878eab] leading-tight cursor-pointer select-none" onClick={() => setAgreeTerms(!agreeTerms)}>
                    I have read and agree to the <a href="#" className="text-[#2563eb] hover:underline" onClick={e=>e.stopPropagation()}>Terms of Service</a> and <a href="#" className="text-[#2563eb] hover:underline" onClick={e=>e.stopPropagation()}>Privacy Policy</a>.
                  </span>
                </div>
              )}

              {error && <div className="text-red-400 text-sm font-bold text-center bg-red-500/10 py-2 rounded-lg">{error}</div>}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || (!isLogin && (!passLength || !passCase || !passNumber || !agreeTerms))}
                  className="w-full py-3 bg-[#2563eb] hover:bg-blue-500 disabled:bg-[#1b202e] disabled:text-[#626983] disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
                >
                  {loading ? (isLogin ? "Signing in..." : "Registering...") : (isLogin ? "Sign In" : "Register")}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
