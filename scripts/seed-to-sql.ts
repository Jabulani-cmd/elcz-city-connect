// Dev check: converts the sample farm with the app's own codec into INSERTs, so the real tables can validate every column.
import { createHash } from "node:crypto";
import { seedDemo } from "../src/lib/seed";
import { emptyState } from "../src/lib/store";
import { TABLES, farmToDb, toDb } from "../src/lib/tables";

const uuid = (s: string) => { const h = createHash("sha1").update(s).digest("hex"); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`; };
const demo = seedDemo(emptyState());
const ids = new Set<string>([demo.farms[0].id, ...Object.values(demo.data).flat().map((r) => r.id)]);
const remap = (v: unknown): unknown => (typeof v === "string" && ids.has(v) ? uuid(v) : Array.isArray(v) ? v.map(remap) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, remap(x)])) : v);
const q = (o: unknown) => `'${JSON.stringify(o).replace(/'/g, "''")}'`;
const out: string[] = ["insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000000aa','seed@x.com') on conflict do nothing;"];
const farm = remap(farmToDb(demo.farms[0] as never)) as Record<string, unknown>;
out.push(`insert into public.farms select * from json_populate_recordset(null::public.farms, ${q([{ ...farm, created_by: "00000000-0000-0000-0000-0000000000aa", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" }])});`);
let n = 0;
for (const [c, table] of Object.entries(TABLES)) {
  const rows = (demo.data[c] ?? []).map((r) => ({ ...(remap(toDb(c, remap(r) as never)) as object), updated_at: "2026-10-01T00:00:00Z" })); // PostgREST inserts use column defaults; json_populate_recordset does not
  if (!rows.length) continue;
  n += rows.length;
  out.push(`insert into public.${table} select * from json_populate_recordset(null::public.${table}, ${q(rows)});`);
}
out.push(`select 'inserted ${n} rows into ' || count(*) || ' tables' from (select 1) x, (select 1) y;`);
out.push(`select 'farm_changes tables: ' || (select count(*) from jsonb_object_keys((public.farm_changes('${uuid("demo-farm")}', null) -> 'tables')));`);
out.push(`select 'farm_changes since future (expect 0): ' || (select count(*) from jsonb_object_keys((public.farm_changes('${uuid("demo-farm")}', now() + interval '1 day') -> 'tables')));`);
console.log(out.join("\n"));
