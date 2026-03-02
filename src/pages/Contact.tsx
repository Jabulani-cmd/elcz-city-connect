import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Facebook, Instagram, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

const Contact = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast({ title: t.contact_thank_you, description: t.contact_received });
  };

  return (
    <Layout>
      <section className="bg-gradient-purple py-12 sm:py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">{t.contact_title}</h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">{t.contact_subtitle}</p>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">{t.contact_get_in_touch}</h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div><p className="font-medium text-foreground">{t.contact_address}</p><p className="text-muted-foreground text-sm">City Centre, Bulawayo, Zimbabwe</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div><p className="font-medium text-foreground">{t.contact_phone}</p><p className="text-muted-foreground text-sm">+263 71 206 4556 / +263 77 500 7746</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div><p className="font-medium text-foreground">{t.contact_email_label}</p><p className="text-muted-foreground text-sm">info@citycentre-elcz.org</p></div>
                </div>
              </div>
              <div className="flex gap-3 mb-8">
                <a href="https://www.facebook.com/profile.php?id=100064839849337" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-5 w-5" /> Facebook</a>
                <a href="https://www.instagram.com/elczbyonorthparish_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /> Instagram</a>
                <a href="https://www.instagram.com/citycentre_congregation" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /> Instagram</a>
              </div>
              <div className="rounded-lg overflow-hidden border border-border shadow-soft">
                <iframe title="City Centre Congregation Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3776.123456789!2d28.58!3d-20.16!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjDCsDA5JzM2LjAiUyAyOMKwMzQnNDguMCJF!5e0!3m2!1sen!2szw!4v1234567890"
                  width="100%" height="250" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">{t.contact_send_message}</h2>
              {submitted ? (
                <Card className="shadow-soft border-border">
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-display text-xl font-semibold text-foreground">{t.contact_thank_you}</h3>
                    <p className="text-muted-foreground mt-2">{t.contact_received}</p>
                    <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>{t.contact_send_another}</Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-soft border-border">
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div><Label>{t.appointments_full_name}</Label><Input placeholder={t.appointments_full_name} required /></div>
                      <div><Label>{t.contact_email_label}</Label><Input type="email" placeholder="your@email.com" required /></div>
                      <div><Label>{t.contact_subject}</Label><Input placeholder={t.contact_subject} required /></div>
                      <div><Label>{t.appointments_message}</Label><Textarea placeholder={t.contact_your_message} rows={5} required /></div>
                      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-purple-dark">{t.contact_send}</Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
