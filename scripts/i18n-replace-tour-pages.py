#!/usr/bin/env python3
"""Apply i18n string replacements to remaining tour pages."""
from pathlib import Path

PAGES = Path(__file__).resolve().parents[1] / "stayhub/src/features/tour/pages"

IMPORT = 'import { useTranslation } from "../../../contexts/LocaleContext";\n'
HOOK = "  const { t } = useTranslation();\n"

COMMON_REPLACEMENTS = [
    ('"Failed to load schedule itineraries."', 't("tour.failedLoadScheduleItineraries")'),
    ('"Failed to load schedule tickets."', 't("tour.failedLoadScheduleTickets")'),
    ('"Failed to deactivate schedule ticket."', 't("tour.failedDeactivateTicket")'),
    ('"Failed to activate schedule ticket."', 't("tour.failedActivateTicket")'),
    ('error || "Schedule not found."', 'error || t("tour.scheduleNotFound")'),
    ('"Loading schedule details..."', 't("tour.loadingScheduleDetails")'),
    ('"Back to Schedules"', '{t("tour.backToSchedules")}'),
    ('"Schedule Detail"', '{t("tour.scheduleDetail")}'),
    ('"Tour Name:"', '{t("tour.tourNameLabel")}'),
    ('"View Orders"', '{t("tour.viewOrders")}'),
    ('"View Customers"', '{t("tour.viewCustomers")}'),
    ('"Live Tour Map"', '{t("tour.liveTourMap")}'),
    ('"Edit"', '{t("tour.edit")}'),
    ('"Delete"', '{t("tour.delete")}'),
    ('"Departure Date"', '{t("tour.departureDate")}'),
    ('"Return Date"', '{t("tour.returnDate")}'),
    ('"N/A"', 't("common.na")'),
    ('"Schedule Note"', '{t("tour.scheduleNote")}'),
    ('"No notes provided for this schedule."', '{t("tour.noScheduleNotes")}'),
    ('"Schedule Tickets"', '{t("tour.scheduleTickets")}'),
    ('"No ticket setup for this schedule."', '{t("tour.noTicketSetupSchedule")}'),
    ('"Add Ticket"', '{t("tour.addTicket")}'),
    ('"Loading schedule tickets..."', '{t("tour.loadingScheduleTickets")}'),
    ('"Ticket Name"', '{t("tour.ticketName")}'),
    ('"Price"', '{t("common.price")}'),
    ('"Quantity"', '{t("tour.quantity")}'),
    ('"Status"', '{t("common.status")}'),
    ('"Action"', '{t("common.actions")}'),
    ('{isActive ? "Active" : "Inactive"}', '{isActive ? t("common.active") : t("common.inactive")}'),
    ('title="Edit ticket"', 'title={t("tour.editTicket")}'),
    ('title={isActive ? "Deactivate ticket" : "Activate ticket"}', 'title={isActive ? t("tour.deactivateTicketAction") : t("tour.activateTicketAction")}'),
    ('"No tickets configured"', '{t("tour.noTicketsConfigured")}'),
    ('"Add ticket types, prices, and quantities for this schedule."', '{t("tour.addTicketHint")}'),
    ('"Schedule Itinerary"', '{t("tour.scheduleItinerarySection")}'),
    ('"Add Itineraries"', '{t("tour.addItineraries")}'),
    ('"Missing itinerary days detected:"', '{t("tour.missingItineraryDaysTitle")}'),
    ('"Loading schedule itinerary..."', '{t("tour.loadingScheduleItinerary")}'),
    ('"Untitled itinerary"', 't("tour.untitledItinerary")'),
    ('"Any time"', 't("tour.anyTime")'),
    ('"No location specification"', 't("tour.noLocationSpec")'),
    ('"No image"', 't("tour.noImage")'),
    ('"Source"', 't("tour.source")'),
    ('`Tourism info ID #${iti.tourismInfoId}`', 't("tour.tourismInfoId", { id: iti.tourismInfoId })'),
    ('"No itinerary items yet"', '{t("tour.noItineraryItemsYet")}'),
    ('"Create an itinerary item for this schedule."', '{t("tour.createScheduleItineraryHint")}'),
    ('? "Delete Schedule"', '? t("tour.deleteScheduleTitle")'),
    (': confirmAction?.type === "deactivateTicket"\n        ? "Deactivate Ticket"', ': confirmAction?.type === "deactivateTicket"\n        ? t("tour.deactivateTicket")'),
    (': "Activate Ticket";', ': t("tour.activateTicket");'),
    ('? "Are you sure you want to delete this schedule?"', '? t("tour.deleteScheduleQuestion")'),
    ('? "Customers will no longer see or book this ticket type."', '? t("tour.deactivateTicketDesc")'),
    (': "Customers will be able to see and book this ticket type.";', ': t("tour.activateTicketDesc");'),
    ('? "Delete"', '? t("tour.delete")'),
    ('? "Deactivate"', '? t("tour.deactivate")'),
    (': "Activate";', ': t("tour.activate");'),
    ('"Failed to load ticket types."', 't("tour.failedLoadTicketTypes")'),
    ('"Schedule ticket created successfully."', 't("tour.scheduleTicketCreated")'),
    ('"Failed to create schedule ticket."', 't("tour.failedCreateScheduleTicket")'),
    ('"Schedule ID is missing from URL."', 't("tour.scheduleIdMissing")'),
    ('"Loading schedule details..."', 't("tour.loadingScheduleDetails")'),
    ('"Back to Schedule"', '{t("tour.backToSchedule")}'),
    ('"Add Schedule Ticket"', '{t("tour.addScheduleTicket")}'),
    ('"Cancel"', '{t("common.cancel")}'),
    ('"Save Ticket"', '{t("tour.saveTicket")}'),
    ('isLoadingTicketTypes ? "Loading ticket types..." : "Select ticket type"', 'isLoadingTicketTypes ? t("tour.loadingTicketTypes") : t("tour.selectTicketType")'),
    ('message="Creating schedule ticket..."', 'message={t("tour.creatingScheduleTicket")}'),
    ('"Loading tour details..."', 't("tour.loadingTourDetailsMgr")'),
    ('error || "Tour not found."', 'error || t("tour.tourNotFound")'),
    ('"Back to Tour List"', '{t("tour.backToTourListMgr")}'),
    ('"No image available"', '{t("tour.noImageAvailable")}'),
    ('{tour.status || "Draft"}', '{getStatusLabel(tour.status)}'),
    ('"N/A Location"', 't("tour.naLocation")'),
    ('showError("Please inactive tour before edit")', 'showError(t("tour.inactiveBeforeEdit"))'),
    ('"Edit Tour"', '{t("tour.editTour")}'),
    ('"Duration"', '{t("tour.durationStat")}'),
    ('"Schedules"', '{t("tour.schedules")}'),
    ('scheduleCount === 1 ? "trip" : "trips"', 'scheduleCount === 1 ? t("tour.trips") : t("tour.tripsPlural")'),
    ('"Rating"', '{t("tour.rating")}'),
    ('"No ratings"', 't("tour.noRatings")'),
    ('"Description"', '{t("common.description")}'),
    ('"No description provided for this tour."', '{t("tour.noDescriptionProvided")}'),
    ('"Itineraries"', '{t("tour.itineraries")}'),
    ('"Add Itinerary"', '{t("tour.addItinerary")}'),
    ('"Day {dayNumber}"', '{t("tour.dayLabel", { count: dayNumber })}'),
    ('"No itineraries yet"', '{t("tour.noItinerariesYet")}'),
    ('"Create an itinerary to let your customers know what to expect."', '{t("tour.createItineraryHint")}'),
    ('"Add Schedule"', '{t("tour.addSchedule")}'),
    ('"Departure"', '{t("tour.departure")}'),
    ('"Availability"', '{t("tour.availability")}'),
    ('"No schedules yet"', '{t("tour.noSchedulesYet")}'),
    ('"Create a schedule to start accepting bookings."', '{t("tour.createScheduleHint")}'),
    ('"Loading reviews..."', '{t("tour.loadingReviewsMgr")}'),
    ('"No reviews yet"', '{t("tour.noReviews")}'),
    ('"Reviews from customers will appear here."', '{t("tour.reviewsFromCustomers")}'),
    ('"Reply to customer review"', '{t("tour.replyToReview")}'),
]


