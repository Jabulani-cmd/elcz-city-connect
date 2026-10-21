import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askFarmQuestion, CHAT_TOPICS, type ChatMsg } from "@/lib/farmChat";
import { cn } from "@/lib/utils";

const WELCOME = "Hello! I'm the FarmHelper assistant. Ask me anything about livestock, crops or farm money – or about using FarmHelper.";

/** Floating "Ask FarmHelper" chat on the home page for general farming questions (no sign-in needed). */
export function LandingAssistant() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(CHAT_TOPICS[0].topic);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [open]);

  const ask = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    const next: ChatMsg[] = [...msgs, { role: "user", content: t }];
    setMsgs(next);
    setQ("");
    setBusy(true);
    try {
      const r = await askFarmQuestion(next);
      setMsgs((m) => [...m, { role: "assistant", content: r.text }]);
    } finally { setBusy(false); }
  };

  const questions = CHAT_TOPICS.find((t) => t.topic === topic)?.questions ?? [];

  return (
    <>
      {!open && (
        <button type="button" onClick={() => setOpen(true)} aria-label="Ask the farming assistant"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-accent px-5 text-base font-bold text-accent-foreground shadow-xl ring-4 ring-background/20 transition-transform hover:scale-105 active:scale-95 motion-reduce:transition-none sm:right-6">
          <MessageCircle className="h-6 w-6" />
          <span>Ask a farming question</span>
        </button>
      )}

      {open && (
        <div role="dialog" aria-modal="false" aria-label="Farming assistant"
          className="fixed inset-x-2 bottom-2 z-50 flex max-h-[min(40rem,calc(100svh-1rem))] flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[24rem]">
          <div className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15"><Sparkles className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="font-bold leading-tight">FarmHelper assistant</div>
              <div className="text-xs opacity-80">Livestock · Crops · Finance</div>
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label="Close assistant" onClick={() => setOpen(false)} className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"><X className="h-5 w-5" /></Button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
            <Bubble from="assistant">{WELCOME}</Bubble>
            {msgs.map((m, i) => <Bubble key={i} from={m.role}>{m.content}</Bubble>)}
            {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Thinking…</div>}

            {!busy && (
              <div className="pt-1">
                <div className="mb-2 flex flex-wrap gap-1.5" role="tablist" aria-label="Topics">
                  {CHAT_TOPICS.map((t) => (
                    <button key={t.topic} type="button" role="tab" aria-selected={t.topic === topic} onClick={() => setTopic(t.topic)}
                      className={cn("rounded-full px-3 py-1 text-xs font-semibold", t.topic === topic ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}>{t.topic}</button>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  {questions.map((s) => <button key={s} type="button" onClick={() => void ask(s)} className="rounded-xl border bg-background px-3 py-2 text-left text-sm hover:bg-muted">{s}</button>)}
                </div>
              </div>
            )}
            <div ref={end} />
          </div>

          <p className="px-4 pb-1 text-[11px] text-muted-foreground">General advice only. For sick animals call your vet; for crops ask your Agritex officer.</p>
          <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); void ask(q); }}>
            <Input ref={input} aria-label="Type your farming question" className="h-12 text-base" placeholder="Type your question…" value={q} onChange={(e) => setQ(e.target.value)} maxLength={1000} />
            <Button type="submit" size="icon" className="h-12 w-12 shrink-0" aria-label="Send" disabled={busy || !q.trim()}><Send className="h-5 w-5" /></Button>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ from, children }: { from: ChatMsg["role"]; children: string }) {
  return from === "user"
    ? <div className="flex justify-end"><p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">{children}</p></div>
    : <p className="max-w-[92%] whitespace-pre-line rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm">{children}</p>;
}
