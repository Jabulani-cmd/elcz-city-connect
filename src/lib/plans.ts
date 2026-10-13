/**
 * Subscription plans for FarmHelper (Zimbabwe). Prices are in USD, the most widely used trading currency;
 * the planned payment gateway is Paynow (EcoCash, OneMoney, InnBucks, Visa/Mastercard).
 * NOTE: this is display/config only. Billing and trial enforcement need a backend (not wired up yet).
 */
export const TRIAL_DAYS = 14;

export type Plan = {
  id: "starter" | "farmer" | "commercial";
  name: string;
  tagline: string;
  /** USD per month; yearly = 10 months for the price of 12 */
  monthly: number;
  highlight?: boolean;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "starter", name: "Starter", tagline: "Smallholder and family farms", monthly: 5,
    features: ["1 user", "Up to 5 fields and 50 animals", "Crops, livestock, tasks and stock records", "Income and expense book", "Works offline on your phone", "Basic reports (PDF / Excel)"],
  },
  {
    id: "farmer", name: "Farmer", tagline: "Growing and mixed farms", monthly: 15, highlight: true,
    features: ["Up to 5 team members with roles", "Up to 30 fields and 500 animals", "Pastures, grazing rotation, breeding and vaccination alerts", "Budgets and profit by crop, field and herd", "All 30 reports", "Farm assistant and farm map"],
  },
  {
    id: "commercial", name: "Commercial", tagline: "Large estates and agribusinesses", monthly: 40,
    features: ["Unlimited team members and roles", "Unlimited fields and animals", "Multiple farms under one account", "Payroll and attendance for staff", "Priority WhatsApp support", "Data export and backups"],
  },
];

export const PAYMENT_METHODS = ["EcoCash", "OneMoney", "InnBucks", "Visa / Mastercard"];
export const yearlyPrice = (monthly: number) => monthly * 10;
