import { z } from "zod";
import { TOURISM_INFORMATION_TYPES } from "../types/tourismInformation";
import { isCoordinateOnlyAddress } from "../../tour/services/mapGeocoding.service";

export const tourismInfoSchema = z.object({
  name: z.string().min(1, "placeNameRequired"),
  type: z.enum(TOURISM_INFORMATION_TYPES as [string, ...string[]]),
  description: z.string().optional(),
  address: z.string().min(1, "locationRequired"),
  city: z.string().min(1, "cityRequired"),
  country: z.string().min(1, "countryRequired"),
  latitude: z.number().min(-90, "latitudeInvalid").max(90, "latitudeInvalid"),
  longitude: z.number().min(-180, "longitudeInvalid").max(180, "longitudeInvalid"),
  sourceName: z.string().optional(),
  sourceUrl: z.string().optional().refine((val) => {
    if (!val) return true;
    try {
      const url = new URL(val);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, { message: "sourceUrlInvalid" }),
}).refine((data) => {
  if (isCoordinateOnlyAddress(data.address)) {
    return false;
  }
  return true;
}, {
  message: "locationPickRequired",
  path: ["address"],
});
