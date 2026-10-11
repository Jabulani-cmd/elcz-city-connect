import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getFile } from "@/lib/files";
import { useAuth } from "@/lib/auth";
import { supabaseRemote } from "@/lib/remote";
import { attachUser, detachUser, getState } from "@/lib/store";
import { createSyncEngine, setSyncEngine, useOnline } from "@/lib/sync";
import { Splash } from "./AuthScreen";

/** Loads the signed-in user's data, accepts farm invitations, runs the first sync, then keeps syncing in the background. */
export function CloudBoot({ children }: { children: ReactNode }) {
  const { userId, name } = useAuth();
  const online = useOnline();
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    attachUser(userId, name);
    const engine = createSyncEngine({ remote: supabaseRemote(supabase), readFile: (id) => getFile(id), online: () => navigator.onLine });
    setSyncEngine(engine);
    let stop = () => {};
    let cancelled = false;
    void (async () => {
      if (navigator.onLine) { try { await supabase!.rpc("accept_invites"); } catch { /* invites are retried on the next sign-in */ } }
      await engine.syncNow();
      if (cancelled) return;
      // Offline with nothing saved yet: don't offer to create a farm that may already exist in the cloud.
      if (getState().farms.length === 0 && !navigator.onLine) return;
      setReady(true);
      stop = engine.start();
    })();
    return () => { cancelled = true; stop(); setSyncEngine(null); detachUser(); setReady(false); };
  }, [userId, name, attempt]);

  useEffect(() => { if (!ready && online) setAttempt((n) => n + 1); }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <Splash>{online ? "Loading your farm…" : "You’re offline. Connect to the internet to load your farm for the first time."}</Splash>;
  return <>{children}</>;
}
