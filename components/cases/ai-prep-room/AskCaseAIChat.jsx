"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, FileText, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SUGGESTED_PROMPTS, mockAssistantReply } from "./mock-data";

/* ----------------------------- citation chip ---------------------------- */

function CitationChip({ citation }) {
  return (
    <button
      type="button"
      className="group inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border/70 bg-background/80 px-2 py-1 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5"
      title={`${citation.document}${citation.page ? ` · Page ${citation.page}` : ""}`}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-primary/70" />
      <span className="truncate font-medium">{citation.document}</span>
      {citation.page != null && (
        <span className="shrink-0 rounded bg-muted px-1 text-[10px] font-semibold text-muted-foreground">
          p.{citation.page}
        </span>
      )}
    </button>
  );
}

/* ----------------------------- typing dots ------------------------------ */

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

/* ------------------------------ bubble ---------------------------------- */

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#13345c] to-[#0f2747] text-white shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
      )}
      <div className={cn("max-w-[78%]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md border border-border/60 bg-card text-foreground",
          )}
        >
          {message.pending ? <TypingIndicator /> : message.content}
        </div>
        {message.citations?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="self-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Source
            </span>
            {message.citations.map((c) => (
              <CitationChip key={c.id} citation={c} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------ chat ------------------------------------ */

/**
 * Section 3 — Ask Case AI chat. Self-contained demo: sends a message,
 * shows a typing indicator, then a canned cited reply.
 */
const AskCaseAIChat = forwardRef(function AskCaseAIChat(
  {
    initialMessages = [],
    onSend,
    suggestedPrompts = SUGGESTED_PROMPTS,
    placeholder = "Ask anything about this case…",
  },
  ref
) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = async (text) => {
    const value = (text ?? input).trim();
    if (!value || thinking) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: value,
      createdAt: new Date().toISOString(),
    };
    // Snapshot prior turns for the model (exclude the just-added user msg).
    const history = messages
      .filter((m) => !m.pending && m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    if (onSend) {
      try {
        const reply = await onSend(value, history);
        setMessages((prev) => [...prev, reply]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content:
              err?.message ||
              "Something went wrong answering that. Make sure the case is indexed and try again.",
            createdAt: new Date().toISOString(),
            isError: true,
          },
        ]);
      } finally {
        setThinking(false);
      }
      return;
    }

    // Fallback (no backend wired): canned reply.
    timers.current.push(
      setTimeout(() => {
        setMessages((prev) => [...prev, mockAssistantReply(value)]);
        setThinking(false);
      }, 1400)
    );
  };

  const hasConversation = messages.some((m) => m.role === "user");

  return (
    <Card ref={ref} className="flex h-[30rem] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#13345c] to-[#0f2747] text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">Case AI</p>
          <p className="text-xs text-muted-foreground">Grounded in this case file</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <AnimatePresence>
          {thinking && (
            <MessageBubble message={{ id: "typing", role: "assistant", pending: true }} />
          )}
        </AnimatePresence>
      </div>

      {!hasConversation && suggestedPrompts.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
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
          placeholder={placeholder}
          className="h-10 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || thinking}
          className="h-10 w-10 shrink-0 rounded-xl"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
});

export default AskCaseAIChat;
