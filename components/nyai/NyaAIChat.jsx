"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Check,
  Copy,
  FileText,
  Gavel,
  RefreshCw,
  Scale,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import Markdown from "./Markdown";

/* ------------------------- tool activity labels ------------------------- */

const TOOL_LABELS = {
  search_cases: "Searching your cases…",
  get_case_overview: "Reading the case file…",
  get_hearings: "Checking your calendar…",
  search_documents: "Searching your documents…",
  get_pending_documents: "Checking pending reviews…",
  get_daily_digest: "Assembling your day…",
  prepare_hearing: "Preparing the hearing brief…",
  analyze_weaknesses: "Analyzing weaknesses…",
};

/* ------------------------------ source chip ----------------------------- */

const SOURCE_ICONS = {
  document: FileText,
  case: Scale,
  hearing: Gavel,
};

function SourceChip({ source, onOpen }) {
  const Icon = SOURCE_ICONS[source.type] || FileText;
  return (
    <button
      type="button"
      onClick={() => onOpen?.(source)}
      title={source.snippet || source.label}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border/70 bg-background/80 px-2 py-1 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary/70" />
      <span className="truncate font-medium">{source.label}</span>
    </button>
  );
}

/* ------------------------------ indicators ------------------------------ */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function ToolIndicator({ label }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        className="inline-flex"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary/70" />
      </motion.span>
      {label}
    </div>
  );
}

/* -------------------------------- avatar -------------------------------- */

function AIAvatar() {
  return (
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm ring-1 ring-border/60">
      <img
        src="/nyai-avatar.png"
        alt="NyaAI"
        className="h-full w-full object-cover"
        draggable={false}
      />
    </span>
  );
}

/* -------------------------------- bubble -------------------------------- */

function MessageBubble({ message, onOpenSource, onCopy, onRegenerate, isLast }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      onCopy?.();
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && <AIAvatar />}
      <div className={cn("max-w-[82%] min-w-0", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md border border-border/60 bg-card text-foreground",
            message.isError && "border-destructive/40 bg-destructive/5"
          )}
        >
          {message.pending && !message.content ? (
            message.toolLabel ? (
              <ToolIndicator label={message.toolLabel} />
            ) : (
              <TypingIndicator />
            )
          ) : isUser ? (
            message.content
          ) : (
            <Markdown text={message.content || ""} />
          )}
        </div>

        {!isUser && !message.pending && message.content && (
          <div className="mt-1 flex items-center gap-1">
            <button
              type="button"
              onClick={copy}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Copy response"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {isLast && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Regenerate"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {message.sources?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="self-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sources
            </span>
            {message.sources.map((s, i) => (
              <SourceChip key={`${s.type}-${s.id}-${i}`} source={s} onOpen={onOpenSource} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* --------------------------------- chat --------------------------------- */

/**
 * NyaAI chat pane. Streams answers over SSE, shows tool activity, renders
 * markdown with source citations and contextual follow-up chips.
 *
 * Props:
 *   conversationId   open an existing thread (optional)
 *   caseId           pin a case context (optional)
 *   initialPrompt    send immediately on mount (optional)
 *   onContextChange  ({caseId, caseTitle}) => void
 *   onConversation   (conversationId) => void
 *   className
 */
export default function NyaAIChat({
  conversationId: initialConversationId,
  caseId,
  initialPrompt,
  suggestedPrompts = [],
  onContextChange,
  onConversation,
  className,
}) {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const conversationRef = useRef(initialConversationId || null);
  const scrollRef = useRef(null);
  const sentInitial = useRef(false);

  // Load an existing thread.
  useEffect(() => {
    if (!initialConversationId) return;
    conversationRef.current = initialConversationId;
    let cancelled = false;
    (async () => {
      try {
        const c = await api.nyai.getConversation(initialConversationId);
        if (cancelled) return;
        setMessages(
          (c.messages || []).map((m, i) => ({
            id: `h-${i}`,
            role: m.role,
            content: m.content,
            sources: m.sources || [],
          }))
        );
        const last = (c.messages || []).filter((m) => m.role === "assistant").pop();
        setFollowUps(last?.followUps || []);
        if (c.context?.caseId) onContextChange?.(c.context);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [initialConversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const openSource = (source) => {
    if (source.type === "case") router.push(`/dashboard/cases/${source.id}`);
    else if (source.type === "hearing") router.push("/dashboard/hearings");
    else if (source.type === "document") router.push("/dashboard/documents");
  };

  const send = async (text) => {
    const value = (text ?? input).trim();
    if (!value || busy) return;

    setInput("");
    setFollowUps([]);
    setBusy(true);

    const userId = `u-${Date.now()}`;
    const aiId = `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: value },
      { id: aiId, role: "assistant", content: "", pending: true },
    ]);

    const patchAI = (patch) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === aiId ? { ...m, ...(typeof patch === "function" ? patch(m) : patch) } : m))
      );

    try {
      const done = await api.nyai.chatStream(
        { message: value, conversationId: conversationRef.current, caseId },
        {
          onMeta: ({ conversationId }) => {
            conversationRef.current = conversationId;
            onConversation?.(conversationId);
          },
          onTool: ({ name }) =>
            patchAI({ toolLabel: TOOL_LABELS[name] || "Working…", content: "" }),
          onDelta: ({ text: t }) =>
            patchAI((m) => ({ content: (m.content || "") + t, toolLabel: null })),
          onReset: () => patchAI({ content: "" }),
        }
      );

      patchAI({
        content: done.answer,
        sources: done.sources || [],
        pending: false,
        toolLabel: null,
      });
      setFollowUps(done.followUps || []);
      if (done.context?.caseId) onContextChange?.(done.context);
    } catch (err) {
      patchAI({
        content:
          err?.message ||
          "Something went wrong answering that. Please try again.",
        pending: false,
        isError: true,
        toolLabel: null,
      });
    } finally {
      setBusy(false);
    }
  };

  // Fire the initial prompt once.
  useEffect(() => {
    if (initialPrompt && !sentInitial.current) {
      sentInitial.current = true;
      send(initialPrompt);
    }
  }, [initialPrompt]); // eslint-disable-line react-hooks/exhaustive-deps

  const regenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((prev) => {
      // Drop the trailing assistant answer so the retry replaces it.
      const copy = [...prev];
      if (copy[copy.length - 1]?.role === "assistant") copy.pop();
      if (copy[copy.length - 1]?.role === "user") copy.pop();
      return copy;
    });
    setTimeout(() => send(lastUser.content), 0);
  };

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !busy && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full shadow-sm ring-2 ring-border/60">
              <img
                src="/nyai-avatar.png"
                alt="NyaAI"
                className="h-full w-full object-cover"
                draggable={false}
              />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Hi, I'm NyaAI.</p>
              <p className="text-xs text-muted-foreground">
                Ask me about your cases, hearings, documents, or drafts.
              </p>
            </div>
            {suggestedPrompts.length > 0 && (
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            onOpenSource={openSource}
            onRegenerate={m.id === lastAssistantId && !busy ? regenerate : undefined}
            isLast={m.id === lastAssistantId}
          />
        ))}
      </div>

      <AnimatePresence>
        {!busy && followUps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-2 px-4 pb-2"
          >
            {followUps.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => send(p)}
                className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              >
                {p}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2 border-t border-border/60 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask NyaAI anything about your practice…"
          className="h-10 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || busy}
          className="h-10 w-10 shrink-0 rounded-xl"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
