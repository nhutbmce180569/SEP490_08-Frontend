import { LegalDocumentLayout } from "./LegalDocumentLayout";
import { termsSections, TERMS_LAST_UPDATED } from "./termsContent";
import { termsSectionsVi, TERMS_LAST_UPDATED_VI } from "./termsContentVi";
import { PATH } from "../../config/routes/route";
import { useTranslation } from "../../contexts/LocaleContext";

export default function TermsOfServicePage() {
  const { t, locale } = useTranslation();
  const sections = locale === "vi" ? termsSectionsVi : termsSections;
  const lastUpdated = locale === "vi" ? TERMS_LAST_UPDATED_VI : TERMS_LAST_UPDATED;

  return (
    <LegalDocumentLayout
      activePath={PATH.PUBLIC.TERMS}
      title={t("legal.termsTitle")}
      subtitle={t("legal.termsSubtitle")}
      lastUpdated={lastUpdated}
      sections={sections}
      relatedLink={{ label: t("legal.relatedPrivacy"), href: PATH.PUBLIC.PRIVACY }}
    />
  );
}
