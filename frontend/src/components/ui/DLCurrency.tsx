"use client";
import React, { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface DLCurrencyProps {
  amount: number;
  isRaw?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  iconFirst?: boolean;
  showAmount?: boolean;
}

export function DLCurrency({
  amount,
  isRaw = false,
  size = "sm",
  className = "",
  iconFirst = false,
  showAmount = true,
}: DLCurrencyProps) {
  const value = isRaw ? amount : amount / 100;

  const springValue = useSpring(value, { mass: 1, stiffness: 50, damping: 15 });
  
  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  const displayValue = useTransform(springValue, (current) => {
    return current.toLocaleString(undefined, {
      minimumFractionDigits: current % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    });
  });

  const imgSize =
    size === "xs"
      ? "w-3.5 h-3.5"
      : size === "sm"
      ? "w-4 h-4"
      : size === "md"
      ? "w-5 h-5"
      : size === "lg"
      ? "w-6 h-6"
      : "w-8 h-8";

  const textSize =
    size === "xs"
      ? "text-xs"
      : size === "sm"
      ? "text-sm"
      : size === "md"
      ? "text-base"
      : size === "lg"
      ? "text-xl"
      : "text-2xl";

  const img = (
    <img
      src="/dl.webp"
      alt="DL"
      className={`${imgSize} inline-block shrink-0 object-contain drop-shadow-[0_2px_6px_rgba(6,182,212,0.4)]`}
    />
  );

  return (
    <span className={`inline-flex items-center gap-1 font-bold ${textSize} ${className}`}>
      {iconFirst && img}
      {showAmount && <motion.span>{displayValue}</motion.span>}
      {!iconFirst && img}
    </span>
  );
}
