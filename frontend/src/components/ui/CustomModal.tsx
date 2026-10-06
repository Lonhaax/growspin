import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ModalType = 'alert' | 'confirm' | 'success' | 'error' | 'prompt';

export interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: ModalType;
  defaultValue?: string;
  onConfirm?: () => void;
  onPromptSubmit?: (val: string) => void;
  onCancel?: () => void;
}

interface CustomModalProps {
  config: ModalConfig;
  setConfig: React.Dispatch<React.SetStateAction<ModalConfig>>;
}

export function CustomModal({ config, setConfig }: CustomModalProps) {
  const [promptVal, setPromptVal] = useState("");

  useEffect(() => {
    if (config.isOpen && config.type === 'prompt') {
      setPromptVal(config.defaultValue || "");
    }
  }, [config.isOpen, config.type, config.defaultValue]);

  useEffect(() => {
    if (config.isOpen && ['alert', 'success', 'error'].includes(config.type)) {
      const timer = setTimeout(() => {
        setConfig(prev => ({ ...prev, isOpen: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [config.isOpen, config.type, setConfig]);

  const handleClose = () => {
    setConfig(prev => ({ ...prev, isOpen: false }));
    if (config.onCancel) config.onCancel();
  };

  const handleConfirm = () => {
    setConfig(prev => ({ ...prev, isOpen: false }));
    if (config.type === 'prompt' && config.onPromptSubmit) {
      config.onPromptSubmit(promptVal);
    } else if (config.onConfirm) {
      config.onConfirm();
    }
  };

  const renderIcon = () => {
    switch (config.type) {
      case 'confirm':
      case 'alert':
        return <AlertTriangle className="text-yellow-500" />;
      case 'success':
        return <CheckCircle className="text-emerald-500" />;
      case 'error':
        return <XCircle className="text-red-500" />;
      case 'prompt':
        return <Info className="text-indigo-500" />;
      default:
        return <Info className="text-indigo-500" />;
    }
  };

  const isToast = ['alert', 'success', 'error'].includes(config.type);

  return (
    <AnimatePresence>
      {config.isOpen && (
        isToast ? (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 right-6 z-[200] flex flex-col pointer-events-none"
          >
            <div className="bg-[#13161f] border border-[#202535] p-4 rounded-xl shadow-2xl max-w-sm w-full flex items-start gap-4 pointer-events-auto">
              <div className="mt-0.5">{renderIcon()}</div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-white">{config.title}</h3>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed whitespace-pre-wrap">{config.message}</p>
              </div>
              <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
                <XCircle size={16} />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#13161f] border border-[#202535] p-6 rounded-2xl shadow-2xl max-w-sm w-full"
            >
              <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                {renderIcon()}
                {config.title}
              </h3>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed whitespace-pre-wrap">
                {config.message}
              </p>

              {config.type === 'prompt' && (
                <input 
                  type="text" 
                  value={promptVal}
                  onChange={e => setPromptVal(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#202535] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 mb-6 font-bold"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
                />
              )}

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-[#202535] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirm}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors shadow-lg bg-indigo-500 hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )
      )}
    </AnimatePresence>
  );
}

// Hook for easier usage
export function useCustomModal() {
  const [modalConfig, setModalConfig] = React.useState<ModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  const showAlert = (message: string, title = "Notice") => {
    setModalConfig({ isOpen: true, title, message, type: "alert" });
  };
  
  const showSuccess = (message: string, title = "Success") => {
    setModalConfig({ isOpen: true, title, message, type: "success" });
  };
  
  const showError = (message: string, title = "Error") => {
    setModalConfig({ isOpen: true, title, message, type: "error" });
  };

  const showConfirm = (message: string, onConfirm: () => void, title = "Confirmation", onCancel?: () => void) => {
    setModalConfig({ isOpen: true, title, message, type: "confirm", onConfirm, onCancel });
  };

  const showPrompt = (message: string, onPromptSubmit: (val: string) => void, defaultValue = "", title = "Input Required", onCancel?: () => void) => {
    setModalConfig({ isOpen: true, title, message, type: "prompt", defaultValue, onPromptSubmit, onCancel });
  };

  return { modalConfig, setModalConfig, showAlert, showSuccess, showError, showConfirm, showPrompt };
}
