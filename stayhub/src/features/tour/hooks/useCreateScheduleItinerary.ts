import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createScheduleItineraryBatch } from "../services/tourScheduleItinerary.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTourSchedule } from "./useTourSchedule";
import { useTour } from "./useTour";
import { useTranslation } from "../../../contexts/LocaleContext";
import {
  getPlaceCoordinates,
  searchPlaces,
} from "../services/mapGeocoding.service";

export const useCreateScheduleItinerary = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { success, warning, error: showError } = useToast();

  const { currentSchedule: schedule, isLoading: isScheduleLoading, fetchScheduleById } = useTourSchedule();

  useEffect(() => {
    if (scheduleId) {
      fetchScheduleById(scheduleId);
    }
  }, [scheduleId, fetchScheduleById]);
  const { tour, isLoading: isTourLoading } = useTour(schedule?.tourId?.toString());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [cloningDayIndex, setCloningDayIndex] = useState<number | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, any>>({});
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [newlyAddedId, setNewlyAddedId] = useState<number | null>(null);
  const [invalidItineraryIds, setInvalidItineraryIds] = useState<Set<number>>(new Set());

  const isBlankItinerary = (itinerary: any) =>
    !itinerary.title &&
    !itinerary.description &&
    !itinerary.startDuration &&
    !itinerary.endDuration &&
    !itinerary.locationName &&
    (itinerary.locationLat === undefined || itinerary.locationLat === null) &&
    (itinerary.locationLng === undefined || itinerary.locationLng === null) &&
    !itinerary.tourismInfoId &&
    !itinerary.tourismSearchKeyword;

  const existingDayNumbers = useMemo(() => {
    return schedule?.tourScheduleItineraries?.map((i: any) => Number(i.dayNumber)).sort((a: number, b: number) => a - b) ?? [];
  }, [schedule?.tourScheduleItineraries]);

  const maxDay = existingDayNumbers.length ? Math.max(...existingDayNumbers) : 0;

  const missingDayNumbers = useMemo(() => {
    const missing: number[] = [];
    const used = new Set(existingDayNumbers);
    for (let i = 1; i <= maxDay; i += 1) {
      if (!used.has(i)) missing.push(i);
    }
    return missing;
  }, [existingDayNumbers, maxDay]);

  const cloneableDayNumbers = useMemo(() => {
    return tour?.tourItineraries?.map((iti) => Number(iti.dayNumber)) ?? [];
  }, [tour?.tourItineraries]);

  // Tự động điền ngày nếu dayNumber mặc định đã có trong Database
  useEffect(() => {
    if (schedule?.tourScheduleItineraries) {
      setItineraries((prev) => {
        let changed = false;
        const newItis = prev.map((iti) => {
          if (!iti.itineraryDate) {
            const dbDay = schedule.tourScheduleItineraries?.find((i: any) => Number(i.dayNumber) === Number(iti.dayNumber));
            if (dbDay && dbDay.itineraryDate) {
              changed = true;
              return { ...iti, itineraryDate: dbDay.itineraryDate.split("T")[0] };
            }
          }
          return iti;
        });
        return changed ? newItis : prev;
      });
    }
  }, [schedule]);

  useEffect(() => {
    if (newlyAddedId) {
      const timer = setTimeout(() => setNewlyAddedId(null), 1500); // Clear after 1.5s
      return () => clearTimeout(timer);
    }
  }, [newlyAddedId]);

  const handleAddItinerary = () => {
    const lastItinerary = itineraries.length > 0 ? itineraries[itineraries.length - 1] : null;
    
    const newDayNumber = lastItinerary ? Number(lastItinerary.dayNumber) + 1 : 1;

    let newItineraryDate = "";
    if (lastItinerary && lastItinerary.itineraryDate) {
      try {
        const lastDate = new Date(lastItinerary.itineraryDate);
        lastDate.setDate(lastDate.getDate() + 1);
        newItineraryDate = lastDate.toISOString().split("T")[0];
      } catch (e) {
        // Bỏ qua nếu ngày không hợp lệ
      }
    } else if (!lastItinerary && schedule?.departureDate) {
        newItineraryDate = schedule.departureDate.split("T")[0];
    }

    const newItinerary = {
      id: Date.now(),
      dayNumber: newDayNumber,
      itineraryDate: newItineraryDate,
      title: "",
      description: "",
      startDuration: "",
      endDuration: "",
      locationName: "",
      locationLat: undefined,
      locationLng: undefined,
      tourismInfoId: null,
      tourismSearchKeyword: "",
    };
    setItineraries((prev) =>
      [...prev, newItinerary]
    );
    setNewlyAddedId(newItinerary.id);
  };

  const handleRemoveItinerary = (indexToRemove: number) => {
    setItineraries((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearItinerary = (indexToClear: number) => {
    setItineraries((prev) =>
      prev.map((itinerary, index) =>
        index === indexToClear
          ? {
              id: Date.now(),
              dayNumber: itinerary.dayNumber,
              itineraryDate: itinerary.itineraryDate,
              title: "",
              description: "",
              startDuration: "",
              endDuration: "",
              locationName: "",
              locationLat: undefined,
              locationLng: undefined,
              tourismInfoId: null,
              tourismSearchKeyword: "",
            }
          : itinerary,
      ),
    );
    success(t("tour.itineraryFormCleared"));
  };

  const addImportedItineraries = (imported: any[]) => {
    const normalized = imported.map((item, index) => ({
      id: Date.now() + index,
      dayNumber: Number(item.dayNumber),
      itineraryDate: item.itineraryDate ?? "",
      title: item.title ?? "",
      description: item.description ?? "",
      startDuration: item.startDuration?.substring(0, 5) ?? "",
      endDuration: item.endDuration?.substring(0, 5) ?? "",
      locationName: item.locationName ?? "",
      locationLat: item.locationLat ?? undefined,
      locationLng: item.locationLng ?? undefined,
      tourismInfoId: item.tourismInfoId ?? null,
      tourismSearchKeyword: item.tourismSearchKeyword ?? "",
    }));

    setItineraries((current) =>
      current.length === 1 && isBlankItinerary(current[0])
        ? normalized
        : [...current, ...normalized],
    );
  };

  const updateItinerary = useCallback((index: number, field: string, value: any) => {
    setItineraries((prev) => {
      const newItis = [...prev];
      const currentIti = newItis[index];
      const parsedValue = field === "dayNumber" ? Number(value) : value;
      const updatedIti = { ...currentIti, [field]: parsedValue };
      newItis[index] = updatedIti;

      // If the dayNumber is changed, check for an existing day and copy its date.
      if (field === "dayNumber") {
        const newDayNumber = parsedValue;
        let foundDate = "";
        
        const existingDay = newItis.find(
          (iti, i) => i !== index && Number(iti.dayNumber) === newDayNumber
        );
        
        if (existingDay && existingDay.itineraryDate) {
          foundDate = existingDay.itineraryDate;
        } else if (schedule?.tourScheduleItineraries) {
          const dbDay = schedule.tourScheduleItineraries.find((i: any) => Number(i.dayNumber) === newDayNumber);
          if (dbDay && dbDay.itineraryDate) {
            foundDate = dbDay.itineraryDate.split("T")[0];
          }
        }
        updatedIti.itineraryDate = foundDate;
      }

      // If the itineraryDate is changed, sync it across all items with the same dayNumber.
      if (field === "itineraryDate") {
        const dayToSync = updatedIti.dayNumber;
        return newItis.map(iti => 
          Number(iti.dayNumber) === Number(dayToSync) 
            ? { ...iti, itineraryDate: value } 
            : iti
        );
      }

      return newItis;
    });
  }, [schedule?.tourScheduleItineraries]);

  const patchItinerary = (index: number, patch: Record<string, any>) => {
    setItineraries((prev) => {
      const newItis = [...prev];
      newItis[index] = { ...newItis[index], ...patch };
      return newItis;
    });
  };

  const geocodeAddress = async (
    address: string,
  ): Promise<{ lat: number; lng: number; name: string } | null> => {
    if (!address.trim()) return null;

    try {
      const place = (await searchPlaces(address, 1))[0];
      if (!place) return null;

      const coordinates = getPlaceCoordinates(place);
      return {
        ...coordinates,
        name: place.name || place.formatted_address,
      };
    } catch (error) {
      console.warn(`Mapbox geocoding failed for "${address}"`, error);
      return null;
    }
  };

  const handleCloneFromTour = async () => {
    if (!tour?.tourItineraries || tour.tourItineraries.length === 0) {
      showError(t("tour.error.noItinerariesToClone"));
      return;
    }

    setIsCloning(true);
    try {
      const clonedItinerariesPromises = tour.tourItineraries.map(async (iti) => {
        let { locationLat, locationLng, locationName, startDuration, endDuration, tourismInfoId } = iti;
        
        // Lấy danh sách các ngày đã có trong form hiện tại
        const existingDaysInForm = new Set(itineraries.map(i => Number(i.dayNumber)));
        if (existingDaysInForm.has(Number(iti.dayNumber))) {
          return null; // Bỏ qua nếu ngày này đã tồn tại
        }
        
        if (locationName && (!locationLat || !locationLng)) {
          const coords = await geocodeAddress(locationName);
          if (coords) {
            locationLat = coords.lat;
            locationLng = coords.lng;
          }
        }

        let dateString = "";
        if (schedule?.departureDate) {
          // Tách lấy phần YYYY-MM-DD để tránh lỗi timezone khi parse
          const datePart = schedule.departureDate.split("T")[0];
          const [year, month, day] = datePart.split("-").map(Number);
          // Tạo date object ở múi giờ UTC để đảm bảo tính toán không bị lệch
          const depDate = new Date(Date.UTC(year, month - 1, day));
          // Thêm số ngày (an toàn trong UTC)
          depDate.setUTCDate(depDate.getUTCDate() + (iti.dayNumber - 1));
          dateString = depDate.toISOString().split("T")[0];
        }

        return {
          id: Date.now() + Math.random(), // Use random here to avoid collision with Date.now() from handleAdd
          dayNumber: iti.dayNumber,
          itineraryDate: dateString, 
          title: iti.title || "", 
          description: iti.description || "",
          startDuration: startDuration || "",
          endDuration: endDuration || "",
          locationName: locationName || "",
          locationLat, 
          locationLng,
          tourismInfoId: tourismInfoId ?? null,
          tourismSearchKeyword: "",
        };
      });

      const resolvedItineraries = (await Promise.all(clonedItinerariesPromises)).filter(Boolean);

      if (resolvedItineraries.length === 0) {
        warning(t("tour.warning.allDaysExistNoClone"));
      } else {
        setItineraries(prev => [...prev, ...resolvedItineraries]);
        success(t("tour.success.clonedMissingDays", { count: resolvedItineraries.length }));
      }
    } catch (e: any) {
      showError(e.message || t("tour.error.cloneFailed"));
    } finally {
      setIsCloning(false);
    }
  };

  const handleCloneSingleDayFromTour = async (dayToClone: number | string, itemIndex: number) => {
    const numericDayToClone = Number(dayToClone);
    const tourItineraryToClone = tour?.tourItineraries?.find(
      (iti) => Number(iti.dayNumber) === numericDayToClone,
    );

    if (!tourItineraryToClone) {
      showError(`Day ${numericDayToClone} does not exist in the original tour to be cloned.`);
      return;
    }

    setCloningDayIndex(itemIndex);
    try {
      let { locationLat, locationLng, locationName, startDuration, endDuration, tourismInfoId } = tourItineraryToClone;

      if (locationName && (!locationLat || !locationLng)) {
        const coords = await geocodeAddress(locationName);
        if (coords) {
          locationLat = coords.lat;
          locationLng = coords.lng;
        }
      }

      let dateString = "";
      if (schedule?.departureDate) {
        // Tách lấy phần YYYY-MM-DD để tránh lỗi timezone khi parse
        const datePart = schedule.departureDate.split("T")[0];
        const [year, month, day] = datePart.split("-").map(Number);
        // Tạo date object ở múi giờ UTC để đảm bảo tính toán không bị lệch
        const depDate = new Date(Date.UTC(year, month - 1, day));
        // Thêm số ngày (an toàn trong UTC)
        depDate.setUTCDate(depDate.getUTCDate() + (numericDayToClone - 1));
        dateString = depDate.toISOString().split("T")[0];
      }

      const patchData = {
        itineraryDate: dateString,
        title: tourItineraryToClone.title || "",
        description: tourItineraryToClone.description || "",
        startDuration: startDuration || "",
        endDuration: endDuration || "",
        locationName: locationName || "",
        locationLat,
        locationLng,
        tourismInfoId: tourismInfoId ?? null,
        tourismSearchKeyword: "",
      };

      patchItinerary(itemIndex, patchData);
      success(`Successfully cloned data for Day ${numericDayToClone}.`);
    } catch (e: any) {
      showError(e.message || `Failed to clone data for Day ${numericDayToClone}.`);
    } finally {
      setCloningDayIndex(null);
    }
  };

  const handleSubmitBatch = async (itineraries: any[]) => {
    if (!scheduleId) return;
    setIsSubmitting(true);
    setServerErrors({});

    try {
      const payload = {
        itineraries: itineraries.map((iti: any) => ({
          scheduleId: Number(scheduleId),
          dayNumber: Number(iti.dayNumber),
          itineraryDate: iti.itineraryDate,
          title: iti.title || null,
          description: iti.description || null,
          startDuration: iti.startDuration ? (iti.startDuration.length === 5 ? `${iti.startDuration}:00` : iti.startDuration) : null,
          endDuration: iti.endDuration ? (iti.endDuration.length === 5 ? `${iti.endDuration}:00` : iti.endDuration) : null,
          locationName: iti.locationName || null,
          locationLat: iti.locationLat === null || iti.locationLat === undefined ? null : Number(iti.locationLat),
          locationLng: iti.locationLng === null || iti.locationLng === undefined ? null : Number(iti.locationLng),
          tourismInfoId: iti.tourismInfoId === "" || iti.tourismInfoId === null || iti.tourismInfoId === undefined ? null : Number(iti.tourismInfoId),
        })),
      };

      await createScheduleItineraryBatch(payload);
      success(t("tour.success.scheduleItinerariesAdded"));
      navigate(PATH.MANAGER.SCHEDULE_DETAIL(scheduleId));
    } catch (error: any) {
      if (error.response?.status === 400 && error.response.data?.errors) {
        setServerErrors(error.response.data.errors);
        showError(t("common.error.formErrors"));
      } else {
        showError(
          error.response?.data?.message ||
            error.message ||
            t("tour.error.scheduleItinerariesCreateFailed"),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (scheduleId) {
      navigate(PATH.MANAGER.SCHEDULE_DETAIL(scheduleId));
    } else {
      navigate(-1);
    }
  };

  // Luôn hiển thị nút clone nếu tour gốc có lịch trình
  const isCloneVisible = tour?.tourItineraries && tour.tourItineraries.length > 0;

  return {
    scheduleId,
    schedule,
    isScheduleLoading,
    handleSubmitBatch,
    handleCancel,
    isSubmitting,
    serverErrors,
    itineraries,
    newlyAddedId,
    invalidItineraryIds,
    missingDayNumbers,
    cloneableDayNumbers,
    handleAddItinerary,
    handleRemoveItinerary,
    handleClearItinerary,
    addImportedItineraries,
    updateItinerary,
    patchItinerary,
    handleCloneFromTour,
    handleCloneSingleDayFromTour,
    isCloneVisible,
    isCloning,
    cloningDayIndex,
    setInvalidItineraryIds,
    setServerErrors,
    isTourLoading,
  };
};
