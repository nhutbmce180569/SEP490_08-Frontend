import { useMemo, useState } from "react";

type FooterLinkGroup = { title: string; links: string[] };

export default function Footer() {
  const [email, setEmail] = useState("");

  const groups = useMemo<FooterLinkGroup[]>(
    () => [
      {
        title: "Company",
        links: [
          "About Us",
          "Tourz Reviews",
          "Contact Us",
          "Travel Guides",
          "Data Policy",
          "Cookie Policy",
          "Legal",
          "Sitemap",
        ],
      },
      { title: "Support", links: ["Get in Touch", "Help center", "Live chat", "How it works"] },
    ],
    [],
  );

  return (
    <footer
      style={{
        background: "#fff",
        borderTop: "1px solid rgba(235,102,43,0.15)",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        color: "#05073C",
      }}
    >
      <div style={{ margin: "0 auto", padding: "15px 110px" }}>
        {/* Top info row */}
        <div
          style={{
            height: 185,
            borderBottom: "1px solid rgba(235,102,43,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 320 }}>
            <div
              aria-hidden
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                background: "rgba(235,102,43,0.12)",
                display: "grid",
                placeItems: "center",
                fontSize: 22,
                color: "#EB662B",
                fontWeight: 800,
              }}
            >
              ☎
            </div>
            <div style={{ fontSize: 19.5, fontWeight: 600 }}>
              Speak to our expert at{" "}
              <span style={{ color: "#EB662B" }}>1-800-453-6744</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 16.2, fontWeight: 600 }}>Follow Us</div>
            {["in", "fb", "tw", "yt"].map((k) => (
              <button
                key={k}
                type="button"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  border: "1px solid rgba(5,7,60,0.12)",
                  background: "#fff",
                  color: "#05073C",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                }}
                aria-label={k}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Columns */}
        <div
          style={{
            padding: "40px 0",
            display: "grid",
            gridTemplateColumns: "minmax(260px, 1.3fr) 220px 220px minmax(280px, 1fr)",
            gap: 30,
          }}
        >
          {/* Contact */}
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 14 }}>Contact</div>
            <div style={{ fontSize: 14.4, lineHeight: "28px", marginBottom: 10 }}>
              328 Queensberry Street, North Melbourne VIC3051, Australia.
            </div>
            <div style={{ fontSize: 14.9, lineHeight: "28px" }}>hi@viatours.com</div>
          </div>

          {groups.map((g) => (
            <div key={g.title}>
              <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 14 }}>{g.title}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {g.links.map((l) => (
                  <li key={l} style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 14.6, lineHeight: "28px", cursor: "pointer" }}>
                      {l}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <div style={{ fontSize: 19.5, fontWeight: 600, marginBottom: 14 }}>Newsletter</div>
            <div style={{ fontSize: 14.6, lineHeight: "28px", marginBottom: 12 }}>
              Subscribe to the free newsletter and stay up to date
            </div>

            <div style={{ position: "relative", marginBottom: 28 }}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                style={{
                  width: "100%",
                  height: 60,
                  borderRadius: 12,
                  border: "1px solid #E7E6E6",
                  padding: "0 88px 0 18px",
                  outline: "none",
                  fontSize: 14.5,
                }}
              />
              <button
                type="button"
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: "#05073C",
                }}
              >
                Send
              </button>
            </div>

            <div style={{ fontSize: 19.7, fontWeight: 600, marginBottom: 12 }}>Mobile Apps</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["iOS App", "Android App"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span aria-hidden style={{ fontSize: 16 }}>
                    {t.startsWith("iOS") ? "" : "⌁"}
                  </span>
                  <span style={{ fontSize: 14.9, lineHeight: "28px" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgba(5,7,60,0.08)",
            padding: "18px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            color: "rgba(5,7,60,0.7)",
            fontSize: 13,
          }}
        >
          <div>© {new Date().getFullYear()} StayHub. All rights reserved.</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ cursor: "pointer" }}>Privacy</span>
            <span style={{ cursor: "pointer" }}>Terms</span>
            <span style={{ cursor: "pointer" }}>Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}