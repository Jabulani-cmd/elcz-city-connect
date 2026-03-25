import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BIBLE_BOOKS, fetchChapter, HIGHLIGHT_COLORS, type BibleVerse, type BibleBook } from "@/lib/bible-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  BookOpen, Search, Bookmark, BookmarkCheck, Highlighter, ChevronLeft,
  ChevronRight, Loader2, Trash2, X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SavedBookmark {
  id: string;
  book: string;
  chapter: number;
  verse: number | null;
  title: string | null;
  bible_version: string;
  created_at: string;
}

interface SavedHighlight {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  verse_end: number | null;
  note: string | null;
  color: string;
  bible_version: string;
  created_at: string;
}

export default function BibleReader() {
  const [selectedBook, setSelectedBook] = useState<BibleBook>(BIBLE_BOOKS[0]);
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BibleVerse[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [highlightNote, setHighlightNote] = useState("");
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [showBookNav, setShowBookNav] = useState(false);
  const [bookFilter, setBookFilter] = useState("");
  const [sideTab, setSideTab] = useState("books");

  // Load chapter
  const loadChapter = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchChapter(selectedBook.name, chapter);
      setVerses(data.verses || []);
    } catch {
      toast.error("Failed to load scripture. Please try again.");
      setVerses([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBook.name, chapter]);

  useEffect(() => { loadChapter(); }, [loadChapter]);

  // Load bookmarks & highlights
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [bRes, hRes] = await Promise.all([
        supabase.from("bible_bookmarks").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
        supabase.from("bible_highlights").select("*").eq("user_id", session.user.id),
      ]);
      if (bRes.data) setBookmarks(bRes.data as SavedBookmark[]);
      if (hRes.data) setHighlights(hRes.data as SavedHighlight[]);
    };
    load();
  }, []);

  const currentHighlights = highlights.filter(
    h => h.book === selectedBook.name && h.chapter === chapter
  );

  const getVerseHighlight = (verse: number) =>
    currentHighlights.find(h => h.verse === verse);

  const isChapterBookmarked = bookmarks.some(
    b => b.book === selectedBook.name && b.chapter === chapter && !b.verse
  );

  // Search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(searchQuery)}?translation=kjv`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSearchResults(data.verses || [data]);
      setSideTab("search");
    } catch {
      toast.error("No results found. Try a reference like 'John 3:16' or 'Psalm 23'.");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Bookmark chapter
  const toggleBookmark = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (isChapterBookmarked) {
      const bm = bookmarks.find(b => b.book === selectedBook.name && b.chapter === chapter && !b.verse);
      if (bm) {
        await supabase.from("bible_bookmarks").delete().eq("id", bm.id);
        setBookmarks(prev => prev.filter(b => b.id !== bm.id));
        toast.success("Bookmark removed");
      }
    } else {
      const { data, error } = await supabase.from("bible_bookmarks").insert({
        user_id: session.user.id,
        book: selectedBook.name,
        chapter,
        title: `${selectedBook.name} ${chapter}`,
        bible_version: "kjv",
      }).select().single();
      if (error) { toast.error("Failed to bookmark"); return; }
      setBookmarks(prev => [data as SavedBookmark, ...prev]);
      toast.success("Chapter bookmarked");
    }
  };

  // Highlight verse
  const addHighlight = async () => {
    if (selectedVerse === null) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const existing = getVerseHighlight(selectedVerse);
    if (existing) {
      await supabase.from("bible_highlights").delete().eq("id", existing.id);
      setHighlights(prev => prev.filter(h => h.id !== existing.id));
    }

    const { data, error } = await supabase.from("bible_highlights").insert({
      user_id: session.user.id,
      book: selectedBook.name,
      chapter,
      verse: selectedVerse,
      color: highlightColor,
      note: highlightNote || null,
      bible_version: "kjv",
    }).select().single();
    if (error) { toast.error("Failed to highlight"); return; }
    setHighlights(prev => [...prev, data as SavedHighlight]);
    setSelectedVerse(null);
    setHighlightNote("");
    toast.success("Verse highlighted");
  };

  const removeHighlight = async (id: string) => {
    await supabase.from("bible_highlights").delete().eq("id", id);
    setHighlights(prev => prev.filter(h => h.id !== id));
    toast.success("Highlight removed");
  };

  const removeBookmark = async (id: string) => {
    await supabase.from("bible_bookmarks").delete().eq("id", id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
    toast.success("Bookmark removed");
  };

  const goToRef = (book: string, ch: number) => {
    const found = BIBLE_BOOKS.find(b => b.name === book);
    if (found) {
      setSelectedBook(found);
      setChapter(ch);
      setSearchResults(null);
      setSideTab("books");
    }
  };

  const filteredBooks = BIBLE_BOOKS.filter(b =>
    b.name.toLowerCase().includes(bookFilter.toLowerCase())
  );

  const prevChapter = () => {
    if (chapter > 1) setChapter(c => c - 1);
    else {
      const idx = BIBLE_BOOKS.indexOf(selectedBook);
      if (idx > 0) {
        const prev = BIBLE_BOOKS[idx - 1];
        setSelectedBook(prev);
        setChapter(prev.chapters);
      }
    }
  };

  const nextChapter = () => {
    if (chapter < selectedBook.chapters) setChapter(c => c + 1);
    else {
      const idx = BIBLE_BOOKS.indexOf(selectedBook);
      if (idx < BIBLE_BOOKS.length - 1) {
        setSelectedBook(BIBLE_BOOKS[idx + 1]);
        setChapter(1);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Bible Reader
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">KJV</Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scripture (e.g. 'John 3:16', 'Psalm 23', 'Romans 8:28')"
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={searchLoading}>
          {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-[calc(100vh-280px)]">
            <Tabs value={sideTab} onValueChange={setSideTab}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="books" className="text-xs">Books</TabsTrigger>
                <TabsTrigger value="bookmarks" className="text-xs">
                  <Bookmark className="h-3 w-3 mr-1" />
                  {bookmarks.length > 0 && <span className="text-xs">({bookmarks.length})</span>}
                </TabsTrigger>
                <TabsTrigger value="search" className="text-xs">Results</TabsTrigger>
              </TabsList>

              <TabsContent value="books" className="mt-0">
                <div className="p-2">
                  <Input
                    placeholder="Filter books..."
                    value={bookFilter}
                    onChange={e => setBookFilter(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <ScrollArea className="h-[calc(100vh-380px)]">
                  <div className="space-y-1 px-2 pb-2">
                    {(bookFilter ? filteredBooks : BIBLE_BOOKS).map(book => {
                      const isSelected = selectedBook.name === book.name;
                      return (
                        <div key={book.name}>
                          <button
                            onClick={() => {
                              setSelectedBook(book);
                              setShowBookNav(showBookNav && isSelected ? false : true);
                              if (!isSelected) setChapter(1);
                            }}
                            className={cn(
                              "w-full text-left px-2 py-1.5 rounded text-sm transition-colors",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-foreground"
                            )}
                          >
                            <span className="font-medium">{book.name}</span>
                            <span className="text-xs opacity-70 ml-1">({book.chapters})</span>
                          </button>
                          {isSelected && showBookNav && (
                            <div className="grid grid-cols-6 gap-1 p-1 mt-1 bg-muted/50 rounded">
                              {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
                                <button
                                  key={ch}
                                  onClick={() => { setChapter(ch); setShowBookNav(false); }}
                                  className={cn(
                                    "text-xs py-1 rounded transition-colors",
                                    ch === chapter
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-muted-foreground/20 text-foreground"
                                  )}
                                >
                                  {ch}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="bookmarks" className="mt-0">
                <ScrollArea className="h-[calc(100vh-360px)]">
                  <div className="space-y-1 p-2">
                    {bookmarks.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No bookmarks yet</p>
                    )}
                    {bookmarks.map(bm => (
                      <div key={bm.id} className="flex items-center justify-between group">
                        <button
                          onClick={() => goToRef(bm.book, bm.chapter)}
                          className="text-sm text-left px-2 py-1.5 rounded hover:bg-muted flex-1 text-foreground"
                        >
                          {bm.title || `${bm.book} ${bm.chapter}`}
                        </button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => removeBookmark(bm.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="search" className="mt-0">
                <ScrollArea className="h-[calc(100vh-360px)]">
                  <div className="space-y-2 p-2">
                    {searchResults === null && (
                      <p className="text-sm text-muted-foreground text-center py-8">Use the search bar above</p>
                    )}
                    {searchResults?.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => goToRef(v.book_name, v.chapter)}
                        className="block w-full text-left p-2 rounded hover:bg-muted text-sm"
                      >
                        <span className="font-medium text-primary">{v.book_name} {v.chapter}:{v.verse}</span>
                        <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{v.text}</p>
                      </button>
                    ))}
                    {searchResults?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No results found</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Main Reader */}
        <div className="lg:col-span-3">
          <Card className="h-[calc(100vh-280px)] flex flex-col">
            <CardHeader className="py-3 px-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevChapter}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-lg">
                    {selectedBook.name} {chapter}
                  </CardTitle>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextChapter}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant={isChapterBookmarked ? "default" : "outline"}
                    size="sm"
                    onClick={toggleBookmark}
                    className="gap-1"
                  >
                    {isChapterBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    <span className="hidden sm:inline">{isChapterBookmarked ? "Bookmarked" : "Bookmark"}</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                <div className="px-4 sm:px-8 py-4 max-w-3xl mx-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : verses.length === 0 ? (
                    <p className="text-center text-muted-foreground py-20">
                      Could not load this chapter. Please try again.
                    </p>
                  ) : (
                    <div className="space-y-0 leading-relaxed text-base sm:text-lg font-serif">
                      {verses.map(v => {
                        const hl = getVerseHighlight(v.verse);
                        const isSelected = selectedVerse === v.verse;
                        return (
                          <Popover
                            key={v.verse}
                            open={isSelected}
                            onOpenChange={open => {
                              if (!open) setSelectedVerse(null);
                            }}
                          >
                            <PopoverTrigger asChild>
                              <span
                                className={cn(
                                  "cursor-pointer rounded px-0.5 transition-colors inline",
                                  hl ? "rounded px-0.5" : "hover:bg-muted"
                                )}
                                style={hl ? { backgroundColor: `${hl.color}30` } : undefined}
                                onClick={() => setSelectedVerse(isSelected ? null : v.verse)}
                              >
                                <sup className="text-xs font-bold text-primary mr-1 select-none">{v.verse}</sup>
                                {v.text}{" "}
                              </span>
                            </PopoverTrigger>
                            <PopoverContent className="w-72" side="top">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-semibold">
                                    {selectedBook.name} {chapter}:{v.verse}
                                  </p>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedVerse(null)}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="flex gap-1">
                                  {HIGHLIGHT_COLORS.map(c => (
                                    <button
                                      key={c.value}
                                      onClick={() => setHighlightColor(c.value)}
                                      className={cn(
                                        "h-6 w-6 rounded-full border-2 transition-transform",
                                        highlightColor === c.value ? "border-foreground scale-110" : "border-transparent"
                                      )}
                                      style={{ backgroundColor: c.value }}
                                      title={c.name}
                                    />
                                  ))}
                                </div>
                                <Textarea
                                  placeholder="Add a note (optional)"
                                  value={highlightNote}
                                  onChange={e => setHighlightNote(e.target.value)}
                                  className="text-xs min-h-[60px]"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={addHighlight} className="gap-1 flex-1">
                                    <Highlighter className="h-3 w-3" />
                                    {hl ? "Update" : "Highlight"}
                                  </Button>
                                  {hl && (
                                    <Button size="sm" variant="destructive" onClick={() => removeHighlight(hl.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
