import { useCallback, useState } from "react";

export interface Toast {
  id: number;
  message: string;
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  const flash = useCallback((message: string) => {
    const id = Date.now();
    setToast({ id, message });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2200);
  }, []);

  return { toast, flash };
}
