import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTour } from "./useTour";
import { createItineraryBatch } from "../services/itinerary.service";

export const useCreateItinerary = () => {
  // Lấy tourId từ Dynamic Route (VD: /partner/tours/123/itineraries/create)
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
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

  const [itineraries, setItineraries] = useState<any[]>([{ 
    id: Date.now(),
    dayNumber: 1,
    title: "", 
    description: "", 
    startDuration: "",
    endDuration: "",
    locationName: "", 
    locationLat: undefined, 
    locationLng: undefined 
  }] );

  const handleAddDay = () => {
    const lastDayNumber = itineraries.length > 0 ? itineraries[itineraries.length - 1].dayNumber : 1;
    setItineraries((prev) => [
      ...prev,
      { 
        id: Date.now() + Math.random(),
        dayNumber: lastDayNumber,
        title: "", 
        description: "", 
        startDuration: "",
        endDuration: "",
        locationName: "", 
        locationLat: undefined, 
        locationLng: undefined 
      }
    ]);
  };

  const handleRemoveDay = (indexToRemove: number) => {
    setItineraries((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const updateItinerary = (index: number, field: string, value: any) => {
    setItineraries((prev) => {
      const newItis = [...prev];
      newItis[index] = { ...newItis[index], [field]: value };
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
          locationLat: iti.locationLat ? Number(iti.locationLat) : null,
          locationLng: iti.locationLng ? Number(iti.locationLng) : null,
        }))
      };

      await createItineraryBatch(payload);
      success("Itineraries added successfully!");
      navigate(PATH.OPERATOR.TOUR_DETAIL(tourId));
    } catch (error: any) {
      if (error.response?.status === 400 && error.response.data?.errors) {
        setServerErrors(error.response.data.errors);
        showError("Please check again the errors in the form.");
      } else {
        showError(error.message || "Failed to create itineraries.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate(PATH.OPERATOR.TOUR_DETAIL(tourId!));

  return {
    tourId,
    tour,
    isTourLoading,
    handleSubmitBatch,
    handleCancel,
    isSubmitting,
    serverErrors,
    itineraries,
    missingDayNumbers,
    handleAddDay,
    handleRemoveDay,
    updateItinerary,
    patchItinerary,
  };
};