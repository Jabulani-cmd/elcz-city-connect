import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { useTranslation } from "@/hooks/useTranslation";
import { CreditCard } from "lucide-react";
import roseLogo from "@/assets/umplogo2.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";

const Giving = () => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleComingSoon = () => {
    toast.info(t.giving_coming_soon);
  };

  const givingOptions = [
    {
      id: "one-time",
      title: t.giving_one_time_title,
      description: t.giving_one_time_desc,
      buttonLabel: t.giving_give_now,
    },
    {
      id: "project",
      title: t.giving_project_title,
      description: t.giving_project_desc,
      buttonLabel: t.giving_donate,
    },
    {
      id: "recurring",
      title: t.giving_recurring_title,
      description: t.giving_recurring_desc,
      buttonLabel: t.giving_setup_tithe,
    },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-purple py-12 sm:py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">{t.giving_title}</h1>
          <p className="text-primary-foreground/70 text-base sm:text-lg max-w-2xl mx-auto">{t.giving_subtitle}</p>
        </div>
      </section>

      {/* Scripture / Encouragement */}
      <section className="py-10 bg-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <img src={roseLogo} alt="Rose Logo" className="h-14 w-14 object-contain mx-auto mb-4" />
          <blockquote className="text-lg sm:text-xl italic text-foreground font-display leading-relaxed">
            "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
          </blockquote>
          <p className="text-muted-foreground mt-2 text-sm">— 2 Corinthians 9:7</p>
        </div>
      </section>

      {/* Giving Options */}
      <section className="py-12 sm:py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {givingOptions.map((option) => (
              <Card
                key={option.id}
                className={`text-center border-border/50 shadow-soft hover:shadow-medium transition-all cursor-pointer ${
                  selectedOption === option.id ? "ring-2 ring-primary border-primary" : ""
                }`}
                onClick={() => setSelectedOption(option.id)}
              >
                <CardHeader className="pb-4">
                  <div className="mx-auto mb-4 flex items-center justify-center">
                    <img src={roseLogo} alt="Rose Logo" className="h-[6.5rem] w-[6.5rem] object-contain" />
                  </div>
                  <CardTitle className="font-display text-lg">{option.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOption(option.id);
                    }}
                    variant={selectedOption === option.id ? "default" : "outline"}
                    className="w-full gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    {option.buttonLabel}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Giving Form */}
      {selectedOption && (
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 max-w-lg">
            <Card className="shadow-soft border-border">
              <CardHeader className="text-center">
                <img src={roseLogo} alt="Rose Logo" className="h-[5.25rem] w-[5.25rem] object-contain mx-auto mb-2" />
                <CardTitle className="font-display text-xl">
                  {selectedOption === "one-time" && t.giving_one_time_title}
                  {selectedOption === "project" && t.giving_project_title}
                  {selectedOption === "recurring" && t.giving_recurring_title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleComingSoon();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label>Full Name</Label>
                    <Input placeholder="Your full name" required />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="your@email.com" required />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input type="tel" placeholder="+263..." />
                  </div>
                  <div>
                    <Label>Amount (USD)</Label>
                    <Input type="number" min="1" step="0.01" placeholder="0.00" required />
                  </div>

                  {selectedOption === "project" && (
                    <div>
                      <Label>Select Project</Label>
                      <Select required>
                        <SelectTrigger><SelectValue placeholder="Choose a project" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="building">Building Fund</SelectItem>
                          <SelectItem value="outreach">Outreach Programs</SelectItem>
                          <SelectItem value="education">Education Support</SelectItem>
                          <SelectItem value="community">Community Initiatives</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedOption === "recurring" && (
                    <div>
                      <Label>Frequency</Label>
                      <Select required>
                        <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>Message (Optional)</Label>
                    <Textarea placeholder="Any special notes or prayer request" rows={3} />
                  </div>

                  <Button type="submit" className="w-full gap-2">
                    <CreditCard className="h-4 w-4" />
                    Proceed to Payment
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Payment processing coming soon. Your details will be saved.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Payment Methods */}
      <section className="py-12 bg-muted">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <img src={roseLogo} alt="Rose Logo" className="h-[5.25rem] w-[5.25rem] object-contain mx-auto mb-3" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Ways to Give</h2>
            <p className="text-muted-foreground text-sm">Choose any of the following payment methods available in Zimbabwe:</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-soft border-border">
              <CardContent className="p-6">
                <img src={roseLogo} alt="Rose Logo" className="h-[4rem] w-[4rem] object-contain mb-3 mx-auto" />
                <h3 className="font-display font-semibold text-foreground mb-2">EcoCash</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Send your offering via EcoCash to the church merchant number. Contact the church office for the EcoCash details.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-border">
              <CardContent className="p-6">
                <img src={roseLogo} alt="Rose Logo" className="h-[4rem] w-[4rem] object-contain mb-3 mx-auto" />
                <h3 className="font-display font-semibold text-foreground mb-2">InnBucks</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Transfer your giving via InnBucks. Contact the church office for the InnBucks wallet details.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-border">
              <CardContent className="p-6">
                <img src={roseLogo} alt="Rose Logo" className="h-[4rem] w-[4rem] object-contain mb-3 mx-auto" />
                <h3 className="font-display font-semibold text-foreground mb-2">OneMoney</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Send your offering via OneMoney mobile money. Contact the church office for details.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-border">
              <CardContent className="p-6">
                <img src={roseLogo} alt="Rose Logo" className="h-[4rem] w-[4rem] object-contain mb-3 mx-auto" />
                <h3 className="font-display font-semibold text-foreground mb-2">Bank Transfer (ZWG/USD)</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Make a direct deposit or bank transfer in ZWG or USD. Contact the church office for bank account details.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-border">
              <CardContent className="p-6">
                <img src={roseLogo} alt="Rose Logo" className="h-[4rem] w-[4rem] object-contain mb-3 mx-auto" />
                <h3 className="font-display font-semibold text-foreground mb-2">Mukuru / WorldRemit</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For diaspora members, send offerings via Mukuru or WorldRemit. Contact the church office for recipient details.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-border">
              <CardContent className="p-6">
                <img src={roseLogo} alt="Rose Logo" className="h-[4rem] w-[4rem] object-contain mb-3 mx-auto" />
                <h3 className="font-display font-semibold text-foreground mb-2">Sunday Service</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bring your offerings and tithes to our Sunday worship service at 10:00 AM. Offering envelopes are available.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t.giving_note}
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Giving;
