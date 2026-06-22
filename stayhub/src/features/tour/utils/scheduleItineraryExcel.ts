import { readSheet, type CellValue } from "read-excel-file/browser";
import type { TourismInformation } from "../../content/types/tourismInformation";
import type { CreateTourScheduleItineraryRequest } from "../types/tourScheduleItinerary";

export type ImportedScheduleItinerary = CreateTourScheduleItineraryRequest & {
  tourismSearchKeyword?: string;
};

const EXPECTED_HEADERS = [
  "DayNumber",
  "ItineraryDate",
  "Title",
  "Description",
  "StartTime",
  "EndTime",
  "LocationName",
  "Latitude",
  "Longitude",
  "TourismName",
];

const asText = (value: CellValue | null) => String(value ?? "").trim();

const asRequiredNumber = (value: CellValue | null, field: string) => {
  const numberValue = typeof value === "number" ? value : Number(asText(value));
  if (!Number.isFinite(numberValue)) {
    throw new Error(`${field} must be a valid number.`);
  }
  return numberValue;
};

const asOptionalNumber = (value: CellValue | null, field: string) => {
  if (value === null || asText(value) === "") return null;
  return asRequiredNumber(value, field);
};

const normalizeName = (value: string) =>
  value.trim().toLocaleLowerCase().replace(/\s+/g, " ");

const asDate = (value: CellValue | null) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const text = asText(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error("ItineraryDate must use YYYY-MM-DD format.");
  }

  const date = new Date(`${text}T00:00:00`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() + 1 !== Number(match[2]) ||
    date.getDate() !== Number(match[3])
  ) {
    throw new Error("ItineraryDate is not a valid date.");
  }
  return text;
};

const asTime = (value: CellValue | null, field: string) => {
  if (typeof value === "number") {
    const totalMinutes = Math.round((value % 1) * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  if (value instanceof Date) {
    return `${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}`;
  }

  const text = asText(value);
  const match = text.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (!match) {
    throw new Error(`${field} must use HH:mm format.`);
  }
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

export const parseScheduleItineraryExcel = async (
  file: File,
  scheduleId: number,
  tourismInformationList: TourismInformation[],
): Promise<ImportedScheduleItinerary[]> => {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Only .xlsx files are supported.");
  }
  if (file.size === 0 || file.size > 5 * 1024 * 1024) {
    throw new Error("Excel file must be non-empty and no larger than 5 MB.");
  }

  const rows = await readSheet(file);
  if (rows.length < 2) {
    throw new Error("The Excel file does not contain schedule itinerary rows.");
  }

  const headers = rows[0].map(asText);
  const invalidHeader = EXPECTED_HEADERS.find(
    (header, index) => headers[index] !== header,
  );
  if (invalidHeader) {
    throw new Error(`Invalid template. Expected column "${invalidHeader}".`);
  }

  const errors: string[] = [];
  const itineraries: ImportedScheduleItinerary[] = [];

  rows.slice(1).forEach((row, index) => {
    if (row.every((cell) => cell === null || asText(cell) === "")) return;

    const rowNumber = index + 2;
    try {
      const dayNumber = asRequiredNumber(row[0], "DayNumber");
      const itineraryDate = asDate(row[1]);
      const title = asText(row[2]);
      const description = asText(row[3]);
      const startDuration = asTime(row[4], "StartTime");
      const endDuration = asTime(row[5], "EndTime");
      const locationName = asText(row[6]);
      const locationLat = asOptionalNumber(row[7], "Latitude");
      const locationLng = asOptionalNumber(row[8], "Longitude");
      const tourismName = asText(row[9]);
      const matchingTourismInformation = tourismName
        ? tourismInformationList.filter(
            (item) => normalizeName(item.name) === normalizeName(tourismName),
          )
        : [];
      const matchedTourismInformation =
        matchingTourismInformation.length === 1
          ? matchingTourismInformation[0]
          : null;

      if (!Number.isInteger(dayNumber) || dayNumber <= 0)
        throw new Error("DayNumber must be a positive integer.");
      if (title.length < 3 || title.length > 255)
        throw new Error("Title must be between 3 and 255 characters.");
      if (description.length > 2000)
        throw new Error("Description cannot exceed 2000 characters.");
      if (locationName.length > 255)
        throw new Error("LocationName cannot exceed 255 characters.");
      if (locationLat !== null && (locationLat < -90 || locationLat > 90))
        throw new Error("Latitude must be between -90 and 90.");
      if (locationLng !== null && (locationLng < -180 || locationLng > 180))
        throw new Error("Longitude must be between -180 and 180.");
      if (endDuration <= startDuration)
        throw new Error("EndTime must be later than StartTime.");

      itineraries.push({
        scheduleId,
        dayNumber,
        itineraryDate,
        title,
        description,
        startDuration,
        endDuration,
        locationName,
        locationLat,
        locationLng,
        tourismInfoId: matchedTourismInformation?.id ?? null,
        tourismSearchKeyword: matchedTourismInformation ? "" : tourismName,
      });
    } catch (error) {
      errors.push(
        `Row ${rowNumber}: ${error instanceof Error ? error.message : "Invalid data."}`,
      );
    }
  });

  const dayDates = new Map<number, string>();
  const dateDays = new Map<string, number>();
  const dateTimes = new Set<string>();
  for (const itinerary of itineraries) {
    const existingDate = dayDates.get(itinerary.dayNumber);
    if (existingDate && existingDate !== itinerary.itineraryDate) {
      errors.push(`Day ${itinerary.dayNumber} contains multiple dates.`);
    }
    dayDates.set(itinerary.dayNumber, itinerary.itineraryDate);

    const existingDay = dateDays.get(itinerary.itineraryDate);
    if (existingDay && existingDay !== itinerary.dayNumber) {
      errors.push(`Date ${itinerary.itineraryDate} is assigned to multiple days.`);
    }
    dateDays.set(itinerary.itineraryDate, itinerary.dayNumber);

    const dateTimeKey = `${itinerary.itineraryDate}-${itinerary.startDuration}`;
    if (dateTimes.has(dateTimeKey)) {
      errors.push(
        `StartTime ${itinerary.startDuration} is duplicated on ${itinerary.itineraryDate}.`,
      );
    }
    dateTimes.add(dateTimeKey);
  }

  if (errors.length > 0) {
    throw new Error([...new Set(errors)].slice(0, 20).join(" "));
  }
  if (itineraries.length === 0) {
    throw new Error("The Excel file does not contain schedule itinerary rows.");
  }

  return itineraries;
};
