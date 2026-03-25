import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Milestone, Calendar } from "lucide-react";

const liturgicalYear = [
  { season: "Advent", color: "#7C3AED", weeks: "4 weeks before Christmas", dates: "Dec 1 – Dec 24", readings: ["Isaiah 2:1-5", "Matthew 24:36-44", "Romans 13:11-14"], description: "A season of expectation and preparation for Christmas." },
  { season: "Christmas", color: "#F59E0B", weeks: "12 days", dates: "Dec 25 – Jan 5", readings: ["Luke 2:1-20", "John 1:1-18", "Isaiah 9:2-7"], description: "Celebration of the birth of Jesus Christ." },
  { season: "Epiphany", color: "#10B981", weeks: "4-9 weeks", dates: "Jan 6 – before Lent", readings: ["Matthew 2:1-12", "Isaiah 60:1-6", "Ephesians 3:1-12"], description: "Manifestation of Christ to the Gentiles." },
  { season: "Lent", color: "#8B5CF6", weeks: "40 days", dates: "Ash Wed – Easter", readings: ["Joel 2:1-2, 12-17", "Matthew 6:1-6, 16-21", "2 Corinthians 5:20b-6:10"], description: "A season of penitence and fasting leading to Easter." },
  { season: "Holy Week", color: "#DC2626", weeks: "1 week", dates: "Palm Sunday – Holy Saturday", readings: ["Matthew 21:1-11", "John 13:1-17, 31b-35", "Isaiah 52:13-53:12"], description: "The final week of Lent commemorating Christ's passion." },
  { season: "Easter", color: "#FBBF24", weeks: "50 days", dates: "Easter Sunday – Pentecost", readings: ["John 20:1-18", "Acts 2:14a, 22-32", "1 Peter 1:3-9"], description: "Celebration of the resurrection of Christ." },
  { season: "Pentecost", color: "#EF4444", weeks: "1 day", dates: "50 days after Easter", readings: ["Acts 2:1-21", "John 20:19-23", "1 Corinthians 12:3b-13"], description: "The coming of the Holy Spirit upon the apostles." },
  { season: "Ordinary Time", color: "#22C55E", weeks: "~33 weeks", dates: "After Pentecost", readings: ["Various Gospel readings", "Epistles", "Old Testament"], description: "The longest season, focusing on the life and teachings of Christ." },
  { season: "Reformation Day", color: "#EF4444", weeks: "1 day", dates: "October 31", readings: ["Romans 3:19-28", "John 8:31-36", "Psalm 46"], description: "Commemorating Martin Luther and the Protestant Reformation — central to Lutheran tradition." },
  { season: "Christ the King", color: "#F59E0B", weeks: "1 day", dates: "Last Sunday before Advent", readings: ["Ezekiel 34:11-16, 20-24", "Matthew 25:31-46", "Ephesians 1:15-23"], description: "Celebrating the universal authority of Christ." },
];

export default function LiturgicalAlmanac() {
  const [selectedSeason, setSelectedSeason] = useState("all");

  const filtered = selectedSeason === "all" ? liturgicalYear : liturgicalYear.filter(s => s.season === selectedSeason);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Milestone className="h-6 w-6" /> Liturgical Almanac</h2>

      <div className="max-w-xs">
        <Label>Filter Season</Label>
        <Select value={selectedSeason} onValueChange={setSelectedSeason}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Seasons</SelectItem>
            {liturgicalYear.map(s => <SelectItem key={s.season} value={s.season}>{s.season}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(s => (
          <Card key={s.season} className="border-l-4" style={{ borderLeftColor: s.color }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                {s.season}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{s.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" /> {s.dates} · {s.weeks}
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Suggested Readings:</p>
                <div className="flex flex-wrap gap-1">
                  {s.readings.map(r => <Badge key={r} variant="outline" className="text-xs">{r}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
