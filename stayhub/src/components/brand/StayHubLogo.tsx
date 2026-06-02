import { Link } from "react-router-dom";
import logoIcon from "../../assets/stayhub_icon_transparent.png";
import { PATH } from "../../config/routes/route";

type StayHubLogoProps = {
  /** compact: chỉ icon (sidebar thu gọn) */
  variant?: "full" | "compact";
  className?: string;
  linkTo?: string;
};

/** Logo không nền — dùng PNG trong suốt + wordmark, tránh logo_blue (nền trắng). */
export function StayHubLogo({
  variant = "full",
  className = "",
  linkTo = PATH.PUBLIC.HOME,
}: StayHubLogoProps) {
  const content =
    variant === "compact" ? (
      <img
        src={logoIcon}
        alt="StayHub"
        className="h-9 w-9 object-contain drop-shadow-sm"
        draggable={false}
      />
    ) : (
      <span className="flex items-center gap-2.5">
        <img
          src={logoIcon}
          alt=""
          aria-hidden
          className="h-10 w-10 shrink-0 object-contain drop-shadow-sm md:h-11 md:w-11"
          draggable={false}
        />
        <span className="font-display text-xl font-extrabold tracking-tight text-navy md:text-[1.35rem]">
          Stay<span className="text-brand">Hub</span>
        </span>
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
