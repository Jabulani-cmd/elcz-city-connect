// Bible book data for navigation
export interface BibleBook {
  name: string;
  chapters: number;
  testament: "old" | "new";
  abbreviation: string;
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { name: "Genesis", chapters: 50, testament: "old", abbreviation: "Gen" },
  { name: "Exodus", chapters: 40, testament: "old", abbreviation: "Exod" },
  { name: "Leviticus", chapters: 27, testament: "old", abbreviation: "Lev" },
  { name: "Numbers", chapters: 36, testament: "old", abbreviation: "Num" },
  { name: "Deuteronomy", chapters: 34, testament: "old", abbreviation: "Deut" },
  { name: "Joshua", chapters: 24, testament: "old", abbreviation: "Josh" },
  { name: "Judges", chapters: 21, testament: "old", abbreviation: "Judg" },
  { name: "Ruth", chapters: 4, testament: "old", abbreviation: "Ruth" },
  { name: "1 Samuel", chapters: 31, testament: "old", abbreviation: "1Sam" },
  { name: "2 Samuel", chapters: 24, testament: "old", abbreviation: "2Sam" },
  { name: "1 Kings", chapters: 22, testament: "old", abbreviation: "1Kgs" },
  { name: "2 Kings", chapters: 25, testament: "old", abbreviation: "2Kgs" },
  { name: "1 Chronicles", chapters: 29, testament: "old", abbreviation: "1Chr" },
  { name: "2 Chronicles", chapters: 36, testament: "old", abbreviation: "2Chr" },
  { name: "Ezra", chapters: 10, testament: "old", abbreviation: "Ezra" },
  { name: "Nehemiah", chapters: 13, testament: "old", abbreviation: "Neh" },
  { name: "Esther", chapters: 10, testament: "old", abbreviation: "Esth" },
  { name: "Job", chapters: 42, testament: "old", abbreviation: "Job" },
  { name: "Psalms", chapters: 150, testament: "old", abbreviation: "Ps" },
  { name: "Proverbs", chapters: 31, testament: "old", abbreviation: "Prov" },
  { name: "Ecclesiastes", chapters: 12, testament: "old", abbreviation: "Eccl" },
  { name: "Song of Solomon", chapters: 8, testament: "old", abbreviation: "Song" },
  { name: "Isaiah", chapters: 66, testament: "old", abbreviation: "Isa" },
  { name: "Jeremiah", chapters: 52, testament: "old", abbreviation: "Jer" },
  { name: "Lamentations", chapters: 5, testament: "old", abbreviation: "Lam" },
  { name: "Ezekiel", chapters: 48, testament: "old", abbreviation: "Ezek" },
  { name: "Daniel", chapters: 12, testament: "old", abbreviation: "Dan" },
  { name: "Hosea", chapters: 14, testament: "old", abbreviation: "Hos" },
  { name: "Joel", chapters: 3, testament: "old", abbreviation: "Joel" },
  { name: "Amos", chapters: 9, testament: "old", abbreviation: "Amos" },
  { name: "Obadiah", chapters: 1, testament: "old", abbreviation: "Obad" },
  { name: "Jonah", chapters: 4, testament: "old", abbreviation: "Jonah" },
  { name: "Micah", chapters: 7, testament: "old", abbreviation: "Mic" },
  { name: "Nahum", chapters: 3, testament: "old", abbreviation: "Nah" },
  { name: "Habakkuk", chapters: 3, testament: "old", abbreviation: "Hab" },
  { name: "Zephaniah", chapters: 3, testament: "old", abbreviation: "Zeph" },
  { name: "Haggai", chapters: 2, testament: "old", abbreviation: "Hag" },
  { name: "Zechariah", chapters: 14, testament: "old", abbreviation: "Zech" },
  { name: "Malachi", chapters: 4, testament: "old", abbreviation: "Mal" },
  // New Testament
  { name: "Matthew", chapters: 28, testament: "new", abbreviation: "Matt" },
  { name: "Mark", chapters: 16, testament: "new", abbreviation: "Mark" },
  { name: "Luke", chapters: 24, testament: "new", abbreviation: "Luke" },
  { name: "John", chapters: 21, testament: "new", abbreviation: "John" },
  { name: "Acts", chapters: 28, testament: "new", abbreviation: "Acts" },
  { name: "Romans", chapters: 16, testament: "new", abbreviation: "Rom" },
  { name: "1 Corinthians", chapters: 16, testament: "new", abbreviation: "1Cor" },
  { name: "2 Corinthians", chapters: 13, testament: "new", abbreviation: "2Cor" },
  { name: "Galatians", chapters: 6, testament: "new", abbreviation: "Gal" },
  { name: "Ephesians", chapters: 6, testament: "new", abbreviation: "Eph" },
  { name: "Philippians", chapters: 4, testament: "new", abbreviation: "Phil" },
  { name: "Colossians", chapters: 4, testament: "new", abbreviation: "Col" },
  { name: "1 Thessalonians", chapters: 5, testament: "new", abbreviation: "1Thess" },
  { name: "2 Thessalonians", chapters: 3, testament: "new", abbreviation: "2Thess" },
  { name: "1 Timothy", chapters: 6, testament: "new", abbreviation: "1Tim" },
  { name: "2 Timothy", chapters: 4, testament: "new", abbreviation: "2Tim" },
  { name: "Titus", chapters: 3, testament: "new", abbreviation: "Titus" },
  { name: "Philemon", chapters: 1, testament: "new", abbreviation: "Phlm" },
  { name: "Hebrews", chapters: 13, testament: "new", abbreviation: "Heb" },
  { name: "James", chapters: 5, testament: "new", abbreviation: "Jas" },
  { name: "1 Peter", chapters: 5, testament: "new", abbreviation: "1Pet" },
  { name: "2 Peter", chapters: 3, testament: "new", abbreviation: "2Pet" },
  { name: "1 John", chapters: 5, testament: "new", abbreviation: "1John" },
  { name: "2 John", chapters: 1, testament: "new", abbreviation: "2John" },
  { name: "3 John", chapters: 1, testament: "new", abbreviation: "3John" },
  { name: "Jude", chapters: 1, testament: "new", abbreviation: "Jude" },
  { name: "Revelation", chapters: 22, testament: "new", abbreviation: "Rev" },
];

// bible-api.com uses these reference formats
export function getBibleApiRef(book: string, chapter: number): string {
  return `${book}+${chapter}`;
}

export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleApiResponse {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

export async function fetchChapter(book: string, chapter: number, translation = "kjv"): Promise<BibleApiResponse> {
  const ref = encodeURIComponent(`${book} ${chapter}`);
  const res = await fetch(`https://bible-api.com/${ref}?translation=${translation}`);
  if (!res.ok) throw new Error("Failed to fetch scripture");
  return res.json();
}

export const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#FBBF24" },
  { name: "Green", value: "#34D399" },
  { name: "Blue", value: "#60A5FA" },
  { name: "Pink", value: "#F472B6" },
  { name: "Orange", value: "#FB923C" },
];
