import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, Heart, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

const Appointments = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [appointmentSubmitted, setAppointmentSubmitted] = useState(false);
  const [counsellingSubmitted, setCounsellingSubmitted] = useState(false);

  const handleAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setAppointmentSubmitted(true);
    toast({ title: t.appointments_submitted, description: t.appointments_submitted_desc });
  };

  const handleCounselling = (e: React.FormEvent) => {
    e.preventDefault();
    setCounsellingSubmitted(true);
    toast({ title: t.appointments_received, description: t.appointments_received_desc });
  };

  return (
    <Layout>
      <section className="bg-gradient-purple py-12 sm:py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">{t.appointments_title}</h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">{t.appointments_subtitle}</p>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-6 w-6 text-primary" />
                <h2 className="font-display text-2xl font-bold text-foreground">{t.appointments_book_title}</h2>
              </div>
              {appointmentSubmitted ? (
                <Card className="shadow-soft border-border">
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-display text-xl font-semibold text-foreground">{t.appointments_submitted}</h3>
                    <p className="text-muted-foreground mt-2">{t.appointments_submitted_desc}</p>
                    <Button className="mt-6" variant="outline" onClick={() => setAppointmentSubmitted(false)}>{t.appointments_book_another}</Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-soft border-border">
                  <CardContent className="p-6">
                    <form onSubmit={handleAppointment} className="space-y-4">
                      <div><Label>{t.appointments_full_name}</Label><Input placeholder={t.appointments_full_name} required /></div>
                      <div><Label>{t.appointments_email}</Label><Input type="email" placeholder="your@email.com" required /></div>
                      <div><Label>{t.appointments_phone}</Label><Input type="tel" placeholder="+263..." required /></div>
                      <div>
                        <Label>{t.appointments_with}</Label>
                        <Select required><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pastor-ndlovu">Rev. M. Ndlovu (Pastor in Charge)</SelectItem>
                            <SelectItem value="chairperson-ngwenya">Mrs. P. Ngwenya (Chairperson)</SelectItem>
                            <SelectItem value="vice-chair-ndou">Mr. P. Ndou (Vice-chairperson)</SelectItem>
                            <SelectItem value="secretary-dube">Mrs. T. Dube (Secretary)</SelectItem>
                            <SelectItem value="treasurer-ncube">Mrs. T. Ncube (Treasurer)</SelectItem>
                            <SelectItem value="elder-jamela-l">Mr. L. Jamela</SelectItem>
                            <SelectItem value="elder-jamela-s">Mrs. S. Jamela</SelectItem>
                            <SelectItem value="elder-mangena">Miss M. Mangena</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>{t.appointments_date}</Label><Input type="date" required /></div>
                      <div><Label>{t.appointments_reason}</Label><Textarea placeholder={t.appointments_reason} rows={3} /></div>
                      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-purple-dark">{t.appointments_request}</Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6">
                <Heart className="h-6 w-6 text-primary" />
                <h2 className="font-display text-2xl font-bold text-foreground">{t.appointments_counselling_title}</h2>
              </div>
              <p className="text-muted-foreground mb-4 text-sm">{t.appointments_counselling_note}</p>
              {counsellingSubmitted ? (
                <Card className="shadow-soft border-border">
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-display text-xl font-semibold text-foreground">{t.appointments_received}</h3>
                    <p className="text-muted-foreground mt-2">{t.appointments_received_desc}</p>
                    <Button className="mt-6" variant="outline" onClick={() => setCounsellingSubmitted(false)}>{t.appointments_submit_another}</Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-soft border-border">
                  <CardContent className="p-6">
                    <form onSubmit={handleCounselling} className="space-y-4">
                      <div><Label>{t.appointments_full_name}</Label><Input placeholder={t.appointments_full_name} required /></div>
                      <div><Label>{t.appointments_contact_method}</Label><Input placeholder={t.appointments_contact_method} required /></div>
                      <div>
                        <Label>{t.appointments_type}</Label>
                        <Select required><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grief">{t.appointments_grief}</SelectItem>
                            <SelectItem value="marriage">{t.appointments_marriage}</SelectItem>
                            <SelectItem value="spiritual">{t.appointments_spiritual}</SelectItem>
                            <SelectItem value="youth">{t.appointments_youth_counselling}</SelectItem>
                            <SelectItem value="other">{t.appointments_other}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Session Mode</Label>
                        <Select required><SelectTrigger><SelectValue placeholder="Select session mode" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in-person">In-Person</SelectItem>
                            <SelectItem value="telephonic">Telephonically</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>{t.appointments_preferred_dates}</Label><Input placeholder="e.g. Weekdays after 2 PM" required /></div>
                      <div><Label>{t.appointments_message}</Label><Textarea placeholder={t.appointments_message} rows={4} required /></div>
                      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-purple-dark">{t.appointments_submit_request}</Button>
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

export default Appointments;
