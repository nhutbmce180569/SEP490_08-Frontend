import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Mail, Shield } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { PATH } from "../../config/routes/route";
import { LEGAL_NAV } from "./legalNav";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  closingParagraphs?: string[];
};

type LegalDocumentLayoutProps = {
  title: string;
  subtitle: string;
  lastUpdated: string;
  activePath: string;
  sections: LegalSection[];
  relatedLink?: { label: string; href: string };
};

const BACK_LABELS: Record<string, string> = {
  [PATH.PUBLIC.REGISTER]: "Back to registration",
  [PATH.PUBLIC.LOGIN]: "Back to sign in",
};

function LegalBackLink() {
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: string } | null)?.from;

  if (from && BACK_LABELS[from]) {
    return (
      <Link
        to={from}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-brand !no-underline"
      >
        <ArrowLeft className="h-4 w-4" />
        {BACK_LABELS[from]}
      </Link>
    );
  }

  if (window.history.length > 1) {
    return (
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-brand outline-none"
      >
        <ArrowLeft className="h-4 w-4" />
        Go back
      </button>
    );
  }

  return null;
}

export function LegalDocumentLayout({
  title,
  subtitle,
  lastUpdated,
  activePath,
  sections,
  relatedLink,
}: LegalDocumentLayoutProps) {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  return (
    <div className="page-container section-shell pb-10">
      <LegalBackLink />

      <PageHeader
        eyebrow="Legal"
        title={title}
        subtitle={subtitle}
        actions={
          <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Updated {lastUpdated}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4">
            <div className="glass-card p-4">
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy">
                <Shield className="h-4 w-4 text-brand" />
                Documents
              </h2>
              <ul className="space-y-1">
                {LEGAL_NAV.map((item) => {
                  const active = item.href === activePath;
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        state={from ? { from } : undefined}
                        className={`block rounded-xl px-3 py-2.5 transition-colors !no-underline ${
                          active
                            ? "bg-brand-light font-semibold text-brand"
                            : "text-slate-600 hover:bg-slate-50 hover:text-navy"
                        }`}
                      >
                        <span className="block text-sm">{item.label}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                          {item.description}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="glass-card hidden p-4 lg:block">
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy">
                <FileText className="h-4 w-4 text-brand" />
                On this page
              </h2>
              <ol className="max-h-[50vh] space-y-0.5 overflow-y-auto pr-1 text-sm">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block rounded-lg px-2 py-1.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand !no-underline"
                    >
                      {index + 1}. {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <details className="glass-card mb-4 p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-bold text-navy">On this page</summary>
            <ol className="mt-3 space-y-1.5 text-sm">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-slate-600 hover:text-brand !no-underline"
                  >
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </details>

          <article className="glass-card p-5 md:p-8">
            <div className="space-y-10">
              {sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 border-b border-slate-100 pb-10 last:border-b-0 last:pb-0"
                >
                  <h2 className="travel-heading mb-4 text-xl text-navy md:text-2xl">
                    {index + 1}. {section.title}
                  </h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 48)}
                      className="mb-4 text-[15px] leading-7 text-slate-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="mb-2 list-disc space-y-2 pl-5 text-[15px] leading-7 text-slate-600">
                      {section.bullets.map((item) => (
                        <li key={item.slice(0, 48)}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.closingParagraphs?.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 48)}
                      className="mb-4 text-[15px] leading-7 text-slate-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </article>

          <div className="glass-card mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-navy">Questions about this policy?</p>
                <p className="mt-1 text-sm text-slate-600">
                  Contact{" "}
                  <a href="mailto:legal@stayhub.com" className="font-semibold text-brand">
                    legal@stayhub.com
                  </a>{" "}
                  or{" "}
                  <a href="mailto:privacy@stayhub.com" className="font-semibold text-brand">
                    privacy@stayhub.com
                  </a>
                  .
                </p>
              </div>
            </div>
            {relatedLink && (
              <Link
                to={relatedLink.href}
                state={from ? { from } : undefined}
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-white px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:border-brand hover:bg-brand-light !no-underline"
              >
                Read {relatedLink.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
