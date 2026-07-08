import type { Variants, Transition } from "framer-motion";

export const SPRING: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

export const EASE_OUT: Transition = {
  duration: 0.22,
  ease: [0.25, 0.46, 0.45, 0.94],
};

export const EASE_IN_OUT: Transition = {
  duration: 0.28,
  ease: [0.4, 0, 0.2, 1],
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: EASE_OUT },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: EASE_OUT },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: EASE_OUT },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: EASE_OUT },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

export const dropDown: Variants = {
  hidden: { opacity: 0, y: -6, scaleY: 0.95 },
  visible: { opacity: 1, y: 0, scaleY: 1, transition: EASE_OUT },
  exit: { opacity: 0, y: -4, scaleY: 0.96, transition: { duration: 0.14 } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const fastStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
};

export const slowStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

export const collapseHeight: Variants = {
  hidden: { height: 0, opacity: 0, overflow: "hidden" },
  visible: {
    height: "auto",
    opacity: 1,
    overflow: "hidden",
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

export const PRESS_SCALE = { scale: 0.98 };

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};
