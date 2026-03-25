
-- Bible bookmarks table
CREATE TABLE public.bible_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book text NOT NULL,
  chapter integer NOT NULL,
  verse integer,
  title text,
  bible_version text NOT NULL DEFAULT 'kjv',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON public.bible_bookmarks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON public.bible_bookmarks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON public.bible_bookmarks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Bible highlights table
CREATE TABLE public.bible_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  verse_end integer,
  note text,
  color text NOT NULL DEFAULT '#FBBF24',
  bible_version text NOT NULL DEFAULT 'kjv',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own highlights" ON public.bible_highlights
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own highlights" ON public.bible_highlights
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights" ON public.bible_highlights
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
