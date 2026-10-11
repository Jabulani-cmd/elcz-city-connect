import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { canRead } from "@/lib/permissions";
import { useUser } from "@/lib/store";
import type { Section } from "@/lib/types";

export function Guard({ section, children }: { section: Section; children: ReactNode }) {
  const { role } = useUser();
  if (canRead(role, section)) return <>{children}</>;
  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border bg-card p-8 text-center">
      <Lock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <h1 className="text-lg font-semibold">No access</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your role ({role}) can’t open this part of the farm. Ask the farm owner if you need access.</p>
    </div>
  );
}
