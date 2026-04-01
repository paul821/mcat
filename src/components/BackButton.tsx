"use client";

import { motion } from "framer-motion";

export default function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className="fixed top-6 left-6 z-40 flex items-center gap-2 text-muted hover:text-foreground text-sm font-medium group"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="group-hover:-translate-x-0.5 transition-transform"
      >
        <path
          d="M10 12L6 8L10 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Back
    </motion.button>
  );
}
