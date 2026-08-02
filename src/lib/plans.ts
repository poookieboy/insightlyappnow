export interface PlanDef {
  key: "monthly" | "sixmonth" | "yearly";
  label: string;
  price: number;
  days: number;
  period: string;
  tagline: string;
  badge?: string;
  savings?: string;
}

export const PLANS: Record<PlanDef["key"], PlanDef> = {
  monthly: {
    key: "monthly",
    label: "Monthly",
    price: 150,
    days: 30,
    period: "per month",
    tagline: "Great for trying Pro out",
  },
  sixmonth: {
    key: "sixmonth",
    label: "6 Months",
    price: 800,
    days: 182,
    period: "every 6 months",
    tagline: "Best value for a school term",
    badge: "Most popular",
    savings: "Save KES 100",
  },
  yearly: {
    key: "yearly",
    label: "Yearly",
    price: 1600,
    days: 365,
    period: "per year",
    tagline: "Cheapest per month",
    savings: "Save KES 200",
  },
};

export const PLAN_KEYS = Object.keys(PLANS) as PlanDef["key"][];

export const PRO_FEATURES = [
  "Unlimited Iris AI tutoring & voice chat",
  "Unlimited AI revision papers & marking",
  "Full CBC curriculum notes library",
  "Advanced study analytics & graphs",
  "Priority support from Ezen Uel Studios",
];

export interface SponsorTier {
  amount: number;
  level: string;
  title: string;
  blurb: string;
  emoji: string;
}

export const SPONSOR_TIERS: SponsorTier[] = [
  { amount: 100, level: "supporter", title: "Supporter", blurb: "Buys one student a week of Pro", emoji: "🌱" },
  { amount: 200, level: "friend", title: "Friend", blurb: "Keeps Iris answering for a day", emoji: "💙" },
  { amount: 500, level: "champion", title: "Champion", blurb: "Sponsors a full month for a learner", emoji: "🚀" },
  { amount: 1000, level: "hero", title: "Hero", blurb: "Powers a whole class of learners", emoji: "🏆" },
];
