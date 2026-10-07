"use client";

import { motion } from "motion/react";
import { EASE_OUT } from "@/components/motion";

// A template re-mounts on every navigation, so each page fades & slides in.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="flex flex-col flex-1"
    >
      {children}
    </motion.div>
  );
}
