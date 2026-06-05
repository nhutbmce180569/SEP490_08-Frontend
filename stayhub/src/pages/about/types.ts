export type TeamMember = {
  id: string;
  name: string;
  role: string;
  imageSrc?: string;
  summary: string;
  highlights: string[];
};

export type AboutContent = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    exploreTours: string;
    stats: { value: string; label: string }[];
  };
  system: {
    summary: string;
  };
  features: {
    title: string;
    items: { title: string; description: string }[];
  };
  people: {
    mentorSection: {
      eyebrow: string;
      title: string;
      subtitle: string;
      badge: string;
      member: TeamMember;
    };
    teamSection: {
      eyebrow: string;
      title: string;
      subtitle: string;
      members: TeamMember[];
    };
  };
  tech: {
    title: string;
    groups: { label: string; items: string[] }[];
  };
  cta: {
    title: string;
    browseTours: string;
    aiAssistant: string;
  };
  card: {
    addPhoto: string;
  };
};
