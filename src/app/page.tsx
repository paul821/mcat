"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-7xl sm:text-9xl font-bold tracking-tighter mb-2">
          <span className="bg-gradient-to-br from-foreground via-foreground to-muted bg-clip-text text-transparent">
            MCAT
          </span>
        </h1>
        <p className="text-muted text-sm sm:text-base tracking-widest uppercase mb-16">
          Practice & Prepare
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
      >
        <Link href="/drill" className="flex-1">
          <div className="group relative overflow-hidden rounded-2xl border border-card-border bg-card p-6 text-center hover:glow-border cursor-pointer">
            <div className="relative z-10">
              <div className="text-2xl mb-2 font-mono">01</div>
              <h2 className="text-lg font-semibold mb-1">Drill Mode</h2>
              <p className="text-muted text-xs">
                Untimed practice by topic
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </Link>

        <Link href="/mock" className="flex-1">
          <div className="group relative overflow-hidden rounded-2xl border border-card-border bg-card p-6 text-center hover:glow-border cursor-pointer">
            <div className="relative z-10">
              <div className="text-2xl mb-2 font-mono">02</div>
              <h2 className="text-lg font-semibold mb-1">Mock Exam</h2>
              <p className="text-muted text-xs">
                Timed simulation with scoring
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </Link>
      </motion.div>
    </main>
  );
}
