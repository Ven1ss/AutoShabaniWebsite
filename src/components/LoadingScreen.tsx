"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function LoadingScreen() {
  const { t } = useLanguage();
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black-deep"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col items-center gap-8">
        <motion.div
          className="h-12 w-px bg-gradient-to-b from-transparent via-accent-red to-transparent"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ transformOrigin: "center" }}
        />
        <motion.span
          className="text-sm tracking-[0.4em] uppercase text-white/60"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {t.brandName}
        </motion.span>
        <motion.div
          className="h-px w-24 bg-white/20"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{ transformOrigin: "center" }}
        />
      </div>
    </motion.div>
  );
}
