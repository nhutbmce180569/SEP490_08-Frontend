import type { Locale } from "../../i18n";
import mentorPhoto from "../../assets/team/mentor.jpg";
import minhNhutPhoto from "../../assets/team/minhnhut.png";
import kieuThyPhoto from "../../assets/team/kieuthy.png";
import thanhTuPhoto from "../../assets/team/thanhtu.png";
import thanhNguyenPhoto from "../../assets/team/thanhnguyen.png";
import phuongTuongPhoto from "../../assets/team/phuongtuong.png";
import { aboutContentEn } from "./aboutContentEn";
import { aboutContentVi } from "./aboutContentVi";
import type { AboutContent } from "./types";

const TEAM_IMAGES: Record<string, string> = {
  mentor: mentorPhoto,
  "bui-minh-nhut": minhNhutPhoto,
  "ly-thi-kieu-thy": kieuThyPhoto,
  "pham-thanh-tu": thanhTuPhoto,
  "pham-vu-thanh-nguyen": thanhNguyenPhoto,
  "mai-phuong-tuong": phuongTuongPhoto,
};

function attachImages(content: AboutContent): AboutContent {
  return {
    ...content,
    people: {
      ...content.people,
      mentorSection: {
        ...content.people.mentorSection,
        member: {
          ...content.people.mentorSection.member,
          imageSrc: TEAM_IMAGES[content.people.mentorSection.member.id],
        },
      },
      teamSection: {
        ...content.people.teamSection,
        members: content.people.teamSection.members.map((m) => ({
          ...m,
          imageSrc: TEAM_IMAGES[m.id],
        })),
      },
    },
  };
}

export function getAboutContent(locale: Locale): AboutContent {
  const base = locale === "vi" ? aboutContentVi : aboutContentEn;
  return attachImages(base);
}
