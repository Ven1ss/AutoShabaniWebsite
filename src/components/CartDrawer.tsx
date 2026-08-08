"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  CONTACT,
  buildCartEnquireMessage,
  mailtoCartEnquireUrl,
  whatsappEnquireUrl,
} from "@/lib/contact";
import {
  formatPrice,
  getLocalized,
  resolveProductImageUrl,
} from "@/lib/products";

export default function CartDrawer() {
  const { t, locale } = useLanguage();
  const {
    items,
    itemCount,
    subtotal,
    isOpen,
    closeCart,
    removeItem,
    setQuantity,
    clearCart,
  } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  const message = buildCartEnquireMessage({
    locale,
    items: items.map((item) => ({
      sku: item.sku,
      name: getLocalized(item.name, locale),
      quantity: item.quantity,
      code: item.code || undefined,
    })),
  });

  const whatsappHref = whatsappEnquireUrl(message);
  const mailtoHref = mailtoCartEnquireUrl({
    itemCount,
    message,
    locale,
  });
  const subtotalLabel = formatPrice(subtotal, locale);

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label={t.cartClose}
            className="fixed inset-0 z-[60] bg-as-dark/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-steel-light bg-as-white shadow-card-hover"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <header className="flex items-center justify-between gap-3 border-b border-steel-light px-4 py-4 sm:px-5 pt-[max(1rem,env(safe-area-inset-top))]">
              <div>
                <h2
                  id="cart-drawer-title"
                  className="text-lg font-semibold text-as-dark tracking-tight"
                >
                  {t.cartTitle}
                </h2>
                <p className="text-caption text-as-gray tabular-nums">
                  {itemCount}{" "}
                  {itemCount === 1 ? t.cartItem : t.cartItems}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-as-secondary hover:text-as-dark transition-colors"
                aria-label={t.cartClose}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-body text-as-dark">{t.cartEmpty}</p>
                <p className="text-sm text-as-gray max-w-xs">{t.cartEmptyHint}</p>
                <Link
                  href="/katalogu"
                  onClick={closeCart}
                  className="mt-2 inline-flex min-h-12 items-center justify-center rounded-control bg-accent px-6 text-button text-white hover:bg-accent-deep transition-colors"
                >
                  {t.cartBrowse}
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                  <ul className="space-y-3">
                    {items.map((item) => {
                      const name = getLocalized(item.name, locale);
                      const imageSrc = resolveProductImageUrl(item.image);
                      const linePrice = formatPrice(
                        item.sellingPrice === null
                          ? null
                          : item.sellingPrice * item.quantity,
                        locale
                      );
                      return (
                        <li
                          key={item.slug}
                          className="flex gap-3 border border-steel-light bg-as-snow/60 p-3"
                        >
                          <Link
                            href={`/katalogu/${item.slug}`}
                            onClick={closeCart}
                            className="relative h-20 w-20 shrink-0 overflow-hidden border border-steel-light bg-as-white"
                          >
                            {imageSrc ? (
                              <Image
                                src={imageSrc}
                                alt=""
                                fill
                                sizes="80px"
                                className="object-contain p-2"
                              />
                            ) : (
                              <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-as-gray">
                                {item.sku}
                              </span>
                            )}
                          </Link>
                          <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                {item.brand ? (
                                  <p className="text-[10px] uppercase tracking-wider text-as-gray truncate">
                                    {item.brand}
                                  </p>
                                ) : null}
                                <Link
                                  href={`/katalogu/${item.slug}`}
                                  onClick={closeCart}
                                  className="text-sm font-medium text-as-dark leading-snug line-clamp-2 hover:text-accent transition-colors"
                                >
                                  {name}
                                </Link>
                                <p className="text-caption text-as-gray truncate">
                                  {t.catalogueSku} {item.sku}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(item.slug)}
                                className="shrink-0 text-caption text-as-gray hover:text-accent transition-colors"
                              >
                                {t.cartRemove}
                              </button>
                            </div>
                            <div className="mt-auto flex items-center justify-between gap-2">
                              <div className="inline-flex items-center border border-steel-light bg-as-white">
                                <button
                                  type="button"
                                  aria-label="−"
                                  className="min-h-9 min-w-9 text-as-dark hover:bg-as-mist transition-colors"
                                  onClick={() =>
                                    setQuantity(item.slug, item.quantity - 1)
                                  }
                                >
                                  −
                                </button>
                                <span className="min-w-8 text-center text-sm tabular-nums text-as-dark">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  aria-label="+"
                                  className="min-h-9 min-w-9 text-as-dark hover:bg-as-mist transition-colors"
                                  onClick={() =>
                                    setQuantity(item.slug, item.quantity + 1)
                                  }
                                >
                                  +
                                </button>
                              </div>
                              <p className="text-sm font-semibold text-accent tabular-nums">
                                {linePrice ?? t.cataloguePriceOnRequest}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="mt-4 text-caption text-as-gray hover:text-accent transition-colors"
                  >
                    {t.cartClear}
                  </button>
                </div>

                <footer className="border-t border-steel-light bg-as-snow px-4 py-4 sm:px-5 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-4">
                  {subtotalLabel ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-as-secondary">
                        {t.cartSubtotal}
                      </span>
                      <span className="text-price text-as-dark tabular-nums">
                        {subtotalLabel}
                      </span>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-accent font-semibold mb-2">
                      {t.cartCheckoutTitle}
                    </p>
                    <p className="text-sm text-as-secondary mb-3 leading-relaxed">
                      {t.cartCheckoutNote}
                    </p>
                    <div className="flex flex-col gap-2.5">
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-12 w-full items-center justify-center bg-accent hover:bg-accent-deep text-white text-sm font-semibold tracking-wider uppercase px-5 transition-colors"
                      >
                        {t.catalogueWhatsApp}
                      </a>
                      <div className="grid grid-cols-2 gap-2.5">
                        <a
                          href={`tel:${CONTACT.phoneTel[0]}`}
                          className="inline-flex min-h-12 items-center justify-center border border-ink/15 hover:border-ink/40 text-ink text-sm font-semibold tracking-wider uppercase px-4 transition-colors"
                        >
                          {t.catalogueCall}
                        </a>
                        <a
                          href={mailtoHref}
                          className="inline-flex min-h-12 items-center justify-center border border-ink/15 hover:border-ink/40 text-ink text-sm font-semibold tracking-wider uppercase px-4 transition-colors"
                        >
                          {t.catalogueEmail}
                        </a>
                      </div>
                    </div>
                  </div>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
