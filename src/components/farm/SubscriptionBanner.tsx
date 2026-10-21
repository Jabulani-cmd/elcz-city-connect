import { Clock, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBilling } from "@/lib/billing";
import { useUser } from "@/lib/store";

const SEEN = "farmhelper.trialEndedSeen";

/** Free-trial countdown, the "trial ended" bar, and a one-time prompt to choose a plan when the trial lapses. */
export function SubscriptionBanner() {
  const { status, daysLeft, farmId } = useBilling();
  const owner = useUser().role === "Owner";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (status !== "expired") return;
    try { if (sessionStorage.getItem(SEEN) === farmId) return; sessionStorage.setItem(SEEN, farmId); } catch { /* show anyway */ }
    setOpen(true);
  }, [status, farmId]);

  if (status === "trial") {
    return (
      <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm">
        <span className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-primary" /><span><b>{daysLeft} day{daysLeft === 1 ? "" : "s"} left</b> in your free trial.</span></span>
        {owner && <Button asChild size="sm"><Link to="/billing">Choose a plan</Link></Button>}
      </div>
    );
  }
  if (status === "active" && daysLeft <= 5) {
    return (
      <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm">
        <span><b>Your plan ends in {daysLeft} day{daysLeft === 1 ? "" : "s"}.</b> Renew to keep adding records.</span>
        {owner && <Button asChild size="sm"><Link to="/billing">Renew</Link></Button>}
      </div>
    );
  }
  if (status !== "expired") return null;
  return (
    <>
      <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm">
        <span className="flex items-center gap-2"><Lock className="h-4 w-4 shrink-0 text-danger" /><span><b>Your free trial has ended.</b> Your records are safe and can be viewed, but nothing can be added or changed until {owner ? "you choose a plan" : "the farm owner chooses a plan"}.</span></span>
        {owner && <Button asChild size="sm"><Link to="/billing">Choose a plan</Link></Button>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your 7-day free trial has ended</DialogTitle>
            <DialogDescription>{owner ? "Choose a plan to keep recording. Pay online with EcoCash, OneMoney, InnBucks or card. Your records stay safe either way." : "Ask the farm owner to choose a plan. You can still look at all your records."}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>View my records</Button>
            {owner && <Button onClick={() => { setOpen(false); navigate("/billing"); }}>Choose a plan</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
