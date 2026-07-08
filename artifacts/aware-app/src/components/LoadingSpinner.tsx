import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

const SIZE = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
const BORDER = { sm: 'border-2', md: 'border-2', lg: 'border-[3px]' };

export function LoadingSpinner({ label = 'Loading…', size = 'md', fullHeight = true }: LoadingSpinnerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className={`flex items-center justify-center ${fullHeight ? 'h-64' : ''}`}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className={`${SIZE[size]} ${BORDER[size]} border-gcp-blue/30 border-t-gcp-blue rounded-full animate-spin`}
        />
        {label && (
          <span className="text-sm text-gcp-text-muted font-medium">{label}</span>
        )}
      </div>
    </motion.div>
  );
}
