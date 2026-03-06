"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function Contact() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="contact"
      ref={ref}
      className="relative py-24 md:py-32 bg-black-deep"
    >
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            visible: {
              transition: { staggerChildren: 0.08, delayChildren: 0.1 },
            },
            hidden: {},
          }}
        >
          <motion.p
            className="text-sm tracking-[0.3em] uppercase text-white/50 mb-8"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.contactHeading}
          </motion.p>
          <motion.h2
            className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-16"
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.contactTitle}
          </motion.h2>

          <div className="space-y-8">
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-xs tracking-widest uppercase text-white/40 mb-2">
                {t.contactPhone}
              </p>
              <div className="flex flex-col gap-1">
                <a
                  href="tel:+38349238509"
                  className="text-lg md:text-xl text-white/80 hover:text-accent-red transition-colors duration-300"
                >
                  +383 49 238 509
                </a>
                <a
                  href="tel:+38349848760"
                  className="text-lg md:text-xl text-white/80 hover:text-accent-red transition-colors duration-300"
                >
                  +383 49 848 760
                </a>
              </div>
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-xs tracking-widest uppercase text-white/40 mb-2">
                {t.contactEmail}
              </p>
              <a
                href="mailto:auto.shabaniii@gmail.com"
                className="text-lg md:text-xl text-white/80 hover:text-accent-red transition-colors duration-300"
              >
                auto.shabaniii@gmail.com
              </a>
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-xs tracking-widest uppercase text-white/40 mb-2">
                {t.contactInstagram}
              </p>
              <a
                href="https://www.instagram.com/autopjese_shabani?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-lg md:text-xl text-white/80 hover:text-accent-red transition-colors duration-300"
              >
                <span>{t.brandName}</span>
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-xs tracking-widest uppercase text-white/40 mb-2">
                {t.contactLocation}
              </p>
              <a
                href="https://share.google/RHRSbX7Vfc9XK92BS"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg md:text-xl text-white/80 hover:text-accent-red transition-colors duration-300 inline-block"
              >
                {t.contactMapLink}
              </a>
            </motion.div>

            <motion.div
              className="pt-4"
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="glass rounded-xl border border-white/10 overflow-hidden">
                <div className="relative w-full aspect-[16/10]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2934.081900400838!2d21.171445600000002!3d42.6596198!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x13549fc9a27d8a35%3A0x3d02c0ade72a7b4e!2sAuto%20Shabani!5e0!3m2!1sen!2s!4v1772581999610!5m2!1sen!2s"
                    className="absolute inset-0 h-full w-full"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="AUTO SHABANI — Google Maps"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
