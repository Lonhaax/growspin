"use client";

import React, { createContext, useContext, useCallback, useState } from 'react';
import { useAuth } from './AuthContext';
import { notification } from 'antd';

const WalletContext = createContext<any>(null);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, refreshUser } = useAuth();
  const [api, contextHolder] = notification.useNotification();
  const [optimisticDeductions, setOptimisticDeductions] = useState(0);

  const baseBalance = user ? user.mockBalance / 100 : 0;
  const balance = Math.max(0, baseBalance - optimisticDeductions); // Ensure it doesn't go below 0 visually

  // Optimistic balance deduction for instant UI feedback
  const placeBet = useCallback((amount: number) => {
    if (amount > balance) return false;
    setOptimisticDeductions(prev => prev + amount);
    return true;
  }, [balance]);

  // When game finishes and we sync, we can clear our local optimistic deductions
  const refreshUserWithSync = useCallback(async () => {
    await refreshUser();
    setOptimisticDeductions(0);
  }, [refreshUser]);

  const addWinnings = useCallback(async () => {
    await refreshUserWithSync();
  }, [refreshUserWithSync]);

  const showToast = useCallback((type: string, title: string, message?: string, duration = 3000) => {
    const color = type === 'win' ? '#3b82f6' : type === 'error' || type === 'loss' ? '#ff4d4f' : type === 'bet' ? '#1677ff' : '#faad14';
    api.open({
      message: title,
      description: message || '',
      duration: duration / 1000,
      style: {
        background: '#1a2535',
        border: `1px solid ${color}33`,
        borderLeft: `3px solid ${color}`,
        color: '#fff',
        borderRadius: 10,
      },
    });
  }, [api]);

  return (
    <WalletContext.Provider value={{ balance, placeBet, addWinnings, showToast, refreshUser: refreshUserWithSync }}>
      {contextHolder}
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
