"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Minus, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import NyaAIChat from "./NyaAIChat";

const DOCKED_STORAGE_KEY = "nyaai:widget-docked";

const WIDGET_PROMPTS = [
  "What hearings do I have tomorrow?",
  "Which cases need my attention?",
  "Which documents are pending review?",
  "Give me my daily briefing",
];

/**
 * Floating NyaAI launcher — a round button fixed to the bottom-right of every
 * dashboard page that opens a chat popup. The popup stays mounted after first
 * open so the conversation survives closing and reopening.
 */
export default function NyaAIWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  // Docked = parked as a slim tab on the right edge, so the round launcher
  // stops covering buttons in the bottom-right corner of a page.
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    try {
      setDocked(localStorage.getItem(DOCKED_STORAGE_KEY) === "1");
    } catch {
      // storage unavailable — keep the launcher visible
    }
  }, []);

  const persistDocked = (next) => {
    setDocked(next);
    try {
      localStorage.setItem(DOCKED_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore: docking is a convenience, not state we must keep
    }
  };

  const dockToSide = () => {
    setOpen(false);
    persistDocked(true);
  };

  // The full-page assistant already lives here; no widget on top of it.
  if (pathname?.startsWith("/dashboard/nyaai")) return null;

  const toggle = () => {
    setOpen((v) => !v);
    setEverOpened(true);
  };

  return (
    <>
      {/* popup panel — kept mounted after first open to preserve the thread */}
      {everOpened && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-end justify-end p-4 sm:inset-auto sm:bottom-24 sm:right-6 sm:p-0",
            !open && "pointer-events-none"
          )}
        >
          {/* mobile scrim */}
          <div
            onClick={() => setOpen(false)}
            className={cn(
              "absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity sm:hidden",
              open ? "opacity-100" : "opacity-0"
            )}
          />
          <motion.div
            initial={false}
            animate={
              open
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 16, scale: 0.97 }
            }
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[calc(100dvh-6rem)] w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl sm:h-[34rem] sm:w-[24rem]"
          >
            <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-1 ring-border/60">
                <img
                  src="/nyaai-avatar.png"
                  alt="NyaAI"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </span>
              <div className="flex-1 leading-tight">
                <p className="text-sm font-semibold text-foreground">NyaAI</p>
                <p className="text-xs text-muted-foreground">
                  Grounded in your workspace
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push("/dashboard/nyaai");
                }}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Open full view"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Minimize"
                aria-label="Minimize chat"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={dockToSide}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Close and move out of the way"
                aria-label="Close and dock to the side"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NyaAIChat
              suggestedPrompts={WIDGET_PROMPTS}
              className="min-h-0 flex-1"
            />
          </motion.div>
        </div>
      )}

      {/* slim edge tab once the launcher is docked out of the way */}
      {docked && !open && (
        <button
          type="button"
          onClick={() => {
            persistDocked(false);
            setEverOpened(true);
            setOpen(true);
          }}
          className="fixed right-0 top-1/2 z-50 flex -translate-y-1/2 items-center gap-1 rounded-l-lg bg-[#13345c] py-3 pl-1.5 pr-1 text-white shadow-lg ring-1 ring-white/30 transition-colors hover:bg-[#0f2747]"
          title="Show NyaAI"
          aria-label="Show NyaAI"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-[10px] font-semibold tracking-widest [writing-mode:vertical-rl]">
            NYAAI
          </span>
        </button>
      )}

      {/* floating round launcher */}
      {!docked && (
      <motion.button
        type="button"
        onClick={toggle}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#13345c] to-[#0f2747] text-white shadow-lg shadow-primary/25 ring-2 ring-white/70 transition-shadow hover:shadow-xl dark:ring-border"
        title={open ? "Close NyaAI" : "Ask NyaAI"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="flex h-full w-full items-center justify-center overflow-hidden rounded-full"
          >
            {open ? (
              <X className="h-6 w-6" />
            ) : (
              <img
                src="/nyaai-avatar.png"
                alt="NyaAI"
                className="h-full w-full object-cover"
                draggable={false}
              />
            )}
          </motion.span>
        </AnimatePresence>
        {!open && (
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/20 [animation-duration:3s]" />
        )}
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            dockToSide();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              dockToSide();
            }
          }}
          className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow transition-colors hover:text-foreground"
          title="Move NyaAI out of the way"
          aria-label="Move NyaAI out of the way"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </motion.button>
      )}
    </>
  );
}
