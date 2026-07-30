import { Link } from "react-router-dom";
import logoIcon from "../../assets/stayhub_icon_transparent.png";
import { PATH } from "../../config/routes/route";
import { useSystemSettings } from "../../features/system/hooks/useSystemSettings";
import { getImg } from "../../config/api/api";

type StayHubLogoProps = {
  /** compact: chỉ icon (sidebar thu gọn) */
  variant?: "full" | "compact";
  /** light: wordmark sáng cho nền tối (auth hero panel) */
  theme?: "default" | "light";
  className?: string;
  linkTo?: string;
};

/** Logo không nền — dùng PNG trong suốt + wordmark, tránh logo_blue (nền trắng). */
export function StayHubLogo({
  variant = "full",
  theme = "default",
  className = "",
  linkTo = PATH.PUBLIC.HOME,
}: StayHubLogoProps) {
  const { getSetting } = useSystemSettings();
  const webLogoUrl = getSetting("WebLogo");
  const actualLogoSrc = webLogoUrl ? getImg(webLogoUrl) : logoIcon;

  const wordmarkClass =
    theme === "light"
      ? "font-display text-xl font-extrabold tracking-tight text-white md:text-[1.35rem]"
      : "font-display text-xl font-extrabold tracking-tight text-navy md:text-[1.35rem]";

  const hubClass = theme === "light" ? "text-sky-300" : "text-brand";

  const content =
    variant === "compact" ? (
      <img
        src={actualLogoSrc}
        alt="StayHub"
        className="h-9 w-9 object-contain drop-shadow-sm"
        draggable={false}
      />
    ) : (
      <span className="flex items-center gap-2.5">
        <img
          src={actualLogoSrc}
          alt=""
          aria-hidden
          className={`h-10 w-10 shrink-0 object-contain md:h-11 md:w-11 ${
            theme === "light" ? "drop-shadow-md" : "drop-shadow-sm"
          }`}
          draggable={false}
        />
        {!webLogoUrl && (
          <span className={wordmarkClass}>
            Stay<span className={hubClass}>Hub</span>
          </span>
        )}
      </span>
    );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className={`inline-flex shrink-0 items-center !no-underline outline-none ${className}`}
        aria-label="StayHub home"
      >
        {content}
      </Link>
    );
  }

  return <span className={`inline-flex items-center ${className}`}>{content}</span>;
}
