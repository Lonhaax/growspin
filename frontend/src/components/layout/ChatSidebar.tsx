"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { MessageSquare, Send, ChevronRight, ChevronLeft, Droplet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import { useWallet } from "@/context/WalletContext";

type ChatMsg = {
  id: number;
  content: string;
  timestamp: string;
  user: {
    username: string;
    totalWagered: number;
  };
};

export function ChatSidebar() {
  const { user, openAuthModal } = useAuth();
  const { fetchBalance } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeRain, setActiveRain] = useState<{ amount: number, endTime: number, joinedCount: number, hasJoined: boolean } | null>(null);
  const [rainTimeLeft, setRainTimeLeft] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    let interval: any;
    if (activeRain) {
      interval = setInterval(() => {
        const left = Math.max(0, Math.floor((activeRain.endTime - Date.now()) / 1000));
        setRainTimeLeft(left);
        if (left === 0) {
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeRain]);

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      try {
        const res = await apiFetch("/chat/messages");
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      } catch (e) {}
    };
    fetchMessages();

    // Connect to Socket.io
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
    socketRef.current = io(backendUrl, { withCredentials: true });

    socketRef.current.on('chat_message', (msg: ChatMsg) => {
      setMessages(prev => [...prev, msg].slice(-50));
    });

    socketRef.current.on('rain_started', (data: { amount: number, endTime: number, joinedCount: number }) => {
      setActiveRain({ ...data, hasJoined: false });
      setRainTimeLeft(Math.max(0, Math.floor((data.endTime - Date.now()) / 1000)));
    });

    socketRef.current.on('rain_update', (data: { joinedCount: number }) => {
      setActiveRain(prev => prev ? { ...prev, joinedCount: data.joinedCount } : null);
    });

    socketRef.current.on('rain_ended', () => {
      setActiveRain(null);
    });

    socketRef.current.on('balanceUpdate', (data: { userId: number }) => {
      // Re-fetch balance if the event matches current user, or blindly fetch since it's just a UI sync
      fetchBalance();
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [fetchBalance]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return openAuthModal("login");
    if (!input.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await apiFetch("/chat/send", {
        method: "POST",
        body: JSON.stringify({ content: input })
      });
      if (res.ok) {
        setInput("");
      }
    } catch (e) {}
    setIsSending(false);
  };

  const getVIPColor = (wagered: number) => {
    if (wagered >= 100000000) return "text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.8)]"; // Diamond
    if (wagered >= 25000000) return "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]"; // Platinum
    if (wagered >= 5000000) return "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]"; // Gold
    if (wagered >= 1000000) return "text-slate-300 drop-shadow-[0_0_5px_rgba(203,213,225,0.8)]"; // Silver
    return "text-orange-300"; // Bronze
  };

  const getVIPTierName = (wagered: number) => {
    if (wagered >= 100000000) return "Diamond";
    if (wagered >= 25000000) return "Platinum";
    if (wagered >= 5000000) return "Gold";
    if (wagered >= 1000000) return "Silver";
    return "Bronze";
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#1f222b] border-y border-l border-[#2a2d3a] p-3 rounded-l-xl z-50 text-[#7a819c] hover:text-white transition-colors shadow-[-5px_0_15px_rgba(0,0,0,0.5)]"
      >
        {isOpen ? <ChevronRight size={20} /> : <MessageSquare size={20} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-[#15181f] border-l border-[#2a2d3a] shadow-[-10px_0_30px_rgba(0,0,0,0.8)] z-40 flex flex-col"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-[#2a2d3a] bg-[#1f222b] relative overflow-hidden">
              <div className="flex items-center gap-2 text-white font-bold relative z-10">
                <MessageSquare size={18} className="text-accent-blue" />
                Global Chat
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#7a819c] hover:text-white relative z-10">
                <ChevronRight size={20} />
              </button>

              {/* Rain Animation Overlay */}
              <AnimatePresence>
                {activeRain && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="absolute top-16 left-0 right-0 z-20 bg-gradient-to-r from-blue-600/90 to-blue-400/90 border-b border-blue-400/50 shadow-[0_10px_20px_rgba(59,130,246,0.3)] backdrop-blur-md overflow-hidden"
                  >
                    <div className="p-3 flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Droplet size={18} className="animate-bounce text-blue-200" />
                        RAIN DROP: {(activeRain.amount / 100).toFixed(2)} DLs
                      </div>
                      <div className="flex w-full items-center justify-between text-xs font-semibold text-blue-100 px-2">
                        <span>{activeRain.joinedCount} Joined</span>
                        <span>{rainTimeLeft}s Left</span>
                      </div>
                      <button
                        onClick={() => {
                          if (!user) return openAuthModal("login");
                          if (!activeRain.hasJoined) {
                            socketRef.current.emit("join_rain", { userId: user.id });
                            setActiveRain({ ...activeRain, hasJoined: true });
                          }
                        }}
                        disabled={activeRain.hasJoined}
                        className={`w-full py-2 rounded font-bold text-xs shadow-lg transition-all ${
                          activeRain.hasJoined 
                            ? "bg-black/40 text-blue-200 cursor-not-allowed" 
                            : "bg-white text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        {activeRain.hasJoined ? "JOINED" : "JOIN RAIN"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-[#7a819c] text-sm mt-10">No messages yet.</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="text-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-baseline gap-2 mb-1">
                      {msg.user.username === 'System' ? (
                        <span className="font-black text-xs uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                          SYSTEM
                        </span>
                      ) : (
                        <span className={`font-black text-xs uppercase px-1.5 py-0.5 rounded bg-black/30 ${getVIPColor(msg.user.totalWagered)}`}>
                          {getVIPTierName(msg.user.totalWagered)}
                        </span>
                      )}
                      <span className={`font-bold ${msg.user.username === 'System' ? 'text-blue-400' : 'text-white'}`}>
                        {msg.user.username}
                      </span>
                      <span className="text-xs text-[#7a819c]">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`${msg.user.username === 'System' ? 'text-blue-300 font-medium' : 'text-[#a0a5b5]'} leading-relaxed break-words pl-1`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[#2a2d3a] bg-[#1f222b]">
              <form onSubmit={handleSend} className="relative">
                <input
                  type="text"
                  placeholder={user ? "Say something..." : "Login to chat"}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!user || isSending}
                  className="w-full bg-[#15181f] border border-[#2a2d3a] rounded-lg pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-accent-blue disabled:opacity-50 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!user || isSending || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-accent-blue hover:text-blue-400 disabled:opacity-50 transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
