"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
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
 * Floating NyaAI assistant panel. It can be collapsed into a slim edge tab,
 * and the popup stays mounted after first open so the conversation survives.
 */
export default function NyaAIWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  // Docked = parked as a slim tab on the right edge.
  const [docked, setDocked] = useState(false);

  const [launcherTop, setLauncherTop] = useState(null);
  const launcherRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);

  const clampTop = (top, height) =>
    Math.max(0, Math.min(top, window.innerHeight - height));

  useEffect(() => {
    const keepLauncherVisible = () => {
      const rect = launcherRef.current?.getBoundingClientRect();
      if (!rect) return;
      setLauncherTop((top) => top == null ? null : clampTop(top, rect.height));
    };
    keepLauncherVisible();
    window.addEventListener("resize", keepLauncherVisible);
    return () => window.removeEventListener("resize", keepLauncherVisible);
  }, [docked, open]);

  const startLauncherDrag = (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    suppressClickRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      y: rect.top,
      height: rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveLauncher = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dy = event.clientY - drag.startY;
    if (!suppressClickRef.current && Math.abs(dy) < 5) return;
    suppressClickRef.current = true;
    setLauncherTop(clampTop(drag.y + dy, drag.height));
  };

  const endLauncherDrag = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    try {
      const savedDocked = localStorage.getItem(DOCKED_STORAGE_KEY) === "1";
      setDocked(savedDocked);
      setOpen(!savedDocked);
      setEverOpened(true);
    } catch {
      setOpen(true);
      setEverOpened(true);
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
            onClick={dockToSide}
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
            className="relative h-[calc(100dvh-6rem)] w-full sm:h-[34rem] sm:w-[24rem]"
          >
            <button
              type="button"
              onClick={dockToSide}
              className="absolute left-0 top-1/2 z-10 hidden h-14 w-8 -translate-x-full -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-border/60 bg-card text-muted-foreground shadow-lg transition-colors hover:bg-muted hover:text-foreground sm:flex"
              title="Collapse NyaAI"
              aria-label="Collapse NyaAI"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
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
                  onClick={dockToSide}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Collapse"
                  aria-label="Collapse chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NyaAIChat
                suggestedPrompts={WIDGET_PROMPTS}
                className="min-h-0 flex-1"
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* slim edge tab once the launcher is docked out of the way */}
      {docked && !open && (
        <button
          type="button"
          ref={launcherRef}
          onPointerDown={startLauncherDrag}
          onPointerMove={moveLauncher}
          onPointerUp={endLauncherDrag}
          onPointerCancel={endLauncherDrag}
          onLostPointerCapture={() => { dragRef.current = null; }}
          style={{ right: 0, top: launcherTop ?? "50%", transform: launcherTop == null ? "translateY(-50%)" : undefined }}
          onClick={(event) => {
            if (suppressClickRef.current && event.detail !== 0) {
              suppressClickRef.current = false;
              return;
            }
            persistDocked(false);
            setEverOpened(true);
            setOpen(true);
          }}
          className="fixed z-50 flex touch-none select-none cursor-grab active:cursor-grabbing items-center gap-1 rounded-l-lg bg-[#13345c] py-3 pl-1.5 pr-1 text-white shadow-lg ring-1 ring-white/30 transition-colors hover:bg-[#0f2747]"
          title="Show NyaAI · Drag up or down"
          aria-label="Show NyaAI"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-[10px] font-semibold tracking-widest [writing-mode:vertical-rl]">
            NYAAI
          </span>
        </button>
      )}
    </>
  );
}
