"use client";

// A photo, as big as the screen allows. Closes on Escape, on the button, or on the dark
// around it; puts focus back where it was. Rendered into <body>, so a transformed parent
// (the walk's sliding row) can't trap it.

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type LightboxPhoto = { src: string; alt: string; by: string; caption?: string };

export function Lightbox({ photo, onClose }: { photo: LightboxPhoto | null; onClose: () => void }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the portal target exists only in the browser
  useEffect(() => setHost(document.body), []);
  useEffect(() => {
    if (!photo) return;
    const back = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const was = root.style.overflow;
    root.style.overflow = "hidden";
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      root.style.overflow = was;
      back?.focus?.();
    };
  }, [photo, onClose]);
  if (!host) return null;
  return createPortal(
    <AnimatePresence>
      {photo ? (
        <motion.div
          key={photo.src}
          role="dialog"
          aria-modal="true"
          aria-label={photo.caption ?? photo.alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#0c1a13]/92 p-4 backdrop-blur-sm sm:p-8"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-linen px-4 py-2 text-[13px] font-bold text-ink shadow-lg sm:right-6 sm:top-6"
          >
            Close <span aria-hidden>×</span>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt={photo.alt}
            decoding="async"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[calc(100svh-150px)] w-auto max-w-full rounded-2xl object-contain shadow-[0_30px_90px_-30px_rgba(0,0,0,0.9)]"
          />
          <p onClick={(e) => e.stopPropagation()} className="mt-4 max-w-[760px] text-center text-[13px] leading-relaxed text-linen/80">
            {photo.caption ? <strong className="font-semibold text-linen">{photo.caption}. </strong> : null}
            {photo.alt}. <span className="text-linen/55">Photo: {photo.by}, via Pexels.</span>
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    host,
  );
}
