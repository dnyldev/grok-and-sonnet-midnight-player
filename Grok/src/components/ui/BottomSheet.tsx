import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EASE_DRAWER } from "@/lib/ease";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title?: string;
  description?: string;
  nested?: boolean;
  height?: "auto" | "full";
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  nested,
  height = "auto",
  className,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.button
            type="button"
            aria-label="Dismiss"
            className="absolute inset-0"
            style={{ background: nested ? "transparent" : "var(--scrim)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_DRAWER }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: height === "full" ? "8%" : "40%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: height === "full" ? "10%" : "28%", opacity: 0 }}
            transition={{ duration: 0.42, ease: EASE_DRAWER }}
            className={cn(
              "relative z-10 flex w-full flex-col overflow-hidden",
              height === "full"
                ? "h-[100dvh] max-h-[100dvh] sm:h-[min(920px,100dvh)] sm:max-w-[430px] sm:rounded-[28px] sm:border sm:border-[var(--hairline)]"
                : "max-h-[min(82dvh,720px)] rounded-t-[28px] sm:max-w-[430px] sm:rounded-[28px] sm:border sm:border-[var(--hairline)]",
              className,
            )}
            style={{
              background: "var(--sheet)",
              boxShadow: "var(--shadow-sheet)",
              paddingBottom: height === "full" ? 0 : "var(--safe-b)",
            }}
          >
            {height === "auto" ? (
              <div className="flex justify-center pt-2.5 pb-1">
                <span className="h-1 w-10 rounded-full" style={{ background: "var(--fill-strong)" }} />
              </div>
            ) : null}
            {title ? (
              <header className="px-5 pb-3 pt-2">
                <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
                {description ? <p className="mt-0.5 text-[13px] text-[var(--fg-3)]">{description}</p> : null}
              </header>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
