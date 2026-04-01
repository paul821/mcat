"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getConsentStatus, setConsent } from "@/lib/storage";

export default function StorageConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (getConsentStatus() === "unset") {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <div className="bg-card border border-card-border rounded-2xl p-5 shadow-2xl">
            <h3 className="font-semibold text-sm mb-2">Save your progress?</h3>
            <p className="text-muted text-xs leading-relaxed mb-4">
              We can store your drill stats and mock test scores locally on this
              device. This uses your browser&apos;s localStorage and may take up
              space over time (typically under 1 MB). No data leaves your
              computer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConsent(true);
                  setShow(false);
                }}
                className="flex-1 bg-accent text-white text-sm font-medium py-2 rounded-lg hover:opacity-90"
              >
                Save locally
              </button>
              <button
                onClick={() => {
                  setConsent(false);
                  setShow(false);
                }}
                className="flex-1 bg-surface text-foreground text-sm font-medium py-2 rounded-lg hover:opacity-80"
              >
                No thanks
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
