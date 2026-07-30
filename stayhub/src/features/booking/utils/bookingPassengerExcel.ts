import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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

const HEADER_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "E0E7FF" },
};

const PROTECTED_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "F1F5F9" },
};

const EDITABLE_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FFFACD" },
};

const BORDER = {
  top: { style: "thin" as const },
  left: { style: "thin" as const },
  right: { style: "thin" as const },
  bottom: { style: "thin" as const },
};

const GENDER_LIST = ["Male", "Female", "Other"];

const NATIONALITY_LIST = [
  "Vietnam",
  "Japan",
  "Korea",
  "China",
  "Singapore",
  "Thailand",
  "Malaysia",
  "United States",
  "United Kingdom",
  "Australia",
  "France",
  "Germany",
  "Canada",
];

export const downloadBookingPassengerExcel = async (
  records: BookingPassengerExcelRecord[],
) => {
  if (records.length === 0) {
    throw new Error(
      "Select at least one ticket before downloading the Excel file.",
    );
  }

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "StayHub";
  workbook.created = new Date();

  const passengerSheet = workbook.addWorksheet("Passengers", {
    views: [
      {
        state: "frozen",
        ySplit: 1,
      },
    ],
  });

  const instructionSheet = workbook.addWorksheet("Instructions");

  const validationSheet = workbook.addWorksheet("Validation");

  validationSheet.state = "veryHidden";

  validationSheet.getColumn(1).values = [
    "Gender",
    ...GENDER_LIST,
  ];

  validationSheet.getColumn(2).values = [
    "Nationality",
    ...NATIONALITY_LIST,
  ];

  workbook.definedNames.add(
    "GenderList",
    "Validation!$A$2:$A$4",
  );

  workbook.definedNames.add(
    "NationalityList",
    `Validation!$B$2:$B$${NATIONALITY_LIST.length + 1}`,
  );

  passengerSheet.columns = [
    {
      header: EXPECTED_HEADERS[0],
      key: "recordNumber",
      width: 15,
    },
    {
      header: EXPECTED_HEADERS[1],
      key: "ticketType",
      width: 24,
    },
    {
      header: EXPECTED_HEADERS[2],
      key: "fullName",
      width: 35,
    },
    {
      header: EXPECTED_HEADERS[3],
      key: "passport",
      width: 22,
    },
    {
      header: EXPECTED_HEADERS[4],
      key: "dob",
      width: 20,
    },
    {
      header: EXPECTED_HEADERS[5],
      key: "gender",
      width: 16,
    },
    {
      header: EXPECTED_HEADERS[6],
      key: "nationality",
      width: 24,
    },
  ];

  passengerSheet.getRow(1).height = 24;

  passengerSheet.getRow(1).eachCell((cell) => {
    cell.font = {
      bold: true,
    };

    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    cell.fill = HEADER_FILL;

    cell.border = BORDER;

    cell.protection = {
      locked: true,
    };
  });

  records.forEach((record, index) => {
    const rowNumber = index + 2;

    passengerSheet.addRow({
      recordNumber: index + 1,
      ticketType: record.ticketTypeName,
      fullName: record.attendeeName,
      passport: record.idCard,
      dob: record.dateOfBirth
        ? new Date(record.dateOfBirth)
        : new Date("1990-05-20"),
      gender: record.gender || "Male",
      nationality: record.nationality || "Vietnam",
    });

    const row = passengerSheet.getRow(rowNumber);

    row.height = 22;

    row.eachCell((cell) => {
      cell.border = BORDER;
      cell.alignment = {
        vertical: "middle",
      };
    });

    //
    // Record Number (Locked)
    //
    row.getCell(1).fill = PROTECTED_FILL;

    row.getCell(1).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    row.getCell(1).protection = {
      locked: true,
    };

    //
    // Ticket Type (Locked)
    //
    row.getCell(2).fill = PROTECTED_FILL;

    row.getCell(2).protection = {
      locked: true,
    };

    //
    // Full Name
    //
    row.getCell(3).fill = EDITABLE_FILL;

    row.getCell(3).protection = {
      locked: false,
    };

    //
    // Passport
    //
    row.getCell(4).fill = EDITABLE_FILL;

    row.getCell(4).numFmt = "@";

    row.getCell(4).protection = {
      locked: false,
    };

    //
    // Birthday
    //
    row.getCell(5).fill = EDITABLE_FILL;

    row.getCell(5).numFmt = "yyyy-mm-dd";

    row.getCell(5).protection = {
      locked: false,
    };

    //
    // Gender
    //
    row.getCell(6).fill = EDITABLE_FILL;

    row.getCell(6).protection = {
      locked: false,
    };

    //
    // Nationality
    //
    row.getCell(7).fill = EDITABLE_FILL;

    row.getCell(7).protection = {
      locked: false,
    };
  });
  //
  // Data Validation
  //

  for (let i = 2; i <= records.length + 1; i++) {
    //
    // Full Name
    //
    passengerSheet.getCell(`C${i}`).dataValidation = {
      type: "textLength",
      operator: "lessThanOrEqual",
      allowBlank: false,
      formulae: [255],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Invalid Full Name",
      error: "Full Name is required and cannot exceed 255 characters.",
    };

    //
    // Passport
    //
    passengerSheet.getCell(`D${i}`).dataValidation = {
      type: "textLength",
      operator: "lessThanOrEqual",
      allowBlank: false,
      formulae: [20],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Invalid Passport",
      error: "Passport / ID cannot exceed 20 characters.",
    };

    //
    // Birthday
    //
    passengerSheet.getCell(`E${i}`).dataValidation = {
      type: "date",
      operator: "lessThanOrEqual",
      allowBlank: false,
      formulae: [new Date()],
      showInputMessage: true,
      promptTitle: "Birthday",
      prompt: "Please enter a valid date.",
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Invalid Birthday",
      error: "Birthday must not be greater than today.",
    };
//
    // Gender
    //
    passengerSheet.getCell(`F${i}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Male,Female,Other"'], // Mũi tên dropdown sẽ tự động hiện nhờ type: "list"
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Invalid Gender",
      error: "Please select Male, Female or Other.",
    };

    //
    // Nationality
    //
    passengerSheet.getCell(`G${i}`).dataValidation = {
      type: "textLength",
      operator: "lessThanOrEqual",
      allowBlank: false,
      formulae: [100],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Invalid Nationality",
      error: "Nationality cannot exceed 100 characters.",
    };
  }

  //
  // Instructions Sheet
  //

  instructionSheet.columns = [
    {
      width: 24,
    },
    {
      width: 15,
    },
    {
      width: 70,
    },
  ];

  instructionSheet.addRow([
    "Column",
    "Required",
    "Notes",
  ]);

  instructionSheet.addRow([
    "RecordNumber",
    "No",
    "Read-only. Generated automatically.",
  ]);

  instructionSheet.addRow([
    "TicketType",
    "No",
    "Read-only. Cannot be modified.",
  ]);

  instructionSheet.addRow([
    "FullName",
    "Yes",
    "Maximum 255 characters.",
  ]);

  instructionSheet.addRow([
    "IDPassport",
    "Yes",
    "Maximum 20 characters.",
  ]);

  instructionSheet.addRow([
    "DateOfBirth",
    "Yes",
    "Must not be greater than today. Format yyyy-mm-dd.",
  ]);

  instructionSheet.addRow([
    "Gender",
    "Yes",
    "Choose Male, Female or Other.",
  ]);

  instructionSheet.addRow([
    "Nationality",
    "Yes",
    "Maximum 100 characters.",
  ]);

  instructionSheet.getRow(1).eachCell((cell) => {
    cell.font = {
      bold: true,
    };

    cell.fill = HEADER_FILL;

    cell.border = BORDER;
  });

  instructionSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = BORDER;

      cell.alignment = {
        vertical: "middle",
        wrapText: true,
      };
    });
  });

  //
  // Protect Sheet
  //

  await passengerSheet.protect("StayHub", {
    selectLockedCells: true,
    selectUnlockedCells: true,

    formatCells: false,
    formatColumns: false,
    formatRows: false,

    insertColumns: false,
    insertRows: false,

    deleteColumns: false,
    deleteRows: false,

    sort: false,
    autoFilter: false,

    pivotTables: false,
  });

  //
  // Export
  //

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `StayHub_Passengers_${records.length}_Tickets.xlsx`,
  );
}; // <--- [ĐÃ FIX] Đóng ngoặc hàm downloadBookingPassengerExcel tại đây

const asText = (value: unknown) => String(value ?? "").trim();

const normalizeText = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const parseDateOfBirth = (value: ExcelJS.CellValue): string => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  //
  // Excel Date
  //
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  //
  // RichText
  //
  if (typeof value === "object" && "richText" in value) {
    const text = value.richText.map((t) => t.text).join("");

    return text.trim();
  }

  const text = asText(value);

  if (text === "") {
    return "";
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    throw new Error("DateOfBirth is invalid.");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const parseBookingPassengerExcel = async (
  file: File,
  currentRecords: BookingPassengerExcelRecord[],
): Promise<BookingPassengerExcelRecord[]> => {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Only .xlsx files are supported.");
  }

  if (file.size === 0 || file.size > 5 * 1024 * 1024) {
    throw new Error(
      "Excel file must be non-empty and no larger than 5 MB.",
    );
  }

  if (currentRecords.length === 0) {
    throw new Error(
      "Select tickets before importing passenger information.",
    );
  }

  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(await file.arrayBuffer());

  const worksheet = workbook.getWorksheet("Passengers");

  if (!worksheet) {
    throw new Error(
      'Worksheet "Passengers" was not found.',
    );
  }

  //
  // Header Validation
  //
  const headerRow = worksheet.getRow(1);

  const headers = EXPECTED_HEADERS.map((_, index) =>
    asText(headerRow.getCell(index + 1).value),
  );

  const invalidHeader = EXPECTED_HEADERS.find(
    (header, index) => headers[index] !== header,
  );

  if (invalidHeader) {
    throw new Error(
      `Invalid template. Expected column "${invalidHeader}".`,
    );
  }

  //
  // Read Data
  //
  const dataRows = worksheet
    .getRows(2, worksheet.rowCount - 1)
    ?.filter((row) =>
      Array.isArray(row.values) &&
      row.values.some(
        (value, index) =>
          index !== 0 &&
          value !== null &&
          value !== undefined &&
          asText(value) !== "",
      ),
    );

  if (!dataRows || dataRows.length === 0) {
    throw new Error(
      "The Excel file does not contain passenger records.",
    );
  }

  if (dataRows.length !== currentRecords.length) {
    throw new Error(
      `Excel contains ${dataRows.length} passenger records, but ${currentRecords.length} tickets are selected.`,
    );
  }

  const importedRecords = currentRecords.map((record) => ({
    ...record,
  }));

  const usedRecordNumbers = new Set<number>();

  const errors: string[] = [];

  //
  // Continue in Part 3B...
  //
  dataRows.forEach((row) => {
    const excelRowNumber = row.number;

    try {
      //
      // Record Number
      //
      const recordNumber = Number(asText(row.getCell(1).value));

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
        throw new Error(
          `RecordNumber ${recordNumber} is duplicated.`,
        );
      }

      usedRecordNumbers.add(recordNumber);

      const targetIndex = recordNumber - 1;

      const currentRecord = currentRecords[targetIndex];

      //
      // Ticket Type
      //
      const ticketType = asText(row.getCell(2).value);

      if (
        normalizeText(ticketType) !==
        normalizeText(currentRecord.ticketTypeName)
      ) {
        throw new Error(
          `TicketType must remain "${currentRecord.ticketTypeName}".`,
        );
      }

      //
      // Full Name
      //
      const attendeeName = asText(row.getCell(3).value);

      if (!attendeeName) {
        throw new Error("FullName is required.");
      }

      if (attendeeName.length > 255) {
        throw new Error(
          "FullName cannot exceed 255 characters.",
        );
      }

      //
      // Passport
      //
      const idCard = asText(row.getCell(4).value);

      if (!idCard) {
        throw new Error("IDPassport is required.");
      }

      if (idCard.length > 20) {
        throw new Error(
          "IDPassport cannot exceed 20 characters.",
        );
      }

      //
      // Birthday
      //
      const dateOfBirth = parseDateOfBirth(
        row.getCell(5).value,
      );

      if (!dateOfBirth) {
        throw new Error("DateOfBirth is required.");
      }

      const birthday = new Date(`${dateOfBirth}T00:00:00`);

      if (birthday.getTime() > Date.now()) {
        throw new Error(
          "DateOfBirth cannot be in the future.",
        );
      }

      //
      // Gender
      //
      const gender = asText(row.getCell(6).value);

      const normalizedGender = GENDER_LIST.find(
        (item) =>
          normalizeText(item) === normalizeText(gender),
      );

      if (!normalizedGender) {
        throw new Error(
          "Gender must be Male, Female or Other.",
        );
      }

      //
      // Nationality
      //
      const nationality = asText(row.getCell(7).value);

      if (!nationality) {
        throw new Error("Nationality is required.");
      }

      if (nationality.length > 100) {
        throw new Error(
          "Nationality cannot exceed 100 characters.",
        );
      }

      //
      // Update
      //
      importedRecords[targetIndex] = {
        ticketTypeName: currentRecord.ticketTypeName,
        attendeeName,
        idCard,
        dateOfBirth,
        gender: normalizedGender,
        nationality,
      };
    } catch (error) {
      errors.push(
        `Row ${excelRowNumber}: ${error instanceof Error
          ? error.message
          : "Invalid data."
        }`,
      );
    }
  });

  //
  // Missing Record Number
  //
  for (let i = 1; i <= currentRecords.length; i++) {
    if (!usedRecordNumbers.has(i)) {
      errors.push(
        `RecordNumber ${i} is missing from the Excel file.`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.slice(0, 20).join("\n"));
  }

  return importedRecords;
};