import { LegalDocumentLayout } from "./LegalDocumentLayout";
import { privacySections, PRIVACY_LAST_UPDATED } from "./privacyContent";
import { privacySectionsVi, PRIVACY_LAST_UPDATED_VI } from "./privacyContentVi";
import { PATH } from "../../config/routes/route";
import { useTranslation } from "../../contexts/LocaleContext";

export default function PrivacyPolicyPage() {
  const { t, locale } = useTranslation();
  const sections = locale === "vi" ? privacySectionsVi : privacySections;
  const lastUpdated = locale === "vi" ? PRIVACY_LAST_UPDATED_VI : PRIVACY_LAST_UPDATED;

  return (
    <LegalDocumentLayout
      activePath={PATH.PUBLIC.PRIVACY}
      title={t("legal.privacyTitle")}
      subtitle={t("legal.privacySubtitle")}
      lastUpdated={lastUpdated}
      sections={sections}
      relatedLink={{ label: t("legal.relatedTerms"), href: PATH.PUBLIC.TERMS }}
    />
  );
}
