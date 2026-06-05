import { Link, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { Phone, Send } from "lucide-react";
import { PATH } from "../../config/routes/route";
import { useTranslation } from "../../contexts/LocaleContext";

export default function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const location = useLocation();
  const legalLinkState = { from: location.pathname };

  const groups = useMemo(
    () => [
      {
        title: t("footer.company"),
        links: [
          { label: t("footer.aboutUs"), href: PATH.PUBLIC.ABOUT },
          t("footer.reviews"),
          t("footer.contactUs"),
          t("footer.travelGuides"),
          t("footer.dataPolicy"),
          t("footer.cookiePolicy"),
          t("footer.legal"),
          t("footer.sitemap"),
        ],
      },
      {
        title: t("footer.supportSection"),
        links: [
          t("footer.getInTouch"),
          t("footer.helpCenter"),
          t("footer.liveChat"),
          t("footer.howItWorks"),
        ],
      },
    ],
    [t],
  );

  return (
    <footer className="mt-auto border-t border-brand/15 bg-white/80 backdrop-blur-xl">
      <div className="page-container py-4">
        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-brand/10 py-8 md:py-10">
          <div className="flex min-w-[280px] items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-brand shadow-sm">
              <Phone className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-base font-semibold text-navy md:text-lg">
              {t("footer.speakExpert")}{" "}
              <span className="text-brand">{t("footer.phone")}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-navy">{t("footer.followUs")}</span>
            {["in", "fb", "tw", "yt"].map((k) => (
              <button
                key={k}
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-navy/10 bg-white/90 text-xs font-bold text-navy transition-colors hover:border-brand/30 hover:bg-brand-light hover:text-brand"
                aria-label={k}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="travel-heading mb-3 text-lg">{t("footer.contact")}</h4>
            <p className="text-sm leading-7 text-slate-600">{t("footer.address")}</p>
            <p className="mt-2 text-sm font-medium text-brand">{t("footer.email")}</p>
          </div>

          {groups.map((g) => (
            <div key={g.title}>
              <h4 className="travel-heading mb-3 text-lg">{g.title}</h4>
              <ul className="space-y-2">
                {g.links.map((l) => {
                  const label = typeof l === "string" ? l : l.label;
                  const href = typeof l === "string" ? undefined : l.href;

                  return (
                    <li key={label}>
                      {href ? (
                        <Link
                          to={href}
                          className="text-sm text-slate-600 transition-colors hover:text-brand !no-underline"
                        >
                          {label}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="text-sm text-slate-600 transition-colors hover:text-brand"
                        >
                          {label}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="travel-heading mb-3 text-lg">{t("footer.newsletter")}</h4>
            <p className="mb-4 text-sm text-slate-600">{t("footer.newsletterDesc")}</p>

            <div className="relative mb-6">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("footer.emailPlaceholder")}
                className="input-field h-14 pr-24"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand-light"
              >
                <Send className="h-4 w-4" />
                {t("common.send")}
              </button>
            </div>

            <h4 className="mb-2 text-sm font-bold text-navy">{t("footer.mobileApps")}</h4>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <span>{t("footer.iosApp")}</span>
              <span>{t("footer.androidApp")}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy/8 py-5 text-xs text-navy-70">
          <div>
            © {new Date().getFullYear()} {t("footer.copyrightBrand")}. {t("footer.copyright")}
          </div>
          <div className="flex gap-4">
            <Link
              to={PATH.PUBLIC.PRIVACY}
              state={legalLinkState}
              className="transition-colors hover:text-brand !no-underline"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              to={PATH.PUBLIC.TERMS}
              state={legalLinkState}
              className="transition-colors hover:text-brand !no-underline"
            >
              {t("footer.terms")}
            </Link>
            <button type="button" className="transition-colors hover:text-brand">
              {t("common.support")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
