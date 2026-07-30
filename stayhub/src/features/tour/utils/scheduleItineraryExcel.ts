import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { TourismInformation } from "../../content/types/tourismInformation";
import type { CreateTourScheduleItineraryRequest } from "../types/tourScheduleItinerary";

export type ImportedScheduleItinerary = CreateTourScheduleItineraryRequest & {
  tourismSearchKeyword?: string;
};

// Đã bỏ "Latitude" và "Longitude"
const EXPECTED_HEADERS = [
  "DayNumber",
  "ItineraryDate",
  "Title",
  "Description",
  "StartTime",
  "EndTime",
  "LocationName",
  "TourismName",
];

const asText = (value: unknown) => String(value ?? "").trim();

const asRequiredNumber = (value: unknown, field: string) => {
  const text = asText(value);
  const numberValue = Number(text);
  if (!text || !Number.isFinite(numberValue)) {
    throw new Error(`${field} must be a valid number.`);
  }
  return numberValue;
};

const normalizeName = (value: string) =>
  value.trim().toLocaleLowerCase().replace(/\s+/g, " ");

const asDate = (value: ExcelJS.CellValue) => {
  if (value === null || value === undefined || value === "") {
    throw new Error("ItineraryDate is required.");
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (typeof value === "object" && "richText" in value) {
    value = value.richText.map((t) => t.text).join("");
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

const asTime = (value: ExcelJS.CellValue, field: string) => {
  if (value === null || value === undefined || value === "") {
    throw new Error(`${field} is required.`);
  }

  if (typeof value === "number") {
    const totalMinutes = Math.round((value % 1) * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  if (value instanceof Date) {
    return `${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}`;
  }

  if (typeof value === "object" && "richText" in value) {
    value = value.richText.map((t) => t.text).join("");
  }

  const text = asText(value);
  const match = text.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (!match) {
    throw new Error(`${field} must use HH:mm format.`);
  }
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

export const downloadScheduleItineraryExcelTemplate = async (tourismInformationList: TourismInformation[] = []) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "StayHub";
  workbook.created = new Date();

  const itinerarySheet = workbook.addWorksheet("Itineraries", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const tourismNames = tourismInformationList.map(t => t.name).filter(Boolean);
  if (tourismNames.length > 0) {
    const dataSheet = workbook.addWorksheet("TourismData", { state: "hidden" });
    tourismNames.forEach((name, idx) => {
      dataSheet.getCell(`A${idx + 1}`).value = name;
    });
  }

  const instructionSheet = workbook.addWorksheet("Instructions");

  const HEADER_FILL = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "E0E7FF" },
  };

  const BORDER = {
    top: { style: "thin" as const },
    left: { style: "thin" as const },
    right: { style: "thin" as const },
    bottom: { style: "thin" as const },
  };

  itinerarySheet.columns = [
    { header: EXPECTED_HEADERS[0], key: "dayNumber", width: 15 },
    { header: EXPECTED_HEADERS[1], key: "itineraryDate", width: 18 },
    { header: EXPECTED_HEADERS[2], key: "title", width: 30 },
    { header: EXPECTED_HEADERS[3], key: "description", width: 50 },
    { header: EXPECTED_HEADERS[4], key: "startTime", width: 15 },
    { header: EXPECTED_HEADERS[5], key: "endTime", width: 15 },
    { header: EXPECTED_HEADERS[6], key: "locationName", width: 30 },
    { header: EXPECTED_HEADERS[7], key: "tourismName", width: 30 },
  ];

  itinerarySheet.getRow(1).height = 24;
  itinerarySheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.fill = HEADER_FILL;
    cell.border = BORDER;
  });

  // Thêm 1 record mẫu và hướng dẫn kế bên
  const sampleRow = itinerarySheet.addRow([
    1,
    new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 7), // A week from now
    "Khám phá chợ Bến Thành",
    "Tham quan chợ, mua sắm đặc sản và tìm hiểu văn hóa địa phương.",
    0.333333, // 08:00 in Excel time
    0.4375, // 10:30 in Excel time
    "Chợ Bến Thành, Quận 1",
    "",
    "👈 Dữ liệu mẫu (Hãy xóa dòng này trước khi import). Đọc thêm ở sheet Instructions."
  ]);
  
  // Format lại cột I (hướng dẫn)
  itinerarySheet.getColumn(9).width = 75;
  sampleRow.getCell(9).font = { italic: true, color: { argb: "FF0000" } };
  sampleRow.getCell(9).alignment = { vertical: "middle" };

  //
  // RÀNG BUỘC KIỂU DỮ LIỆU (Áp dụng cho 100 dòng đầu tiên)
  //
  for (let i = 2; i <= 100; i++) {
    // 1. DayNumber (Cột A) - Phải là số nguyên dương
    const dayCell = itinerarySheet.getCell(`A${i}`);
    dayCell.dataValidation = {
      type: "whole",
      operator: "greaterThan",
      allowBlank: true,
      formulae: [0],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Sai định dạng DayNumber",
      error: "DayNumber phải là số nguyên dương (Ví dụ: 1, 2, 3).",
    };

    // 2. ItineraryDate (Cột B) - Format ngày
    const dateCell = itinerarySheet.getCell(`B${i}`);
    dateCell.numFmt = "yyyy-mm-dd";
    dateCell.dataValidation = {
      type: "date",
      operator: "between",
      allowBlank: true,
      formulae: [new Date("2000-01-01"), new Date("2100-01-01")],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Sai định dạng ngày",
      error: "Vui lòng nhập ngày đúng định dạng YYYY-MM-DD (Ví dụ: 2026-07-28).",
    };

    // 3. StartTime (Cột E) - Format giờ
    const startTimeCell = itinerarySheet.getCell(`E${i}`);
    startTimeCell.numFmt = "hh:mm";
    startTimeCell.dataValidation = {
      type: "decimal", // Thay vì "time", ta dùng "decimal" để chiều lòng TypeScript
      operator: "between",
      allowBlank: true,
      formulae: [0, 0.9999], // Từ 00:00 đến 23:59
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Sai định dạng giờ",
      error: "Vui lòng nhập giờ đúng định dạng HH:mm (Ví dụ: 08:30).",
    };

    // 4. EndTime (Cột F) - Format giờ
    const endTimeCell = itinerarySheet.getCell(`F${i}`);
    endTimeCell.numFmt = "hh:mm";
    endTimeCell.dataValidation = {
      type: "decimal",
      operator: "between",
      allowBlank: true,
      formulae: [0, 0.9999],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Sai định dạng giờ",
      error: "Vui lòng nhập giờ đúng định dạng HH:mm (Ví dụ: 10:30).",
    };

    // 8. TourismName (Cột H) - Dropdown danh sách Tourism
    if (tourismNames.length > 0) {
      const tourismCell = itinerarySheet.getCell(`H${i}`);
      tourismCell.dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`'TourismData'!$A$1:$A$${tourismNames.length}`],
        showErrorMessage: true,
        errorStyle: "warning",
        errorTitle: "Địa điểm không có sẵn",
        error: "Bạn đã nhập tên không có trong danh sách Tourism có sẵn, vui lòng đảm bảo tên chính xác hoặc chọn từ danh sách.",
      };
    }
  }

  //
  // Instructions Sheet 
  //
  instructionSheet.columns = [
    { width: 20 }, { width: 15 }, { width: 80 }
  ];

  instructionSheet.addRow(["Column", "Required", "Notes"]);
  instructionSheet.addRow(["DayNumber", "Yes", "Positive integer."]);
  instructionSheet.addRow(["ItineraryDate", "Yes", "YYYY-MM-DD format (e.g., 2026-07-28)."]);
  instructionSheet.addRow(["Title", "Yes", "Between 3 and 255 characters."]);
  instructionSheet.addRow(["Description", "No", "Maximum 2000 characters."]);
  instructionSheet.addRow(["StartTime", "Yes", "HH:mm format (e.g., 08:30)."]);
  instructionSheet.addRow(["EndTime", "Yes", "HH:mm format (e.g., 10:30). Must be later than StartTime."]);
  instructionSheet.addRow(["LocationName", "No", "Phải chọn lại trên map ở UI khi import lên web để hệ thống lấy được dữ liệu giao diện."]);
  instructionSheet.addRow(["TourismName", "No", "Tên địa điểm du lịch trong hệ thống nếu có. Nên chọn từ danh sách thả xuống."]);

  instructionSheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = HEADER_FILL;
    cell.border = BORDER;
  });

  instructionSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = BORDER;
      cell.alignment = { vertical: "middle", wrapText: true };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `StayHub_Schedule_Itinerary_Template.xlsx`,
  );
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

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const worksheet = workbook.getWorksheet("Itineraries") || workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error("Worksheet 'Itineraries' not found in the Excel file.");
  }

  const headerRow = worksheet.getRow(1);
  const headers = EXPECTED_HEADERS.map((_, index) => asText(headerRow.getCell(index + 1).value));

  const invalidHeader = EXPECTED_HEADERS.find((header, index) => headers[index] !== header);
  if (invalidHeader) {
    throw new Error(`Invalid template. Expected column "${invalidHeader}".`);
  }

  const dataRows: ExcelJS.Row[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) dataRows.push(row);
  });
  
  if (!dataRows || dataRows.length === 0) {
    throw new Error("The Excel file does not contain schedule itinerary rows.");
  }

  const errors: string[] = [];
  const itineraries: ImportedScheduleItinerary[] = [];

  dataRows.forEach((row) => {
    const rowNumber = row.number;
    try {
      const dayNumber = asRequiredNumber(row.getCell(1).value, "DayNumber");
      const itineraryDate = asDate(row.getCell(2).value);
      const title = asText(row.getCell(3).value);
      const description = asText(row.getCell(4).value);
      const startDuration = asTime(row.getCell(5).value, "StartTime");
      const endDuration = asTime(row.getCell(6).value, "EndTime");
      const locationName = asText(row.getCell(7).value);
      const tourismName = asText(row.getCell(8).value);

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
        locationLat: null,
        locationLng: null,
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
    // Dùng \n để xuống dòng, giúp hiển thị lỗi đẹp và dễ đọc hơn ở phía giao diện
    throw new Error([...new Set(errors)].slice(0, 20).join("\n"));
  }
  if (itineraries.length === 0) {
    throw new Error("The Excel file does not contain schedule itinerary rows.");
  }

  return itineraries;
};