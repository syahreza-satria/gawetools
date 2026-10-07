"use client";

import { motion, MotionConfig, type Variants } from "motion/react";
import type { ReactNode } from "react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const stagger = (delay = 0.07, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay, delayChildren } },
});

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 28 } },
};

/** Respects the OS "reduce motion" setting for every animation below it. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Fades & slides its children in when scrolled into view (once). */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
