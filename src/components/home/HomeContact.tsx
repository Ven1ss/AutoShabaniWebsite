"use client";

import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import CallbackRequestForm from "@/components/CallbackRequestForm";
import { useLanguage } from "@/context/LanguageContext";

const MAP_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2934.081900400838!2d21.171445600000002!3d42.6596198!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x13549fc9a27d8a35%3A0x3d02c0ade72a7b4e!2sAuto%20Shabani!5e0!3m2!1sen!2s!4v1772581999610!5m2!1sen!2s";

export default function HomeContact() {
  const { t } = useLanguage();

  return (
    <section id="contact" className="surface-dark section-pad">
      <div className="container-as">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <FadeIn>
            <SectionHeading
              eyebrow={t.contactHeading}
              title={t.contactTitle}
              align="left"
              tone="dark"
              className="mb-8 sm:mb-10"
            />

            <div className="space-y-6 sm:space-y-7">
              <div>
                <p className="text-sm text-white/45 mb-2">{t.contactPhone}</p>
                <div className="flex flex-col">
                  <a
                    href="tel:+38349238509"
                    className="inline-flex min-h-12 items-center text-lg text-white hover:text-accent transition-colors"
                  >
                    +383 49 238 509
                  </a>
                  <a
                    href="tel:+38349848760"
                    className="inline-flex min-h-12 items-center text-lg text-white hover:text-accent transition-colors"
                  >
                    +383 49 848 760
                  </a>
                </div>
              </div>

              <div>
                <p className="text-sm text-white/45 mb-2">{t.contactEmail}</p>
                <a
                  href="mailto:auto.shabaniii@gmail.com"
                  className="inline-flex min-h-12 items-center break-all text-lg text-white hover:text-accent transition-colors"
                >
                  auto.shabaniii@gmail.com
                </a>
              </div>

              <div>
                <p className="text-sm text-white/45 mb-2">{t.contactHours}</p>
                <p className="text-lg text-white/85">{t.contactHoursValue}</p>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/5 p-4 sm:p-5">
                <CallbackRequestForm tone="dark" />
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="relative w-full aspect-[4/3] min-h-[220px] sm:min-h-[280px] lg:min-h-[420px] overflow-hidden rounded-xl">
              <iframe
                src={MAP_EMBED}
                className="absolute inset-0 h-full w-full grayscale-[30%]"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="AUTO SHABANI — Google Maps"
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
