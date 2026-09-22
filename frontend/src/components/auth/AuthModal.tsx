"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, X } from "lucide-react";

export function AuthModal() {
  const { authModalType, closeAuthModal, openAuthModal, login, register } = useAuth();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authModalType) return null;

  const isLogin = authModalType === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    let err = null;
    if (isLogin) {
      err = await login(username, password);
    } else {
      err = await register(username, password);
    }
    
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      closeAuthModal();
      // Reset form
      setUsername("");
      setPassword("");
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
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-[#1f222b] border border-[#2a2d3a] rounded-3xl p-8 shadow-2xl relative overflow-hidden z-10"
        >
          {/* Close button */}
          <button 
            onClick={closeAuthModal}
            className="absolute top-4 right-4 text-[#7a819c] hover:text-white transition-colors z-20"
          >
            <X size={24} />
          </button>

          {/* Glowing orbs */}
          <div className={`absolute top-0 right-0 w-64 h-64 ${isLogin ? 'bg-accent-blue/10' : 'bg-accent-green/10'} rounded-full blur-3xl pointer-events-none transition-colors duration-500`} />
          <div className={`absolute bottom-0 left-0 w-64 h-64 ${isLogin ? 'bg-accent-purple/10' : 'bg-accent-blue/10'} rounded-full blur-3xl pointer-events-none transition-colors duration-500`} />

          <div className="relative z-10 text-center mb-8">
            <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${isLogin ? 'from-accent-blue to-accent-purple' : 'from-accent-green to-accent-blue'} rounded-2xl flex items-center justify-center shadow-lg mb-6 transition-colors duration-500`}>
              {isLogin ? <LogIn size={32} className="text-white" /> : <UserPlus size={32} className="text-black" />}
            </div>
            <h1 className="text-3xl font-black text-white mb-2">{isLogin ? "Welcome Back" : "Create Account"}</h1>
            <p className="text-[#7a819c]">{isLogin ? "Sign in to continue gambling" : "Join the ultimate crypto casino"}</p>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#7a819c] mb-2 uppercase tracking-wide">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-xl bg-[#15181f] border border-[#2a2d3a] text-white focus:outline-none focus:ring-1 transition-all ${isLogin ? 'focus:border-accent-blue focus:ring-accent-blue' : 'focus:border-accent-green focus:ring-accent-green'}`}
                placeholder={isLogin ? "Enter your username" : "Choose a username"}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#7a819c] mb-2 uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-xl bg-[#15181f] border border-[#2a2d3a] text-white focus:outline-none focus:ring-1 transition-all ${isLogin ? 'focus:border-accent-blue focus:ring-accent-blue' : 'focus:border-accent-green focus:ring-accent-green'}`}
                placeholder={isLogin ? "Enter your password" : "Create a strong password"}
              />
            </div>

            {error && <div className="text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-lg text-center">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 mt-4 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 ${
                isLogin 
                  ? 'bg-accent-blue hover:bg-[#2563eb] shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]' 
                  : 'bg-accent-green text-black hover:bg-[#00c566] shadow-[0_0_20px_rgba(0,230,118,0.3)] hover:shadow-[0_0_30px_rgba(0,230,118,0.5)]'
              }`}
            >
              {loading ? (isLogin ? "Signing in..." : "Creating account...") : (isLogin ? "Sign In" : "Sign Up")}
            </button>
          </form>

          <p className="text-center text-[#7a819c] mt-8 relative z-10">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => handleSwitch(isLogin ? "register" : "login")}
              className={`font-bold hover:underline ${isLogin ? 'text-accent-blue' : 'text-accent-green'}`}
            >
              {isLogin ? "Register here" : "Login here"}
            </button>
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
