import type { LegalSection } from "./LegalDocumentLayout";

export const PRIVACY_LAST_UPDATED = "June 3, 2026";

export const privacySections: LegalSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    paragraphs: [
      'StayHub ("we," "us," or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, store, and safeguard information when you visit our website, use our mobile applications, create an account, make a booking, or interact with our services (collectively, the "Platform").',
      "This Policy applies to travelers, account holders, Tour Partners, and visitors. It should be read together with our Terms of Service. By using the Platform, you acknowledge that you have read and understood this Privacy Policy.",
      "StayHub processes personal data in accordance with the Law on Cyberinformation Security and Law on Cybersecurity of Vietnam, Decree No. 13/2023/ND-CP on Personal Data Protection (effective from July 2023), the Law on Protection of Consumer Rights, and other applicable regulations.",
    ],
  },
  {
    id: "data-controller",
    title: "Data Controller and Contact",
    paragraphs: [
      "StayHub is the data controller for personal data processed through the Platform, except where Tour Partners act as independent controllers for operational data they collect directly during tour delivery.",
      "Data Protection Contact: privacy@stayhub.com | General support: hi@stayhub.com | Address: Ho Chi Minh City, Vietnam.",
      "For personal data-related requests, please include sufficient information to verify your identity. We may request additional verification before fulfilling sensitive requests.",
    ],
  },
  {
    id: "data-collected",
    title: "Categories of Personal Data We Collect",
    paragraphs: [
      "We collect personal data that you provide directly, data generated through your use of the Platform, and data received from third parties such as payment providers and social login services.",
    ],
    bullets: [
      "Identity and profile data: full name, username, date of birth, gender, profile photo, government ID numbers when required for specific tours or refunds.",
      "Contact data: email address, phone number, mailing address, emergency contact details.",
      "Account and authentication data: hashed passwords, login history, OAuth tokens from Google or Facebook when you use social login.",
      "Booking and transaction data: tour selections, travel dates, party size, special requests, payment method metadata, invoices, refunds, and voucher codes.",
      "Financial data: payment card tokens and billing details processed by PCI-DSS compliant payment partners (StayHub does not store full card numbers on its servers).",
      "Location data: GPS coordinates when you enable live trip tracking, location sharing with friends, or map-based tour features.",
      "Communications: messages with Tour Partners, customer support tickets, chat logs, call recordings where disclosed.",
      "User-generated content: reviews, ratings, photos, social moments, comments, and wishlists.",
      "Technical data: IP address, device identifiers, browser type, operating system, cookies, session logs, and analytics events.",
      "Marketing preferences: newsletter subscriptions, promotion opt-ins, and campaign interaction data.",
    ],
  },
  {
    id: "collection-methods",
    title: "How We Collect Personal Data",
    bullets: [
      "Directly from you when you register, complete bookings, update your profile, submit reviews, or contact support.",
      "Automatically through cookies, pixels, server logs, and similar technologies when you browse or use Platform features.",
      "From third parties including payment gateways, identity providers (Google, Facebook), analytics vendors, fraud prevention services, and Tour Partners fulfilling your booking.",
      "From publicly available sources where lawful and relevant to fraud prevention or business verification.",
    ],
  },
  {
    id: "legal-bases",
    title: "Legal Bases and Purposes of Processing",
    paragraphs: [
      "Under Decree 13/2023/ND-CP and applicable law, StayHub processes personal data based on one or more of the following grounds: your consent; performance of a contract (booking and account services); compliance with legal obligations; protection of vital interests; and legitimate interests that do not override your rights.",
    ],
    bullets: [
      "Creating and managing your account and authenticating access.",
      "Processing bookings, payments, confirmations, cancellations, and refunds.",
      "Communicating booking updates, itinerary changes, safety alerts, and customer support responses.",
      "Enabling social features such as friend connections, shared moments, and optional live location tracking.",
      "Personalizing search results, recommendations, and promotional offers.",
      "Operating AI-assisted tour planning features based on your preferences and queries.",
      "Detecting, preventing, and investigating fraud, abuse, and security incidents.",
      "Complying with tax, accounting, tourism reporting, and law enforcement requests.",
      "Improving Platform performance, conducting analytics, and developing new features.",
      "Sending marketing communications where permitted by law and your preferences.",
    ],
  },
  {
    id: "sharing",
    title: "How We Share Personal Data",
    paragraphs: [
      "StayHub does not sell your personal data. We share data only as described below and require recipients to implement appropriate safeguards.",
    ],
    bullets: [
      "Tour Partners: booking details, traveler names, contact information, dietary or medical notes you provide, and special requirements necessary to deliver the tour.",
      "Payment processors and banks: transaction amounts, billing identifiers, and fraud signals to process payments and chargebacks.",
      "Cloud hosting and IT vendors: infrastructure providers that store and process data on our behalf under data processing agreements.",
      "Customer support and communication tools: email, SMS, push notification, and chat service providers.",
      "Analytics and marketing partners: aggregated or pseudonymized usage data; identifiable data only with consent where required.",
      "Social login providers: authentication tokens when you choose Google or Facebook login.",
      "Legal and regulatory authorities: when required by court order, subpoena, or applicable Vietnamese law.",
      "Corporate transactions: in connection with mergers, acquisitions, or asset sales, subject to confidentiality obligations.",
      "Other users: content you choose to publish publicly, such as public reviews or public social moments.",
    ],
  },
  {
    id: "cross-border",
    title: "Cross-Border Data Transfers",
    paragraphs: [
      "StayHub and its service providers may store or process personal data on servers located in Vietnam and other countries. Where personal data of Vietnamese citizens is transferred outside Vietnam, we implement safeguards required under Decree 13/2023/ND-CP, including impact assessments where applicable, contractual clauses, and notification or registration obligations with competent authorities when required.",
      "By using the Platform, you acknowledge that your data may be transferred internationally for the purposes described in this Policy, subject to appropriate protection measures.",
    ],
  },
  {
    id: "retention",
    title: "Data Retention",
    paragraphs: [
      "We retain personal data only for as long as necessary to fulfill the purposes described in this Policy, unless a longer retention period is required or permitted by law.",
    ],
    bullets: [
      "Account data: retained while your account is active and for a reasonable period after closure to resolve disputes and comply with legal obligations.",
      "Booking and financial records: typically retained for at least five (5) to ten (10) years in accordance with Vietnamese accounting and tax regulations.",
      "Marketing data: retained until you withdraw consent or object, plus a short suppression period to honor opt-out requests.",
      "Technical logs and security records: retained for a limited period based on security and troubleshooting needs.",
      "When data is no longer required, we delete, anonymize, or aggregate it in a manner that prevents re-identification where feasible.",
    ],
  },
  {
    id: "security",
    title: "Security Measures",
    paragraphs: [
      "StayHub implements administrative, technical, and organizational measures designed to protect personal data against unauthorized access, loss, destruction, or alteration. Measures include encryption in transit (TLS/HTTPS), access controls, role-based permissions, secure development practices, and monitoring for suspicious activity.",
      "No method of transmission or storage is completely secure. You are responsible for maintaining the confidentiality of your account credentials and for logging out on shared devices.",
      "In the event of a personal data breach that may affect your rights, we will notify affected individuals and competent authorities as required under Vietnamese law, including Decree 13/2023/ND-CP.",
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights Under Vietnamese Law",
    paragraphs: [
      "Subject to applicable law and verification requirements, you may exercise the following rights regarding your personal data:",
    ],
    bullets: [
      "Right to be informed about processing activities and this Privacy Policy.",
      "Right of access to personal data we hold about you.",
      "Right to rectification of inaccurate or incomplete data.",
      "Right to erasure (deletion) where processing is no longer necessary or consent is withdrawn, subject to legal retention exceptions.",
      "Right to restriction of processing in certain circumstances.",
      "Right to data portability for data you provided, in a structured, commonly used format where technically feasible.",
      "Right to object to processing based on legitimate interests or direct marketing.",
      "Right to withdraw consent at any time, without affecting the lawfulness of processing before withdrawal.",
      "Right to lodge a complaint with the Ministry of Public Security of Vietnam or other competent authority responsible for personal data protection.",
    ],
    closingParagraphs: [
      "Submit requests to privacy@stayhub.com. We will respond within the timeframe required by applicable law, generally within seventy-two (72) hours for initial acknowledgment where mandated, and within thirty (30) days for completion unless an extension is permitted.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies and Similar Technologies",
    paragraphs: [
      "StayHub uses cookies, local storage, and similar technologies to enable core Platform functionality, remember preferences, analyze traffic, and deliver relevant content.",
    ],
    bullets: [
      "Strictly necessary cookies: required for login, session management, security, and checkout.",
      "Functional cookies: remember language, currency, and display preferences.",
      "Analytics cookies: help us understand usage patterns and improve performance.",
      "Marketing cookies: used to measure campaign effectiveness and personalize offers, where you have consented.",
      "You can manage cookie preferences through your browser settings. Disabling certain cookies may limit Platform functionality.",
    ],
  },
  {
    id: "children",
    title: "Children's Privacy",
    paragraphs: [
      "The Platform is not directed to children under 16 years of age. We do not knowingly collect personal data from children under 16 without verifiable parental consent. If you believe we have collected data from a child without proper authorization, contact privacy@stayhub.com and we will take steps to delete such information.",
      "Bookings for minors must be made by a parent or legal guardian who provides necessary traveler information.",
    ],
  },
  {
    id: "automated-decisions",
    title: "Automated Processing and AI Features",
    paragraphs: [
      "StayHub may use automated systems, including AI-based recommendation engines and tour planning assistants, to suggest tours, itineraries, and content based on your preferences, search history, and similar user patterns.",
      "These systems do not produce legal or similarly significant effects without human review. You may contact support to request information about how recommendations are generated or to provide feedback on automated outputs.",
    ],
  },
  {
    id: "third-party-links",
    title: "Third-Party Websites and Services",
    paragraphs: [
      "The Platform may contain links to third-party websites, maps, payment pages, or social networks. This Privacy Policy does not apply to those third parties. We encourage you to review their privacy policies before providing personal data.",
    ],
  },
  {
    id: "marketing",
    title: "Marketing Communications",
    paragraphs: [
      "With your consent or where permitted by law, we may send promotional emails, push notifications, or SMS messages about tours, deals, and Platform updates. You can opt out at any time using the unsubscribe link in emails, notification settings in your account, or by emailing privacy@stayhub.com.",
      "Transactional and service-related messages (booking confirmations, safety alerts, password resets) will still be sent even if you opt out of marketing.",
    ],
  },
  {
    id: "changes",
    title: "Changes to This Privacy Policy",
    paragraphs: [
      "We may update this Privacy Policy to reflect changes in law, technology, or our practices. The \"Last updated\" date at the top indicates the latest revision. Material changes will be communicated through the Platform, email, or other appropriate channels.",
      "Continued use of the Platform after the effective date of an updated Policy constitutes acknowledgment of the changes, unless your consent is required by law.",
    ],
  },
  {
    id: "contact",
    title: "Contact Us",
    paragraphs: [
      "For privacy inquiries, data subject requests, or complaints:",
      "Email: privacy@stayhub.com | Legal: legal@stayhub.com | Support: hi@stayhub.com",
      "StayHub — Ho Chi Minh City, Vietnam",
    ],
  },
];
