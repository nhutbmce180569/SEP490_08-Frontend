import { PATH } from "../../config/routes/route";

export type LegalNavItem = {
  label: string;
  href: string;
  description: string;
};

export const LEGAL_NAV: LegalNavItem[] = [
  {
    label: "Terms of Service",
    href: PATH.PUBLIC.TERMS,
    description: "Booking rules, cancellations, and platform use",
  },
  {
    label: "Privacy Policy",
    href: PATH.PUBLIC.PRIVACY,
    description: "How we collect and protect your data",
  },
];

export const LEGAL_FROM_LABELS: Record<string, string> = {
  [PATH.PUBLIC.REGISTER]: "Sign up",
  [PATH.PUBLIC.LOGIN]: "Sign in",
};
