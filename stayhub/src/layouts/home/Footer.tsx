import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { ExternalLink, Mail, MapPin } from "lucide-react";
import { PATH } from "../../config/routes/route";
import { useTranslation } from "../../contexts/LocaleContext";
import { StayHubLogo } from "../../components/brand/StayHubLogo";
import { useSystemSettings } from "../../features/system/hooks/useSystemSettings";

const FALLBACK_MAP_LINK =
  "https://www.google.com/maps/search/?api=1&query=Tr%C6%B0%E1%BB%9Dng%20%C4%90%E1%BA%A1i%20h%E1%BB%8Dc%20FPT%20C%E1%BA%A7n%20Th%C6%A1%20600%20Nguy%E1%BB%85n%20V%C4%83n%20C%E1%BB%AB%20n%E1%BB%91i%20d%C3%A0i";

export default function Footer() {
  const { t } = useTranslation();
  const location = useLocation();
  const legalLinkState = { from: location.pathname };
  const { getSetting, getLocalizedSetting } = useSystemSettings();

  const companyEmail = getSetting("CompanyEmail") || t("footer.email");
  const companyAddress = getSetting("CompanyAddress") || t("footer.address");
  const companyDescription = getLocalizedSetting("CompanyDescription") || t("footer.brandDesc");
  const mapIframeStr = getSetting("MapIframeUrl");
  let mapLink = FALLBACK_MAP_LINK;
  
  if (mapIframeStr) {
    if (mapIframeStr.startsWith("http")) {
        mapLink = mapIframeStr;
    } else {
        const srcMatch = mapIframeStr.match(/src="([^"]+)"/);
        if (srcMatch) mapLink = srcMatch[1];
    }
  }

  const groups = useMemo(
    () => [
      {
        title: t("footer.company"),
        links: [
          { label: t("footer.aboutUs"), href: PATH.PUBLIC.ABOUT },
          { label: t("footer.reviews"), href: PATH.PUBLIC.INFO("reviews") },
          { label: t("footer.contactUs"), href: PATH.PUBLIC.INFO("contact") },
          { label: t("footer.travelGuides"), href: PATH.PUBLIC.INFO("travel-guides") },
        ],
      },
      {
        title: t("footer.supportSection"),
        links: [
          { label: t("footer.helpCenter"), href: PATH.PUBLIC.INFO("help-center") },
          { label: t("footer.liveChat"), href: PATH.PUBLIC.AI_ASSISTANT },
          { label: t("footer.howItWorks"), href: PATH.PUBLIC.INFO("how-it-works") },
          { label: t("footer.sitemap"), href: PATH.PUBLIC.INFO("sitemap") },
        ],
      },
      {
        title: t("footer.legal"),
        links: [
          { label: t("footer.privacy"), href: PATH.PUBLIC.PRIVACY },
          { label: t("footer.terms"), href: PATH.PUBLIC.TERMS },
          { label: t("footer.dataPolicy"), href: PATH.PUBLIC.PRIVACY },
          { label: t("footer.cookiePolicy"), href: PATH.PUBLIC.PRIVACY },
        ],
      },
    ],
    [t],
  );

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="page-container py-8 md:py-10">
        <div className="grid gap-8 border-b border-slate-200 pb-8 dark:border-slate-800 lg:grid-cols-[minmax(260px,0.95fr)_minmax(0,1.05fr)]">
          <div className="min-w-0">
            <StayHubLogo className="mb-3" />
            <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400 whitespace-pre-line">
              {companyDescription}
            </p>

            <div className="mt-5 space-y-2.5">
              <a
                href={`mailto:${companyEmail}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-brand transition-colors hover:text-brand-hover dark:text-sky-300 dark:hover:text-sky-200 !no-underline"
              >
                <Mail className="h-4 w-4" aria-hidden />
                <span className="break-all">{companyEmail}</span>
              </a>
              <p className="flex max-w-xl items-start gap-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand dark:text-sky-300" aria-hidden />
                <span>{companyAddress}</span>
              </p>
              <a
                href={mapLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand transition-colors hover:text-brand-hover dark:text-sky-300 dark:hover:text-sky-200 !no-underline"
              >
                {t("footer.openMap")}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          </div>

          <div className="grid gap-7 sm:grid-cols-3">
            {groups.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h4 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-900 dark:text-slate-100">
                  {group.title}
                </h4>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        state={legalLinkState}
                        className="text-sm leading-6 text-slate-600 transition-colors hover:text-brand dark:text-slate-400 dark:hover:text-sky-300 !no-underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-5 text-xs text-slate-500 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            © {new Date().getFullYear()} {t("footer.copyrightBrand")}. {t("footer.copyright")}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {["in", "fb", "tw", "yt"].map((item) => (
              <button
                key={item}
                type="button"
                className="font-bold uppercase tracking-wide transition-colors hover:text-brand dark:hover:text-sky-300"
                aria-label={item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
