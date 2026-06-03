import { PATH } from "../../config/routes/route";

export type LegalNavItem = {
  labelKey: string;
  href: string;
  descriptionKey: string;
};

export const LEGAL_NAV: LegalNavItem[] = [
  {
    labelKey: "legal.termsNavLabel",
    href: PATH.PUBLIC.TERMS,
    descriptionKey: "legal.termsNavDesc",
  },
  {
    labelKey: "legal.privacyNavLabel",
    href: PATH.PUBLIC.PRIVACY,
    descriptionKey: "legal.privacyNavDesc",
  },
];

export const LEGAL_FROM_LABEL_KEYS: Record<string, string> = {
  [PATH.PUBLIC.REGISTER]: "legal.backToRegistration",
  [PATH.PUBLIC.LOGIN]: "legal.backToSignIn",
};
