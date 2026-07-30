import React from "react";
import { HOME_CONTAINER } from "./shared";

type HomeSectionProps = {
  children: React.ReactNode;
  id?: string;
  /** Less top padding — follows hero or previous block */
  tightTop?: boolean;
  /** Less bottom padding — flows into next block */
  tightBottom?: boolean;
  className?: string;
};

export const HomeSection: React.FC<HomeSectionProps> = ({
  children,
  id,
  tightTop,
  tightBottom,
  className = "",
}) => (
  <section
    id={id}
    className={[
      "home-section relative",
      tightTop && "home-section--tight-top",
      tightBottom && "home-section--tight-bottom",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    <div className={`${HOME_CONTAINER} relative z-10`}>{children}</div>
  </section>
);
