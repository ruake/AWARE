import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  fullHeight?: boolean;
  glow?: boolean;
}

const SIZE = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
const BORDER = { sm: "border-2", md: "border-2", lg: "border-[3px]" };

export function LoadingSpinner({
  label = "Loading…",
  size = "md",
  fullHeight = true,
  glow = false,
}: LoadingSpinnerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className={`flex items-center justify-center ${fullHeight ? "h-64" : ""}`}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="proof-glass-card-enhanced flex flex-col items-center gap-3 px-6 py-5"
      >
        <div
          className={`${SIZE[size]} ${BORDER[size]} ${glow ? "proof-glow-md" : ""} rounded-full`}
          style={{
            borderColor: "var(--proof-blue-glow)",
            borderTopColor: "var(--proof-blue)",
            animation: "spin 1s linear infinite",
          }}
        />
        {label && (
          <span
            className="text-sm font-medium"
            style={{
              color: "var(--proof-text-secondary)",
              letterSpacing: "0.02em",
            }}
          >
            {label}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
