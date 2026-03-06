"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="relative border-t border-white/5 bg-black-deep py-12 md:py-16">
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm tracking-[0.2em] uppercase text-white/50"
          >
            {t.brandName}
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm text-white/40"
          >
            © {new Date().getFullYear()} {t.brandName}. {t.footerRights}
          </motion.p>
        </div>
      </div>
    </footer>
  );
}
