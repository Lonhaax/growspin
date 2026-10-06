import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

export type ModalType = 'alert' | 'confirm' | 'success' | 'error';

export interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: ModalType;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface CustomModalProps {
  config: ModalConfig;
  setConfig: React.Dispatch<React.SetStateAction<ModalConfig>>;
}

export function CustomModal({ config, setConfig }: CustomModalProps) {
  if (!config.isOpen) return null;

  const handleClose = () => {
    setConfig(prev => ({ ...prev, isOpen: false }));
    if (config.onCancel) config.onCancel();
  };

  const handleConfirm = () => {
    setConfig(prev => ({ ...prev, isOpen: false }));
    if (config.onConfirm) config.onConfirm();
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
      default:
        return <Info className="text-indigo-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13161f] border border-[#202535] p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
          {renderIcon()}
          {config.title}
        </h3>
        <p className="text-gray-300 text-sm mb-6 leading-relaxed whitespace-pre-wrap">
          {config.message}
        </p>
        <div className="flex gap-3 justify-end">
          {config.type === 'confirm' && (
            <button 
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-[#202535] transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors shadow-lg ${
              config.type === 'error' ? 'bg-red-500 hover:bg-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
              config.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' :
              'bg-indigo-500 hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
            }`}
          >
            {config.type === 'confirm' ? 'Confirm' : 'OK'}
          </button>
        </div>
      </div>
    </div>
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

  return { modalConfig, setModalConfig, showAlert, showSuccess, showError, showConfirm };
}
