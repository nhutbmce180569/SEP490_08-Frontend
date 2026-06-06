import { readSheet, type CellValue } from "read-excel-file/browser";
import writeXlsxFile, {
  type SheetData,
} from "write-excel-file/browser";

export type BookingPassengerExcelRecord = {
  ticketTypeName: string;
  attendeeName: string;
  idCard: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
};

const EXPECTED_HEADERS = [
  "RecordNumber",
  "TicketType",
  "FullName",
  "IDPassport",
  "DateOfBirth_YYYY-MM-DD",
  "Gender",
  "Nationality",
];

const HEADER_STYLE = {
  fontWeight: "bold" as const,
  backgroundColor: "#E0E7FF",
  borderColor: "#C7D2FE",
  borderStyle: "thin" as const,
};

const asText = (value: CellValue | null) => String(value ?? "").trim();

const normalizeText = (value: string) =>
  value.trim().toLocaleLowerCase().replace(/\s+/g, " ");

const parseDateOfBirth = (value: CellValue | null) => {
  if (value === null || asText(value) === "") return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const text = asText(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error("DateOfBirth must use YYYY-MM-DD format.");
  }

  const date = new Date(`${text}T00:00:00`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() + 1 !== Number(match[2]) ||
    date.getDate() !== Number(match[3])
  ) {
    throw new Error("DateOfBirth is not a valid date.");
  }

  return text;
};

export const downloadBookingPassengerExcel = async (
  records: BookingPassengerExcelRecord[],
) => {
  if (records.length === 0) {
    throw new Error("Select at least one ticket before downloading the Excel file.");
  }

  const passengerData: SheetData = [
    EXPECTED_HEADERS.map((header) => ({
      value: header,
      ...HEADER_STYLE,
    })),
    ...records.map((record, index) => [
      index + 1,
      { value: record.ticketTypeName, backgroundColor: "#F1F5F9" },
      record.attendeeName,
      { value: record.idCard, type: String, format: "@" },
      { value: record.dateOfBirth, type: String, format: "@" },
      record.gender || "Male",
      record.nationality || "Vietnam",
    ]),
  ];

  const instructionsData: SheetData = [
    ["Column", "Required", "Notes"].map((header) => ({
      value: header,
      ...HEADER_STYLE,
    })),
    ["RecordNumber", "Yes", "Generated from the selected tickets. Do not change."],
    ["TicketType", "Yes", "Generated from the selected tickets. Do not change."],
    ["FullName", "Yes", "Passenger full name."],
    ["IDPassport", "Yes", "ID card or passport number. Keep this column as text."],
    [
      "DateOfBirth_YYYY-MM-DD",
      "Yes",
      "Enter exactly 4-digit year, 2-digit month, and 2-digit day. Example: 1990-05-20.",
    ],
    ["Gender", "Yes", "Use Male, Female, or Other."],
    ["Nationality", "Yes", "Passenger nationality."],
  ];

  await writeXlsxFile([
    {
      data: passengerData,
      sheet: "Passengers",
      stickyRowsCount: 1,
      columns: [
        { width: 14 },
        { width: 24 },
        { width: 28 },
        { width: 22 },
        { width: 18 },
        { width: 14 },
        { width: 20 },
      ],
    },
    {
      data: instructionsData,
      sheet: "Instructions",
      stickyRowsCount: 1,
      columns: [{ width: 18 }, { width: 12 }, { width: 68 }],
    },
  ]).toFile(`StayHub_Passengers_${records.length}_Tickets.xlsx`);
};

export const parseBookingPassengerExcel = async (
  file: File,
  currentRecords: BookingPassengerExcelRecord[],
): Promise<BookingPassengerExcelRecord[]> => {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Only .xlsx files are supported.");
  }
  if (file.size === 0 || file.size > 5 * 1024 * 1024) {
    throw new Error("Excel file must be non-empty and no larger than 5 MB.");
  }
  if (currentRecords.length === 0) {
    throw new Error("Select tickets before importing passenger information.");
  }

  const rows = await readSheet(file);
  if (rows.length < 2) {
    throw new Error("The Excel file does not contain passenger records.");
  }

  const headers = rows[0].map(asText);
  const invalidHeader = EXPECTED_HEADERS.find(
    (header, index) => headers[index] !== header,
  );
  if (invalidHeader) {
    throw new Error(`Invalid template. Expected column "${invalidHeader}".`);
  }

  const dataRows = rows
    .slice(1)
    .filter((row) => row.some((cell) => cell !== null && asText(cell) !== ""));

  if (dataRows.length !== currentRecords.length) {
    throw new Error(
      `Excel contains ${dataRows.length} passenger records, but ${currentRecords.length} tickets are selected.`,
    );
  }

  const errors: string[] = [];
  const importedRecords = currentRecords.map((currentRecord) => ({
    ...currentRecord,
  }));
  const usedRecordNumbers = new Set<number>();

  dataRows.forEach((row, rowIndex) => {
    const excelRowNumber = rowIndex + 2;
    try {
      const recordNumber = Number(asText(row[0]));
      if (
        !Number.isInteger(recordNumber) ||
        recordNumber < 1 ||
        recordNumber > currentRecords.length
      ) {
        throw new Error(
          `RecordNumber must be between 1 and ${currentRecords.length}.`,
        );
      }
      if (usedRecordNumbers.has(recordNumber)) {
        throw new Error(`RecordNumber ${recordNumber} is duplicated.`);
      }
      usedRecordNumbers.add(recordNumber);

      const targetIndex = recordNumber - 1;
      const currentRecord = currentRecords[targetIndex];
      const ticketTypeName = asText(row[1]);
      if (
        normalizeText(ticketTypeName) !==
        normalizeText(currentRecord.ticketTypeName)
      ) {
        throw new Error(
          `TicketType must remain "${currentRecord.ticketTypeName}" for RecordNumber ${recordNumber}.`,
        );
      }

      const dateOfBirth = parseDateOfBirth(row[4]);
      if (
        dateOfBirth &&
        new Date(`${dateOfBirth}T00:00:00`).getTime() > Date.now()
      ) {
        throw new Error("DateOfBirth cannot be in the future.");
      }

      const gender = asText(row[5]) || "Male";
      const normalizedGender = ["Male", "Female", "Other"].find(
        (option) => normalizeText(option) === normalizeText(gender),
      );
      if (!normalizedGender) {
        throw new Error("Gender must be Male, Female, or Other.");
      }

      importedRecords[targetIndex] = {
        ticketTypeName: currentRecord.ticketTypeName,
        attendeeName: asText(row[2]),
        idCard: asText(row[3]),
        dateOfBirth,
        gender: normalizedGender,
        nationality: asText(row[6]) || "Vietnam",
      };
    } catch (error) {
      errors.push(
        `Row ${excelRowNumber}: ${error instanceof Error ? error.message : "Invalid data."}`,
      );
    }
  });

  if (errors.length > 0) {
    throw new Error(errors.slice(0, 20).join(" "));
  }

  return importedRecords;
};
