"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export function AnimatedNumber({ value }: { value: number }) {
  const [isClient, setIsClient] = useState(false);
  const spring = useSpring(value, { mass: 1, stiffness: 50, damping: 15 });
  const displayValue = useTransform(spring, (current) => (current / 100).toFixed(2));

  useEffect(() => {
    setIsClient(true);
    spring.set(value);
  }, [value, spring]);

  if (!isClient) return <span>{(value / 100).toFixed(2)}</span>;

  return <motion.span>{displayValue}</motion.span>;
}
