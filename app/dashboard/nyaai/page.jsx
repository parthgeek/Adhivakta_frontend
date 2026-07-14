"use client";

import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowUp,
  CalendarClock,
  FileSignature,
  FileText,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import NyaAIChat from "@/components/nyaai/NyaAIChat";
import ContextPanel from "@/components/nyaai/ContextPanel";

const SUGGESTED_PROMPTS = [
  "What hearings do I have tomorrow?",
  "Which cases need my attention?",
  "Which documents are still pending review?",
  "What does my week look like?",
  "Find every case involving Section 138",
  "Summarize my most recent case",
];

const QUICK_ACTIONS = [
  {
    icon: CalendarClock,
    label: "Prepare a hearing",
    prompt: "Prepare me for my next hearing.",
  },
  {
    icon: FileSignature,
    label: "Draft a document",
    prompt: "Help me draft a legal notice. Ask me for the details you need.",
  },
  {
    icon: Search,
    label: "Search documents",
    prompt: "Search my documents for ",
    fillInput: true,
  },
  {
    icon: FileText,
    label: "Daily briefing",
    prompt: "Give me my daily briefing — schedule, pending work, and what needs my attention.",
  },
];

function NyaAIPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState("home"); // home | chat
  const [initialPrompt, setInitialPrompt] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [context, setContext] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [input, setInput] = useState("");
  const [chatKey, setChatKey] = useState(0);

  const loadConversations = async () => {
    try {
      const rows = await api.nyaai.listConversations();
      setConversations(rows || []);
    } catch {}
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Deep link: /dashboard/nyaai?q=… fires a prompt immediately.
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      startChat({ prompt: q });
      router.replace("/dashboard/nyaai");
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const startChat = ({ prompt, conversationId }) => {
    setInitialPrompt(prompt || null);
    setActiveConversation(conversationId || null);
    setContext(null);
    setChatKey((k) => k + 1);
    setMode("chat");
  };

  const submitHero = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    startChat({ prompt: input.trim() });
    setInput("");
  };

  const removeConversation = async (e, id) => {
    e.stopPropagation();
    try {
      await api.nyaai.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full shadow-sm ring-2 ring-border/60">
            <img
              src="/nyaai-avatar.png"
              alt="NyaAI"
              className="h-full w-full object-cover"
              draggable={false}
            />
          </span>
          <div>
            <h1 className="text-xl font-bold text-foreground">NyaAI</h1>
            <p className="text-sm text-muted-foreground">
              Your legal workspace assistant — grounded in your cases, hearings, and documents.
            </p>
          </div>
        </div>
        {mode === "chat" && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setMode("home");
              loadConversations();
            }}
          >
            <Plus className="h-4 w-4" /> New chat
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {mode === "home" ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mx-auto w-full max-w-3xl flex-1 space-y-6 overflow-y-auto pb-8 pt-6"
          >
            {/* hero input */}
            <form onSubmit={submitHero} className="relative">
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask NyaAI anything — cases, hearings, documents, drafts…"
                className="h-14 w-full rounded-2xl border border-input bg-card pl-5 pr-14 text-base shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                className="absolute right-2 top-2 h-10 w-10 rounded-xl"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </form>

            {/* suggested prompts */}
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => startChat({ prompt: p })}
                  className="rounded-full border border-border/70 bg-background px-3.5 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* quick actions */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() =>
                    a.fillInput ? setInput(a.prompt) : startChat({ prompt: a.prompt })
                  }
                  className="group flex flex-col items-start gap-2 rounded-xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <a.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{a.label}</span>
                </button>
              ))}
            </div>

            {/* recent conversations */}
            {conversations.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent conversations
                </p>
                <Card className="divide-y divide-border/60 overflow-hidden">
                  {conversations.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => startChat({ conversationId: c.id })}
                      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.caseTitle ? `${c.caseTitle} · ` : ""}
                          {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <span
                        role="button"
                        tabIndex={-1}
                        onClick={(e) => removeConversation(e, c.id)}
                        className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  ))}
                </Card>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_300px]"
          >
            <Card className="flex min-h-0 flex-col overflow-hidden">
              <NyaAIChat
                key={chatKey}
                conversationId={activeConversation}
                initialPrompt={initialPrompt}
                onContextChange={setContext}
                onConversation={() => {}}
                className="min-h-0 flex-1"
              />
            </Card>
            <ContextPanel context={context} className="hidden min-h-0 lg:block" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NyaAIPage() {
  return (
    <Suspense fallback={null}>
      <NyaAIPageInner />
    </Suspense>
  );
}
