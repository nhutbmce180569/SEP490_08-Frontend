import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useTour } from "./useTour";
import { createItineraryBatch } from "../services/itinerary.service";

export const useCreateItinerary = () => {
  // Lấy tourId từ Dynamic Route (VD: /partner/tours/123/itineraries/create)
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { success, warning, error: showError } = useToast();
  
  const { tour, isLoading: isTourLoading } = useTour(tourId);

  // Tính toán lại các ngày bị thiếu trong lịch trình hiện tại của Tour
  const existingDayNumbers = useMemo(() => {
    return tour?.tourItineraries?.map((i: any) => Number(i.dayNumber)).sort((a: number, b: number) => a - b) ?? [];
  }, [tour?.tourItineraries]);

  const maxDay = existingDayNumbers.length ? Math.max(...existingDayNumbers) : 0;

  const missingDayNumbers = useMemo(() => {
    const missing: number[] = [];
    const used = new Set(existingDayNumbers);
    for (let i = 1; i <= maxDay; i += 1) {
      if (!used.has(i)) missing.push(i);
    }
    return missing;
  }, [existingDayNumbers, maxDay]);

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

  useEffect(() => {
    if (newlyAddedId) {
      const timer = setTimeout(() => setNewlyAddedId(null), 1500); // Clear after 1.5s
      return () => clearTimeout(timer);
    }
  }, [newlyAddedId]);

  const handleAddDay = () => {
    const lastDayNumber = itineraries.length > 0 ? itineraries[itineraries.length - 1].dayNumber : 0;
    const newItinerary = {
      id: Date.now(),
      dayNumber: Number(lastDayNumber) + 1,
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

  const handleRemoveDay = (indexToRemove: number) => {
    setItineraries((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearDay = (indexToClear: number) => {
    setItineraries((prev) =>
      prev.map((itinerary, index) =>
        index === indexToClear
          ? {
              id: Date.now() + Math.random(),
              dayNumber: itinerary.dayNumber,
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

  const updateItinerary = (index: number, field: string, value: any) => {
    setItineraries((prev) => {
      const newItis = [...prev];
      const parsedValue =
        field === "dayNumber"
          ? Number(value)
          : field === "tourismInfoId"
            ? value === "" || value === null || value === undefined
              ? null
              : Number(value)
            : value;
      newItis[index] = { ...newItis[index], [field]: parsedValue };
      return newItis;
    });
  };

  const patchItinerary = (index: number, patch: Record<string, any>) => {
    setItineraries((prev) => {
      const newItis = [...prev];
      newItis[index] = { ...newItis[index], ...patch };
      return newItis;
    });
  };

  const addImportedItineraries = (imported: any[]) => {
    const normalized = imported.map((item, index) => ({
      id: Date.now() + index + Math.random(),
      dayNumber: Number(item.dayNumber),
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

    setItineraries((current) => {
      const hasOnlyBlankDefault =
        current.length === 1 &&
        !current[0].title &&
        !current[0].description &&
        !current[0].startDuration &&
        !current[0].endDuration &&
        !current[0].locationName;

      return hasOnlyBlankDefault ? normalized : [...current, ...normalized];
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, any>>({});

  const handleSubmitBatch = async (itineraries: any[]) => {
    if (!tourId) return;
    setIsSubmitting(true);
    setServerErrors({});

    try {
      const payload = {
        itineraries: itineraries.map((iti: any) => ({
          tourId: Number(tourId),
          dayNumber: Number(iti.dayNumber),
          title: iti.title || null,
          description: iti.description || null,
          startDuration: iti.startDuration ? (iti.startDuration.length === 5 ? `${iti.startDuration}:00` : iti.startDuration) : null,
          endDuration: iti.endDuration ? (iti.endDuration.length === 5 ? `${iti.endDuration}:00` : iti.endDuration) : null,
          locationName: iti.locationName || null,
          locationLat: iti.locationLat === null || iti.locationLat === undefined ? null : Number(iti.locationLat),
          locationLng: iti.locationLng === null || iti.locationLng === undefined ? null : Number(iti.locationLng),
          tourismInfoId: iti.tourismInfoId === "" || iti.tourismInfoId === null || iti.tourismInfoId === undefined ? null : Number(iti.tourismInfoId),
        }))
      };

      await createItineraryBatch(payload);
      success(t("tour.success.itinerariesAdded"));
      navigate(PATH.MANAGER.TOUR_DETAIL(tourId));
    } catch (error: any) {
      if (error.response?.status === 400 && error.response.data?.errors) {
        setServerErrors(error.response.data.errors);
        showError(t("common.error.formErrors"));
      } else {
        showError(error.message || "Failed to create itineraries.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate(PATH.MANAGER.TOUR_DETAIL(tourId!));

  return {
    tourId,
    tour,
    isTourLoading,
    handleSubmitBatch,
    handleCancel,
    isSubmitting,
    serverErrors,
    itineraries,
    newlyAddedId,
    invalidItineraryIds,
    missingDayNumbers,
    handleAddDay,
    handleRemoveDay,
    handleClearDay,
    updateItinerary,
    patchItinerary,
    addImportedItineraries,
    setInvalidItineraryIds,
  };
};
