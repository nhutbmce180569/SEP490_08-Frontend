import { useTranslation } from "../../contexts/LocaleContext";
import { LegalDocumentLayout } from "./LegalDocumentLayout";
import {
  bookingTermsSections,
  BOOKING_TERMS_LAST_UPDATED,
} from "./bookingTermsContent";
import {
  bookingTermsSectionsVi,
  BOOKING_TERMS_LAST_UPDATED_VI,
} from "./bookingTermsContentVi";

export default function BookingTermsPage() {
  const { t, locale } = useTranslation();
  const isVi = locale === "vi";

  return (
    <LegalDocumentLayout
      title={t("legal.bookingTermsTitle")}
      subtitle={t("legal.bookingTermsSubtitle")}
      lastUpdated={isVi ? BOOKING_TERMS_LAST_UPDATED_VI : BOOKING_TERMS_LAST_UPDATED}
      sections={isVi ? bookingTermsSectionsVi : bookingTermsSections}
      relatedDocuments={[
        {
          label: t("legal.relatedTerms"),
          href: "/terms",
        },
        {
          label: t("legal.relatedPrivacy"),
          href: "/privacy",
        },
      ]}
    />
  );
}
