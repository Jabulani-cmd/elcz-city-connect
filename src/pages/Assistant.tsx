import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Disclaimer, PageHeader } from "@/components/farm/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { answer, SUGGESTIONS, type Answer } from "@/lib/assistant";

type Msg = { from: "me" | "bot"; text: string; table?: Answer["table"] };

export default function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: "Hello! Ask me anything about your farm – I look up the answer in your own records." }]);
  const [q, setQ] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs]);
  const ask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    let a: Answer;
    try { a = answer(t); } catch { a = { text: "Sorry, I couldn’t work that out from your records." }; }
    setMsgs((m) => [...m, { from: "me", text: t }, { from: "bot", ...a }]);
    setQ("");
  };
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="AI Farm Assistant" description="Ask in plain words. Answers are calculated from this farm’s database." />
      <Disclaimer>Answers come from the records you have entered on this device, so they are only as complete as your data. Check important decisions (treatment, sales) yourself or with a professional.</Disclaimer>
      <div className="mt-4 space-y-3" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={m.from === "me" ? "flex justify-end" : "flex gap-2"}>
            {m.from === "bot" && <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></div>}
            <div className={m.from === "me" ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground" : "min-w-0 max-w-full rounded-2xl rounded-bl-sm border bg-card px-4 py-2.5"}>
              <p className="text-sm">{m.text}</p>
              {m.table && (
                <div className="mt-2 max-h-72 overflow-auto rounded-lg border">
                  <table className="w-full text-sm"><thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr>{m.table.headers.map((h) => <th key={h} className="px-3 py-1.5 font-medium">{h}</th>)}</tr></thead>
                    <tbody className="divide-y">{m.table.rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} className="whitespace-nowrap px-3 py-1.5">{typeof c === "number" ? c.toLocaleString(undefined, { maximumFractionDigits: 2 }) : c || "–"}</td>)}</tr>)}</tbody></table>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full border bg-card px-3 py-1.5 text-left text-sm hover:bg-muted">{s}</button>)}
      </div>
      <form className="sticky bottom-20 mt-4 flex gap-2 rounded-xl bg-background/90 py-2 backdrop-blur md:bottom-2" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <Input aria-label="Ask a question" className="h-12 text-base" placeholder="e.g. Which animals are ready for sale?" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit" size="lg" className="h-12" aria-label="Send"><Send className="h-5 w-5" /></Button>
      </form>
    </div>
  );
}
