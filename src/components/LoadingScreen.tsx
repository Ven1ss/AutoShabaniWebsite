"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function LoadingScreen() {
  const { t } = useLanguage();
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-surface"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col items-center gap-6">
        <motion.div
          className="h-10 w-px bg-gradient-to-b from-transparent via-signal to-transparent"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          style={{ transformOrigin: "center" }}
        />
        <motion.span
          className="font-ethnocentric text-sm tracking-brand uppercase text-ink"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
        >
          {t.brandName}
        </motion.span>
        <motion.div
          className="h-px w-20 bg-steel-light"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          style={{ transformOrigin: "center" }}
        />
      </div>
    </motion.div>
  );
}
