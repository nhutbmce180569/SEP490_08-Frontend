import type { LegalSection } from "./LegalDocumentLayout";

export const BOOKING_TERMS_LAST_UPDATED = "July 22, 2026";

export const bookingTermsSections: LegalSection[] = [
  {
    id: "booking-rules",
    title: "General Booking Rules",
    paragraphs: [
      "When booking a tour or experience on StayHub, you agree to provide accurate and complete information for all passengers.",
      "StayHub allows a maximum of 9 tickets per order to ensure group quality and prevent mass reselling. If you need to book for a larger group, please contact our customer support.",
    ],
  },
  {
    id: "age-requirements",
    title: "Age Requirements & Restrictions",
    paragraphs: [
      "Different ticket types may have specific age limits. It is your responsibility to ensure that the assigned passenger's age falls within the permitted range of the selected ticket.",
    ],
    bullets: [
      "Child/Infant Tickets: Any ticket designated for children or infants (or strictly under 12 years old) must be accompanied by at least one Adult ticket in the same booking.",
      "If the passenger's age (calculated from the Date of Birth to the current date) does not meet the ticket's age requirement, you will not be able to proceed with the booking.",
      "Tour Partners reserve the right to verify the age of passengers using valid ID cards, passports, or birth certificates on the departure day. If there is a mismatch, boarding may be denied without refund."
    ],
  },
  {
    id: "vouchers",
    title: "Vouchers & Promotions",
    paragraphs: [
      "Vouchers and promotional codes can be applied at checkout. Only one voucher can be used per order.",
      "If you apply a voucher and subsequently cancel your booking, the voucher will not be refunded or reinstated. The discount value is non-refundable."
    ]
  },
  {
    id: "cancellations",
    title: "Cancellations & Refunds",
    paragraphs: [
      "By completing a booking, you agree to the tour's specific cancellation policy. Unless otherwise stated on the tour detail page, our standard cancellation policy is as follows:"
    ],
    bullets: [
      "Cancellation > 15 days before departure: 0% fee (100% refund).",
      "Cancellation 11 - 15 days before departure: 5% fee (95% refund).",
      "Cancellation 6 - 10 days before departure: 10% fee (90% refund).",
      "Cancellation 3 - 5 days before departure: 15% fee (85% refund).",
      "Cancellation 1 - 2 days before departure: 20% fee (80% refund)."
    ]
  },
  {
    id: "information-verification",
    title: "Information Verification",
    paragraphs: [
      "All passenger details (Full Name, ID Card/Passport, Date of Birth, Nationality) must match the passenger's official identification documents exactly.",
      "You must bring original identification documents (ID Card, Passport, or Birth Certificate for children) on the day of the tour.",
      "Any discrepancy between the booking details and the passenger's actual documents may result in the Tour Partner denying service. StayHub is not liable for any loss resulting from incorrect information provided during booking."
    ]
  }
];
