import { useEffect, useState } from "react";
import logoCursor from "../../assets/stayhub_icon_transparent.png";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"], label[for], select, summary, [data-cursor="pointer"]';

const TEXT_FIELD_SELECTOR =
  'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';

/**
 * Logo cursor on desktop — hides system pointer and follows the mouse.
 * Touch / reduced-motion: native cursor only.
 */
export function CustomBrandCursor() {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);
  const [overText, setOverText] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const enable = () => {
      const on = finePointer.matches && !reducedMotion.matches;
      setActive(on);
      document.documentElement.classList.toggle("has-brand-cursor", on);
      return on;
    };

    if (!enable()) {
      const onFine = () => enable();
      const onMotion = () => enable();
      finePointer.addEventListener("change", onFine);
      reducedMotion.addEventListener("change", onMotion);
      return () => {
        finePointer.removeEventListener("change", onFine);
        reducedMotion.removeEventListener("change", onMotion);
        document.documentElement.classList.remove("has-brand-cursor");
      };
    }

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target as Element | null;
      const text = Boolean(target?.closest(TEXT_FIELD_SELECTOR));
      setOverText(text);
      setHovering(
        !text && Boolean(target?.closest(INTERACTIVE_SELECTOR)),
      );
    };

    const onLeave = () => setPos({ x: -100, y: -100 });

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    const onFine = () => enable();
    const onMotion = () => enable();
    finePointer.addEventListener("change", onFine);
    reducedMotion.addEventListener("change", onMotion);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      finePointer.removeEventListener("change", onFine);
      reducedMotion.removeEventListener("change", onMotion);
      document.documentElement.classList.remove("has-brand-cursor");
    };
  }, []);

  if (!active || overText) return null;

  return (
    <div
      className="brand-cursor"
      aria-hidden
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
      }}
    >
      <img
        src={logoCursor}
        alt=""
        draggable={false}
        className={`brand-cursor__img ${hovering ? "brand-cursor__img--hover" : ""}`}
      />
    </div>
  );
}
