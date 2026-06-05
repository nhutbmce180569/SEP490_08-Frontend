import { ImageIcon, Sparkles } from "lucide-react";
import type { AboutContent, TeamMember } from "../types";

type TeamMemberCardProps = {
  member: TeamMember;
  variant?: "mentor" | "member";
  mentorBadge?: string;
  cardLabels: AboutContent["card"];
};

export function TeamMemberCard({
  member,
  variant = "member",
  mentorBadge,
  cardLabels,
}: TeamMemberCardProps) {
  const isMentor = variant === "mentor";

  return (
    <article
      className={`group flex flex-col overflow-hidden transition-shadow hover:shadow-md sm:flex-row ${
        isMentor
          ? "rounded-xl border-2 border-brand/25 bg-white shadow-sm shadow-brand/10"
          : "glass-card"
      }`}
    >
      <div
        className={`relative h-36 w-full shrink-0 overflow-hidden sm:h-auto sm:w-36 ${
          isMentor
            ? "bg-gradient-to-br from-brand/10 to-brand-light"
            : "bg-gradient-to-br from-brand-light to-slate-50"
        }`}
      >
        {member.imageSrc ? (
          <img
            src={member.imageSrc}
            alt={member.name}
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 p-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-brand/25 bg-white/80 text-brand/40">
              <ImageIcon className="h-4 w-4" aria-hidden />
            </div>
            <span className="text-[10px] font-medium text-slate-400">{cardLabels.addPhoto}</span>
          </div>
        )}

        {isMentor && mentorBadge && (
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            <Sparkles className="h-3 w-3" aria-hidden />
            {mentorBadge}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:py-4 sm:pr-5">
        <div className="mb-2">
          <h3 className={`font-bold text-navy ${isMentor ? "text-xl" : "text-lg"}`}>
            {member.name}
          </h3>
          <p className={`text-xs font-semibold ${isMentor ? "text-brand-deep" : "text-brand"}`}>
            {member.role}
          </p>
        </div>

        <p className="mb-3 text-sm leading-relaxed text-slate-600">{member.summary}</p>

        <div className="mt-auto flex flex-wrap gap-1.5">
          {member.highlights.map((tag) => (
            <span
              key={tag}
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                isMentor
                  ? "bg-brand text-white"
                  : "bg-brand-light/70 text-brand"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
