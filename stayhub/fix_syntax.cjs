
const fs = require("fs");
const files = [
  "src/features/auth/hooks/useResetPassword.ts",
  "src/features/content/hooks/useCreateBanner.ts",
  "src/features/content/hooks/useCreateCategory.ts",
  "src/features/content/hooks/useUpdateBanner.ts",
  "src/features/content/hooks/useUpdateCategory.ts",
  "src/features/tour/hooks/useCreateItinerary.ts",
  "src/features/tour/hooks/useCreateScheduleItinerary.ts",
  "src/features/tour/hooks/useCreateTour.ts",
  "src/features/tour/hooks/useUpdateItinerary.ts",
  "src/features/tour/hooks/useUpdateScheduleItinerary.ts",
  "src/features/tour/hooks/useUpdateTour.ts"
];

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  if (content.includes("t(errors.)")) {
    content = content.replace(/t\(errors\.\)/g, "t(`errors.${firstErrorMsg}`)");
    changed = true;
  }
  
  if (content.includes("!== errors. ?")) {
    content = content.replace(/!== errors\. \?/g, "!== `errors.${firstErrorMsg}` ?");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, "utf8");
    console.log("Fixed syntax error in", file);
  }
});

