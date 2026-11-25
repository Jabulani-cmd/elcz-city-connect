import { Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Disclaimer } from "./kit";
import { askFarmQuestion, CHAT_TOPICS, type ChatMsg } from "@/lib/farmChat";
import { cn } from "@/lib/utils";

/** General farming advice, separate from questions answered from the farmer’s own records. */
export function FarmingQuestions() {
  const [topic, setTopic] = useState(CHAT_TOPICS[0].topic);
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "assistant", content: "Ask a general farming question about livestock, crops, money, weather, machinery or farm safety. You do not need to have records entered for this guide." }]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);

  const ask = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    const next: ChatMsg[] = [...messages, { role: "user", content: clean }];
    setMessages(next); setQuestion(""); setBusy(true);
    try {
      const reply = await askFarmQuestion(next);
      setMessages((m) => [...m, { role: "assistant", content: reply.text }]);
    } finally { setBusy(false); }
  };
  const suggested = CHAT_TOPICS.find((t) => t.topic === topic)?.questions ?? [];

  return (
    <div>
      <Disclaimer>General guidance only. Confirm disease, chemical, legal and financial decisions with your vet, Agritex officer or a qualified adviser.</Disclaimer>
      <div className="mt-4 space-y-3" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex gap-2"}>
            {m.role === "assistant" && <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></div>}
            <p className={m.role === "user" ? "max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground" : "max-w-full whitespace-pre-line rounded-2xl rounded-bl-sm border bg-card px-4 py-2.5 text-sm"}>{m.content}</p>
          </div>
        ))}
        {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Finding an answer…</div>}
        <div ref={end} />
      </div>
      {!busy && <div className="mt-5">
        <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="tablist" aria-label="Farming question topics">
          {CHAT_TOPICS.map((t) => <button key={t.topic} type="button" role="tab" aria-selected={topic === t.topic} onClick={() => setTopic(t.topic)} className={cn("shrink-0 rounded-full px-3 py-2 text-xs font-semibold", topic === t.topic ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground")}>{t.topic}</button>)}
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">{suggested.map((q) => <button key={q} type="button" onClick={() => void ask(q)} className="rounded-xl border bg-card px-3 py-2.5 text-left text-sm hover:bg-muted">{q}</button>)}</div>
      </div>}
      <form className="sticky bottom-20 mt-4 flex gap-2 rounded-xl bg-background/90 py-2 backdrop-blur md:bottom-2" onSubmit={(e) => { e.preventDefault(); void ask(question); }}>
        <Input aria-label="Ask a general farming question" className="h-12 text-base" placeholder="e.g. How do I prepare for heavy rain?" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={1000} />
        <Button type="submit" size="lg" className="h-12" aria-label="Send farming question" disabled={busy || !question.trim()}><Send className="h-5 w-5" /></Button>
      </form>
    </div>
  );
}
