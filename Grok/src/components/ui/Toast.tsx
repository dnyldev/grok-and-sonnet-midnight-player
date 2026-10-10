import { AnimatePresence, motion } from "motion/react";
import { SPRING_PANEL } from "@/lib/ease";
import type { Toast as ToastData } from "@/hooks/useToast";

export function Toast({ toast }: { toast: ToastData | null }) {
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={SPRING_PANEL}
          className="pointer-events-none fixed inset-x-0 bottom-[max(28px,calc(var(--safe-b)+16px))] z-[80] flex justify-center px-4"
        >
          <div
            className="rounded-full px-4 py-2 text-[13px] font-medium tracking-[-0.01em] text-[var(--fg)]"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-float)", border: "0.5px solid var(--hairline)" }}
          >
            {toast.message}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
