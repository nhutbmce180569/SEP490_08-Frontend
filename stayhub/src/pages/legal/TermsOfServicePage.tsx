import { LegalDocumentLayout } from "./LegalDocumentLayout";
import { termsSections, TERMS_LAST_UPDATED } from "./termsContent";
import { PATH } from "../../config/routes/route";

export default function TermsOfServicePage() {
  return (
    <LegalDocumentLayout
      activePath={PATH.PUBLIC.TERMS}
      title="Terms of Service"
      subtitle="Please read these terms carefully before using StayHub to search for, book, or purchase tours and travel experiences."
      lastUpdated={TERMS_LAST_UPDATED}
      sections={termsSections}
      relatedLink={{ label: "Privacy Policy", href: PATH.PUBLIC.PRIVACY }}
    />
  );
}
