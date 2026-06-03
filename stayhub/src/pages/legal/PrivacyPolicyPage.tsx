import { LegalDocumentLayout } from "./LegalDocumentLayout";
import { privacySections, PRIVACY_LAST_UPDATED } from "./privacyContent";
import { PATH } from "../../config/routes/route";

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout
      activePath={PATH.PUBLIC.PRIVACY}
      title="Privacy Policy"
      subtitle="This policy describes how StayHub collects, uses, stores, and protects your personal data when you use our tour booking platform."
      lastUpdated={PRIVACY_LAST_UPDATED}
      sections={privacySections}
      relatedLink={{ label: "Terms of Service", href: PATH.PUBLIC.TERMS }}
    />
  );
}
