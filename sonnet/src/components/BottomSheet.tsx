import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center">
          <motion.div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.55)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-[420px] rounded-t-[28px] px-5 pb-7 pt-3"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--hairline)",
              borderBottom: "none",
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) onClose();
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full" style={{ background: "var(--hairline-2)" }} />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
              <button
                onClick={onClose}
                className="focus-ring rounded-full px-2.5 py-1 text-[12.5px]"
                style={{ color: "var(--fg-3)", background: "var(--fill)" }}
              >
                Done
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