def ensure_hook(content: str, filename: str) -> str:
    if "useTranslation" in content:
        return content
    lines = content.splitlines(keepends=True)
    last_import = 0
    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_import = i
    lines.insert(last_import + 1, IMPORT)
    content = "".join(lines)
    import re
    for pattern in [
        r"(export const \w+: React\.FC(?:<[^>]*>)? = \(\) => \{\n)",
        r"(export const \w+: React\.FC = \(\) => \{\n)",
        r"(const AdminReviewCard: React\.FC<[^>]+> = \(\{[^}]+\}\) => \{\n)",
    ]:
        m = re.search(pattern + r"(?!\s*const \{ t \})", content)
        if m:
            content = content[: m.end(1)] + HOOK + content[m.end(1) :]
            break
    return content


def process_file(name: str, extra: list[tuple[str, str]] | None = None) -> None:
    path = PAGES / name
    if not path.exists():
        print(f"skip missing {name}")
        return
    text = path.read_text(encoding="utf-8")
    text = ensure_hook(text, name)
    for old, new in (COMMON_REPLACEMENTS + (extra or [])):
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")
    print(f"processed {name}")


def main():
    process_file("CreateScheduleTicket.tsx")
    process_file("TourScheduleDetail.tsx")
    process_file("TourDetail.tsx")
    process_file("DashboardReviewManager.tsx", [
        ('review.customerName || "Anonymous Customer"', 'review.customerName || t("tour.anonymousCustomer")'),
        ('"Tour Operator"', 't("tour.tourOperator")'),
        ('showSuccess("Reply updated successfully!")', 'showSuccess(t("tour.replyUpdated"))'),
        ('showSuccess("Replied to customer successfully!")', 'showSuccess(t("tour.replySent"))'),
        ('showSuccess("Reply deleted!")', 'showSuccess(t("tour.replyDeleted"))'),
        ('`Review has been ${newStatus ? "hidden" : "made visible"}.`', 'newStatus ? t("tour.reviewHidden") : t("tour.reviewVisible")'),
        ('<EyeOff size={12} /> Hidden', '<EyeOff size={12} /> {t("tour.hidden")}'),
        ('title={review.isHidden ? "Unhide Review" : "Hide Review"}', 'title={review.isHidden ? t("tour.unhideReview") : t("tour.hideReview")}'),
        ('alt={existingReply.userName || "Staff"}', 'alt={existingReply.userName || t("tour.staff")}'),
        ("? 'Your Reply' : existingReply.userName || 'Staff'", '? t("tour.yourReply") : existingReply.userName || t("tour.staff")'),
        ('"Reply to customer"', '{t("tour.replyToCustomer")}'),
        ('title="Edit Reply"', 'title={t("tour.editReply")}'),
        ('title="Delete Reply"', 'title={t("tour.deleteReply")}'),
        ('placeholder="Write your response to the customer..."', 'placeholder={t("tour.writeReplyPlaceholder")}'),
        ('{isEditing ? "Update" : "Send Reply"}', '{isEditing ? t("common.update") : t("tour.sendReply")}'),
        ('<MessageSquarePlus size={16} /> Write a reply', '<MessageSquarePlus size={16} /> {t("tour.writeReply")}'),
        ('? "Confirm delete reply"', '? t("tour.confirmDeleteReply")'),
        ('? "Confirm hide review"', '? t("tour.confirmHideReview")'),
        (': "Confirm unhide review"', ': t("tour.confirmUnhideReview")'),
        ('? "Are you sure you want to delete this reply?"', '? t("tour.confirmDeleteReplyMsg")'),
        ('? "Are you sure you want to hide this review?"', '? t("tour.confirmHideReviewMsg")'),
        (': "Are you sure you want to unhide this review?"', ': t("tour.confirmUnhideReviewMsg")'),
        ('? "Hide"', '? t("tour.hide")'),
        (': "Unhide"', ': t("tour.unhide")'),
        ('"Select Tour"', '{t("tour.selectTourTitle")}'),
        ('"Manage reviews by tour"', '{t("tour.manageReviewsByTour")}'),
        ('"Tour Reviews"', '{t("tour.tourReviews")}'),
        ('{reviews?.length || 0} review(s) found', '{t("tour.reviewsFound", { count: reviews?.length || 0 })}'),
        ('"Select a tour from the left to view reviews."', '{t("tour.selectTourForReviews")}'),
        ('"No Reviews Yet"', '{t("tour.noReviewsForTour")}'),
        ('"This tour hasn\'t received any customer reviews."', '{t("tour.noReviewsForTourHint")}'),
        ('"No tours found."', '{t("tour.noToursFound")}'),
    ])
    print("done")


if __name__ == "__main__":
    main()
