import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTransport } from "./hooks/useTransport";
import { Library } from "./components/Library";
import { PlayerView } from "./components/PlayerView";
import type { Song } from "./data/types";

export default function App() {
  const t = useTransport();
  const [screen, setScreen] = useState<"library" | "player">("library");

  const handleSelect = useCallback(
    (song: Song) => {
      t.loadSong(song);
      setScreen("player");
    },
    [t]
  );

  const handleBack = useCallback(() => {
    t.pause();
    setScreen("library");
  }, [t]);

  return (
    <div
      className="flex min-h-screen items-stretch justify-center sm:items-center sm:py-8"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(215,181,109,0.08), transparent), var(--bg)",
      }}
    >
      <div
        className="relative flex h-screen w-full max-w-[480px] flex-col overflow-hidden sm:h-[860px] sm:rounded-[32px] sm:shadow-2xl"
        style={{ border: "1px solid var(--hairline)" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {screen === "library" ? (
            <motion.div
              key="library"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Library onSelect={handleSelect} />
            </motion.div>
          ) : (
            <motion.div
              key="player"
              className="absolute inset-0"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <PlayerView t={t} onBack={handleBack} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
