import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { attachLocal, detachUser, setUser, useStore } from "@/lib/store";
import { Splash } from "./AuthScreen";

/** Loads the farm data on this device once someone has signed in, and applies that person’s role. Signing out hides it again. */
export function LocalBoot({ children }: { children: ReactNode }) {
  const { name, role, userId } = useAuth();
  const [ready, setReady] = useState(false);
  const farmId = useStore((s) => s.activeFarmId);
  useEffect(() => { attachLocal(); setReady(true); return () => { detachUser(); setReady(false); }; }, [userId]);
  useEffect(() => { if (ready && role) setUser({ name, role }); }, [ready, name, role, farmId]);
  return ready ? <>{children}</> : <Splash />;
}
