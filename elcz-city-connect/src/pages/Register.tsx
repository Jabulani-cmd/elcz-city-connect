import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { CheckCircle } from "lucide-react";

const Register = () => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [league, setLeague] = useState("none");
  const [confirmedInChurch, setConfirmedInChurch] = useState(false);
  const [baptized, setBaptized] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Check for duplicates
      let query = supabase.from("members").select("id", { count: "exact" })
        .ilike("first_name", firstName.trim())
        .ilike("last_name", lastName.trim());
      
      if (phone.trim()) {
        query = query.eq("phone", phone.trim());
      } else if (email.trim()) {
        query = query.eq("email", email.trim());
      }

      const { count } = await query;
      if (count && count > 0) {
        toast({ title: "Already Registered", description: "A member with these details already exists.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("members").insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        gender: gender || null,
        date_of_birth: dob || null,
        address: address.trim() || null,
        league,
        confirmed_in_church: confirmedInChurch,
        baptized,
        is_active: true,
      });
      if (error) {
        if (error.message.includes("duplicate") || error.code === "23505") {
          toast({ title: "Already Registered", description: "A member with these details already exists.", variant: "destructive" });
        } else {
          throw error;
        }
        return;
      }
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const leagues = [
    { value: "none", label: t.register_no_league },
    { value: "youth", label: t.register_youth },
    { value: "men", label: t.register_men },
    { value: "women", label: t.register_women },
    { value: "sunday_school", label: t.register_sunday_school },
  ];

  const genders = [
    { value: "male", label: t.register_male },
    { value: "female", label: t.register_female },
  ];

  if (submitted) {
    return (
      <Layout>
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 max-w-lg text-center">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">{t.register_success}</h2>
            <p className="text-muted-foreground">{t.register_success_desc}</p>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-12 sm:py-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">{t.register_title}</h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">{t.register_subtitle}</p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="border-border shadow-soft">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t.register_first_name}</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required maxLength={100} />
                  </div>
                  <div>
                    <Label>{t.register_last_name}</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required maxLength={100} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t.register_email}</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                  </div>
                  <div>
                    <Label>{t.register_phone}</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t.register_gender}</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {genders.map((g) => (
                          <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.register_dob}</Label>
                    <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>{t.register_address}</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={255} />
                </div>
                <div>
                  <Label>{t.register_league}</Label>
                  <Select value={league} onValueChange={setLeague}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {leagues.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="confirmedInChurch"
                    checked={confirmedInChurch}
                    onChange={(e) => setConfirmedInChurch(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <Label htmlFor="confirmedInChurch" className="cursor-pointer text-sm">
                    {t.register_confirmed_label}
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="baptized"
                    checked={baptized}
                    onChange={(e) => setBaptized(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <Label htmlFor="baptized" className="cursor-pointer text-sm">
                    {t.register_baptized_label}
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "..." : t.register_submit}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Register;
