import { Clock, LocateFixed } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { labelOf, parseGps } from "@/lib/schema";
import { clockIn, clockOut, useShift } from "@/lib/shift";
import { upsert, useRows } from "@/lib/store";
import { isUsableFix, positionValues } from "@/lib/tracking";
import { Panel, nativeSelect } from "./kit";

const getFix = () => new Promise<GeolocationPosition>((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error("Location is not available on this device"));
  navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error("Could not get your location – check the location permission")), { enableHighAccuracy: true, timeout: 20_000 });
});

/** Clock in/out. Location sharing starts only after the employee reads and accepts the consent notice. */
export function ShiftPanel() {
  const auth = useAuth();
  const employees = useRows("employees").filter((e) => e.status === "Active");
  const shift = useShift();
  const mine = useMemo(() => employees.find((e) => e.email && auth.email && String(e.email).toLowerCase() === auth.email.toLowerCase()), [employees, auth.email]);
  const [pick, setPick] = useState("");
  const [ask, setAsk] = useState(false);
  const employeeId = shift?.employeeId ?? mine?.id ?? pick;
  const onShift = !!shift;

  const start = async () => {
    try { await getFix(); } catch (e) { return toast.error((e as Error).message); }
    clockIn(employeeId);
    setAsk(false);
    toast.success("Clocked in – sharing your location while you work");
  };

  if (!employees.length) return null;
  return (
    <Panel title="My shift">
      {onShift ? (
        <div className="space-y-2 text-sm">
          <p>Clocked in since {new Date(shift.clockedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Your location is shared with the farm manager while you are clocked in.</p>
          <Button variant="outline" className="w-full" onClick={() => { clockOut(); toast.success("Clocked out – location sharing stopped"); }}><Clock className="mr-2 h-4 w-4" />Clock out</Button>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          {!mine && <select className={nativeSelect} aria-label="Who are you?" value={pick} onChange={(e) => setPick(e.target.value)}><option value="">Who are you?</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>}
          <Button className="w-full" disabled={!employeeId} onClick={() => setAsk(true)}><Clock className="mr-2 h-4 w-4" />Clock in</Button>
          <p className="text-xs text-muted-foreground">You choose to share your location each shift. It stops when you clock out.</p>
        </div>
      )}
      <Dialog open={ask} onOpenChange={setAsk}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share your location while you work?</DialogTitle>
            <DialogDescription>Please read before you clock in.</DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            <li>Your phone’s location is sent to the farm owner and managers <b>only while you are clocked in</b>, and only while this app is open.</li>
            <li>It is used for your safety and to coordinate work on the farm – not outside working hours.</li>
            <li>When you clock out, sharing stops and your stored coordinates are cleared. Only your clock-in and clock-out times are kept.</li>
            <li>You can stop at any time with <b>Clock out</b>. You can ask the farm owner what is held about you (Zimbabwe Cyber and Data Protection Act).</li>
          </ul>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAsk(false)}>No thanks</Button>
            <Button onClick={() => { void start(); }}>I agree – clock in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

/** Herders record where an animal or group is right now (for animals without a tracker, or to correct one). */
export function CheckInPanel() {
  const animals = useRows("animals").filter((a) => a.status === "Active" || a.status === "Quarantined");
  const [animalId, setAnimalId] = useState("");
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const animal = animals.find((a) => a.id === animalId);

  const save = (fix: { lat: number; lng: number; accuracy?: number }) => {
    if (!animal) return;
    if (!isUsableFix(fix)) return toast.error("That location is not usable – try again outdoors or type the coordinates");
    upsert("positions", positionValues("Animal", animal.id, labelOf("animals", animal), fix, "Manual check-in"));
    toast.success(`${labelOf("animals", animal)} checked in`);
    setManual("");
  };
  const here = async () => {
    setBusy(true);
    try { const p = await getFix(); save({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Panel title="Check in an animal">
      <div className="space-y-2 text-sm">
        <select className={nativeSelect} aria-label="Animal" value={animalId} onChange={(e) => setAnimalId(e.target.value)}><option value="">Choose animal…</option>{animals.map((a) => <option key={a.id} value={a.id}>{labelOf("animals", a)}</option>)}</select>
        <Button className="w-full" disabled={!animal || busy} onClick={() => { void here(); }}><LocateFixed className="mr-2 h-4 w-4" />Record at my location</Button>
        <div className="flex gap-2">
          <input className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" aria-label="Coordinates" placeholder="-20.15, 28.58" value={manual} onChange={(e) => setManual(e.target.value)} />
          <Button variant="outline" disabled={!animal || !parseGps(manual)} onClick={() => { const g = parseGps(manual); if (g) save({ lat: g[0], lng: g[1] }); }}>Save</Button>
        </div>
        <p className="text-xs text-muted-foreground">Animals with a GPS collar or tag update on their own (set the device ID on the animal).</p>
      </div>
    </Panel>
  );
}
