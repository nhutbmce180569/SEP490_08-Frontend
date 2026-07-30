import type { LegalSection } from "./LegalDocumentLayout";

export const TERMS_LAST_UPDATED = "June 3, 2026";

export const termsSections: LegalSection[] = [
  {
    id: "introduction",
    title: "Introduction and Acceptance",
    paragraphs: [
      'Welcome to StayHub ("StayHub," "we," "us," or "our"). StayHub operates an online marketplace and booking platform that connects travelers with licensed tour operators, travel agencies, and experience providers ("Tour Partners") offering tours, activities, tickets, and related travel services in Vietnam and internationally.',
      "These Terms of Service (\"Terms\") govern your access to and use of the StayHub website, mobile applications, APIs, and all related services (collectively, the \"Platform\"). By creating an account, browsing listings, or completing a booking, you agree to be bound by these Terms, our Privacy Policy, and any additional policies referenced herein.",
      "If you do not agree to these Terms, you must not use the Platform. We may update these Terms from time to time. Material changes will be notified via the Platform or email. Continued use after the effective date constitutes acceptance of the revised Terms.",
    ],
  },
  {
    id: "definitions",
    title: "Definitions",
    bullets: [
      "\"Customer,\" \"Traveler,\" or \"you\" means any individual or entity using the Platform to search for, book, or purchase travel services.",
      "\"Tour Partner\" means a third-party business entity licensed to provide tourism services that lists products on StayHub.",
      "\"Booking\" means a confirmed reservation for a tour, activity, ticket, or related service made through the Platform.",
      "\"Tour Product\" means any tour package, day trip, ticket, itinerary, or travel experience listed on StayHub.",
      "\"Voucher\" or \"Booking Confirmation\" means the electronic document issued upon successful payment, containing booking details and redemption instructions.",
      "\"Force Majeure Event\" means an event beyond reasonable control, including natural disasters, epidemics, government orders, war, terrorism, strikes, or infrastructure failures.",
    ],
  },
  {
    id: "platform-role",
    title: "StayHub's Role as an Intermediary",
    paragraphs: [
      "StayHub is a technology platform and booking intermediary. Unless expressly stated otherwise, StayHub is not the direct provider of tours or travel services. Tour Products are supplied by independent Tour Partners who are solely responsible for delivering the services described in their listings.",
      "StayHub facilitates discovery, booking, payment processing, customer communication tools, and post-booking support where applicable. We do not guarantee the accuracy of every listing detail, third-party website link, or user-generated review, although we apply reasonable moderation and verification measures.",
      "Your contract for the Tour Product is primarily between you and the Tour Partner. StayHub's obligations are limited to those expressly set out in these Terms and in the booking confirmation.",
    ],
  },
  {
    id: "eligibility",
    title: "Eligibility and Account Registration",
    paragraphs: [
      "You must be at least 18 years of age and have the legal capacity to enter into binding contracts to create an account and make bookings. Bookings on behalf of minors must be made by a parent or legal guardian who accepts full responsibility for all travelers in the party.",
    ],
    bullets: [
      "You agree to provide accurate, current, and complete registration information and to keep your account credentials confidential.",
      "You are responsible for all activity conducted under your account and must notify us immediately of any unauthorized access.",
      "StayHub may suspend or terminate accounts that provide false information, engage in fraud, abuse the Platform, or violate applicable laws.",
      "One person may not maintain multiple accounts for the purpose of circumventing restrictions, promotions, or enforcement actions.",
    ],
  },
  {
    id: "bookings",
    title: "Bookings, Pricing, and Payment",
    paragraphs: [
      "When you submit a booking request, you make an offer to purchase the selected Tour Product at the displayed price, subject to availability and confirmation. A booking is confirmed only when you receive a Booking Confirmation and payment has been successfully processed (or the selected payment method has been authorized, where applicable).",
      "Prices are displayed in the currency indicated at checkout and may include or exclude taxes, service fees, and surcharges as specified on the listing and checkout pages. Applicable Value Added Tax (VAT) and tourism-related levies in Vietnam will be disclosed where required under Vietnamese tax law.",
      "StayHub and Tour Partners reserve the right to correct pricing errors before confirmation. If a material error is discovered after confirmation, we will notify you and offer reconfirmation at the correct price or a full refund.",
    ],
    bullets: [
      "Accepted payment methods are shown at checkout and may include domestic and international cards, e-wallets, bank transfers, and other methods supported by our payment partners.",
      "You authorize StayHub and its payment processors to charge the total booking amount, including applicable fees, taxes, and optional add-ons selected at checkout.",
      "Promotional codes, vouchers, and credits are subject to separate terms, expiry dates, and usage limits.",
      "Chargebacks or payment disputes initiated without first contacting StayHub support may result in account suspension pending investigation.",
    ],
  },
  {
    id: "vietnam-tourism-law",
    title: "Compliance with Vietnamese Tourism Regulations",
    paragraphs: [
      "StayHub operates in compliance with the Law on Tourism of Vietnam (Law No. 80/2025/QH15, effective 2026, succeeding Law No. 09/2017/QH14) and related guiding decrees and circulars. Tour Partners listing domestic tours in Vietnam are required to hold appropriate business licenses, including an enterprise registration and, where applicable, a travel business license issued by competent authorities.",
      "Under Vietnamese law, organized tourism programs must meet requirements regarding itineraries, safety instructions, insurance arrangements where mandated, and accurate advertising. Tour Partners must not offer tours to restricted or prohibited areas without lawful authorization.",
      "StayHub may require Tour Partners to submit license numbers, insurance certificates, and operational documentation. We reserve the right to remove listings that appear non-compliant or misrepresent legal authorization.",
      "International travelers booking tours in Vietnam are responsible for obtaining valid passports, visas, health certificates, and any permits required for their nationality and itinerary. StayHub provides general information only and does not constitute immigration or consular advice.",
    ],
  },
  {
    id: "travel-documents",
    title: "Travel Documents, Health, and Safety",
    bullets: [
      "You are solely responsible for ensuring that all travelers possess valid identification, passports, visas, and health documentation required for the tour.",
      "You must disclose relevant medical conditions, mobility limitations, dietary requirements, or pregnancy status during booking when requested, so Tour Partners can assess suitability and make reasonable accommodations.",
      "Tour Partners may refuse participation if a traveler poses a safety risk, is intoxicated, violates instructions, or lacks required documents, without entitlement to a refund except where required by law or the stated cancellation policy.",
      "Adventure activities, water sports, trekking, and motorbike tours may carry inherent risks. You participate at your own risk to the extent permitted by applicable law.",
      "StayHub recommends purchasing comprehensive travel insurance covering medical expenses, trip cancellation, personal liability, and adventure activities where applicable.",
    ],
  },
  {
    id: "cancellation",
    title: "Cancellation, Changes, and Refunds",
    paragraphs: [
      "Each Tour Product displays a cancellation and change policy set by the Tour Partner or StayHub policy tier applicable to that listing. Policies may include free cancellation windows, partial refunds, credit vouchers, or non-refundable rates. You must review the policy before completing payment.",
      "To request a cancellation or modification, use the booking management tools in your account or contact StayHub support with your booking reference. Refund eligibility is determined by the applicable policy and the time of request.",
      "Refunds, when approved, are processed to the original payment method unless otherwise agreed. Processing times may take 5–15 business days depending on banks and payment providers.",
      "If a Tour Partner cancels a tour or fails to deliver the service, StayHub will assist in arranging an alternative, credit, or refund in accordance with the listing policy and consumer protection requirements under Vietnamese law.",
    ],
    bullets: [
      "No-shows without prior cancellation are generally non-refundable.",
      "Partial use of multi-day packages may not entitle you to a proportional refund unless stated in the policy.",
      "Administrative fees or payment processing fees may be non-refundable where disclosed at checkout.",
    ],
  },
  {
    id: "force-majeure",
    title: "Force Majeure and Government Restrictions",
    paragraphs: [
      "Neither StayHub nor Tour Partners shall be liable for failure or delay in performance resulting from Force Majeure Events, including typhoons, floods, earthquakes, epidemics, government travel bans, airport closures, or civil unrest.",
      "In such events, StayHub will work with Tour Partners to offer rescheduling, credits, or refunds where commercially reasonable and consistent with applicable law. Vietnamese government directives during public emergencies may require mandatory cancellation or itinerary changes without compensation beyond what the law requires.",
      "You acknowledge that tour schedules, routes, attractions, and accommodation standards may change due to weather, traffic, site closures, or operational constraints. Reasonable substitutions of equivalent value may be made by Tour Partners.",
    ],
  },
  {
    id: "customer-conduct",
    title: "Customer Conduct and Prohibited Uses",
    bullets: [
      "Use the Platform only for lawful personal or authorized business travel booking purposes.",
      "Do not scrape, reverse engineer, or automate access to the Platform without written consent.",
      "Do not post false reviews, manipulate ratings, or impersonate other users or businesses.",
      "Do not use the Platform to transmit malware, spam, or unlawful content.",
      "Respect local laws, cultural norms, environmental rules, and Tour Partner staff instructions during tours.",
      "Wildlife exploitation, purchase of protected species products, and visits to unlawful entertainment venues are prohibited where disclosed by StayHub or applicable law.",
      "Violation of these rules may result in booking cancellation without refund and permanent account termination.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    paragraphs: [
      "The StayHub brand, logo, software, design, text, graphics, and original content on the Platform are owned by StayHub or its licensors and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without prior written permission.",
      "Tour Partners grant StayHub a non-exclusive license to use listing content, images, and trademarks for marketing and Platform operation. User reviews and submitted content grant StayHub a worldwide, royalty-free license to display and moderate such content on the Platform.",
    ],
  },
  {
    id: "reviews",
    title: "Reviews and User Content",
    paragraphs: [
      "Customers may submit ratings and reviews after completed tours. Reviews must be honest, based on personal experience, and free of offensive, discriminatory, or defamatory language.",
      "StayHub may remove or edit reviews that violate content guidelines, appear fraudulent, or disclose private information. We do not guarantee publication of all submitted reviews.",
    ],
  },
  {
    id: "consumer-protection",
    title: "Consumer Protection (Vietnam)",
    paragraphs: [
      "These Terms are interpreted in accordance with the Law on Protection of Consumer Rights of Vietnam and other applicable consumer regulations. Nothing in these Terms limits statutory rights that cannot be waived under Vietnamese law.",
      "Customers residing in Vietnam may contact StayHub for complaint resolution before pursuing remedies with consumer protection authorities. We will acknowledge complaints within a reasonable time and seek good-faith resolution.",
      "For cross-border bookings, mandatory consumer rights in your country of residence may also apply where they cannot be lawfully excluded.",
    ],
  },
  {
    id: "limitation-liability",
    title: "Disclaimers and Limitation of Liability",
    paragraphs: [
      "THE PLATFORM AND TOUR LISTINGS ARE PROVIDED \"AS IS\" AND \"AS AVAILABLE.\" TO THE MAXIMUM EXTENT PERMITTED BY LAW, STAYHUB DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.",
      "StayHub is not liable for acts, omissions, errors, representations, or negligence of Tour Partners, guides, transport providers, hotels, or other third parties. Direct claims relating to tour delivery should primarily be addressed to the Tour Partner.",
      "To the fullest extent permitted by applicable law, StayHub's total aggregate liability arising from or related to any booking or use of the Platform shall not exceed the amount paid by you to StayHub for that booking, or one hundred United States dollars (USD 100), whichever is greater, except where liability cannot be limited under mandatory law.",
      "StayHub shall not be liable for indirect, incidental, special, consequential, or punitive damages, including lost profits, data loss, or emotional distress, even if advised of the possibility of such damages.",
    ],
  },
  {
    id: "indemnification",
    title: "Indemnification",
    paragraphs: [
      "You agree to indemnify, defend, and hold harmless StayHub, its affiliates, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including reasonable legal fees) arising from your breach of these Terms, violation of law, misuse of the Platform, or harm caused to third parties during a tour where attributable to your conduct.",
    ],
  },
  {
    id: "disputes",
    title: "Dispute Resolution and Governing Law",
    paragraphs: [
      "These Terms are governed by the laws of the Socialist Republic of Vietnam, without regard to conflict-of-law principles.",
      "Parties shall first attempt to resolve disputes through good-faith negotiation and StayHub's internal complaint handling process within thirty (30) days of written notice.",
      "If unresolved, disputes shall be submitted to the competent People's Court of Vietnam at StayHub's registered place of business, unless mandatory consumer protection rules require jurisdiction in the consumer's locality.",
      "Nothing prevents either party from seeking urgent injunctive relief for intellectual property infringement or unauthorized Platform access.",
    ],
  },
  {
    id: "general",
    title: "General Provisions",
    bullets: [
      "If any provision of these Terms is held invalid, the remaining provisions remain in full force and effect.",
      "StayHub's failure to enforce a provision does not constitute a waiver of that provision.",
      "You may not assign your rights under these Terms without our consent. StayHub may assign these Terms in connection with a merger, acquisition, or sale of assets.",
      "These Terms, together with the Privacy Policy, booking confirmation, and listing-specific policies, constitute the entire agreement regarding Platform use.",
      "Notices to StayHub: legal@stayhub.com. Registered address: Ho Chi Minh City, Vietnam (full address available upon request).",
    ],
  },
];
