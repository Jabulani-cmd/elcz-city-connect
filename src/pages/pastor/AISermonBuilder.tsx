import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ArrowRight, ArrowLeft, Loader2, Copy, Save, RotateCcw, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Step = "scripture" | "details" | "generating" | "result";

export default function AISermonBuilder() {
  const [step, setStep] = useState<Step>("scripture");
  const [scripture, setScripture] = useState("");
  const [theme, setTheme] = useState("");
  const [audience, setAudience] = useState("general");
  const [duration, setDuration] = useState("20-25 minutes");
  const [tone, setTone] = useState("inspirational");
  const [keyPoints, setKeyPoints] = useState("");
  const [applicationGoal, setApplicationGoal] = useState("");
  const [sermon, setSermon] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const sermonRef = useRef<HTMLDivElement>(null);

  const generateSermon = async () => {
    setStep("generating");
    setIsGenerating(true);
    setSermon("");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sermon`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ scripture, theme, audience, duration, tone, keyPoints, applicationGoal }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to generate sermon");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              full += content;
              setSermon(full);
            }
          } catch { /* partial chunk */ }
        }
      }

      setStep("result");
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
      setStep("details");
    } finally {
      setIsGenerating(false);
    }
  };

  const copySermon = () => {
    navigator.clipboard.writeText(sermon);
    toast({ title: "Copied!", description: "Sermon copied to clipboard." });
  };

  const saveToLibrary = async () => {
    const titleMatch = sermon.match(/#+\s*(?:Sermon Title[:\s]*)?(.+)/i);
    const title = titleMatch ? titleMatch[1].replace(/\*+/g, "").trim() : `Sermon on ${scripture}`;

    const { error } = await supabase.from("sermons").insert({
      title,
      scripture_references: [scripture],
      draft_content: sermon,
      status: "draft",
    });

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Sermon saved to your library as a draft." });
    }
  };

  const startOver = () => {
    setStep("scripture");
    setScripture("");
    setTheme("");
    setKeyPoints("");
    setApplicationGoal("");
    setSermon("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Sermon Builder
        </h1>
        <p className="text-muted-foreground">Enter your scripture and preferences, and AI will craft a complete sermon for you.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-sm">
        {[
          { key: "scripture", label: "1. Scripture" },
          { key: "details", label: "2. Details" },
          { key: "result", label: "3. Sermon" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-border" />}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === s.key || (step === "generating" && s.key === "result")
                ? "bg-primary text-primary-foreground"
                : step === "result" && i < 2 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Scripture */}
      {step === "scripture" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Scripture Passage
            </CardTitle>
            <CardDescription>Enter the Bible verse or passage your sermon will be based on.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scripture">Scripture Reference</Label>
              <Input
                id="scripture"
                placeholder="e.g. John 3:16-21, Romans 8:28, Psalm 23"
                value={scripture}
                onChange={(e) => setScripture(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">You can enter a single verse, a range, or multiple references separated by commas.</p>
            </div>
            <div>
              <Label htmlFor="theme">Theme or Topic (optional)</Label>
              <Input
                id="theme"
                placeholder="e.g. God's unconditional love, Faith in difficult times"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep("details")} disabled={!scripture.trim()}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Details */}
      {step === "details" && (
        <Card>
          <CardHeader>
            <CardTitle>Sermon Preferences</CardTitle>
            <CardDescription>Help the AI tailor the sermon to your needs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Target Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Congregation</SelectItem>
                    <SelectItem value="youth">Youth & Young Adults</SelectItem>
                    <SelectItem value="women">Women's Fellowship</SelectItem>
                    <SelectItem value="men">Men's Fellowship</SelectItem>
                    <SelectItem value="children">Children's Ministry</SelectItem>
                    <SelectItem value="new-believers">New Believers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sermon Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10-15 minutes">10–15 minutes</SelectItem>
                    <SelectItem value="15-20 minutes">15–20 minutes</SelectItem>
                    <SelectItem value="20-25 minutes">20–25 minutes</SelectItem>
                    <SelectItem value="25-30 minutes">25–30 minutes</SelectItem>
                    <SelectItem value="30-40 minutes">30–40 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inspirational">Inspirational & Encouraging</SelectItem>
                    <SelectItem value="teaching">Teaching & Expository</SelectItem>
                    <SelectItem value="evangelistic">Evangelistic</SelectItem>
                    <SelectItem value="comforting">Comforting & Pastoral</SelectItem>
                    <SelectItem value="challenging">Challenging & Prophetic</SelectItem>
                    <SelectItem value="celebratory">Celebratory & Joyful</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="keyPoints">Key Points You Want Emphasized</Label>
              <Textarea
                id="keyPoints"
                placeholder="Share any specific ideas, stories, or points you'd like included in the sermon..."
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="applicationGoal">Desired Application / Takeaway</Label>
              <Textarea
                id="applicationGoal"
                placeholder="What do you want the congregation to do or change after hearing this sermon?"
                value={applicationGoal}
                onChange={(e) => setApplicationGoal(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("scripture")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={generateSermon}>
                <Sparkles className="h-4 w-4 mr-1" /> Generate Sermon
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Generating / Result */}
      {(step === "generating" || step === "result") && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {isGenerating && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                  {isGenerating ? "Crafting Your Sermon..." : "Your Sermon"}
                </CardTitle>
                {isGenerating && (
                  <CardDescription>The AI is writing your sermon based on {scripture}. This may take a moment.</CardDescription>
                )}
              </div>
              {step === "result" && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copySermon}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={saveToLibrary}>
                    <Save className="h-4 w-4 mr-1" /> Save to Library
                  </Button>
                  <Button variant="outline" size="sm" onClick={startOver}>
                    <RotateCcw className="h-4 w-4 mr-1" /> New Sermon
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              ref={sermonRef}
              className="prose prose-sm max-w-none dark:prose-invert
                prose-headings:text-foreground prose-p:text-foreground/90
                prose-strong:text-foreground prose-li:text-foreground/90
                prose-blockquote:border-primary prose-blockquote:text-muted-foreground
                whitespace-pre-wrap leading-relaxed"
            >
              {sermon ? (
                <SermonMarkdown content={sermon} />
              ) : (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Starting generation...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Simple markdown renderer for the sermon */
function SermonMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div>
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{parseBold(line.slice(2))}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-semibold mt-5 mb-2">{parseBold(line.slice(3))}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{parseBold(line.slice(4))}</h3>;
        if (line.startsWith("#### ")) return <h4 key={i} className="text-base font-semibold mt-3 mb-1">{parseBold(line.slice(5))}</h4>;
        if (line.startsWith("> ")) return <blockquote key={i} className="border-l-4 border-primary pl-4 italic text-muted-foreground my-2">{parseBold(line.slice(2))}</blockquote>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="ml-6 list-disc">{parseBold(line.slice(2))}</li>;
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-6 list-decimal">{parseBold(line.replace(/^\d+\.\s/, ""))}</li>;
        if (line.startsWith("---")) return <hr key={i} className="my-4 border-border" />;
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} className="my-1">{parseBold(line)}</p>;
      })}
    </div>
  );
}

function parseBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Handle italic
    const italicParts = part.split(/(\*[^*]+\*)/g);
    return italicParts.map((ip, j) => {
      if (ip.startsWith("*") && ip.endsWith("*")) {
        return <em key={`${i}-${j}`}>{ip.slice(1, -1)}</em>;
      }
      return ip;
    });
  });
}
