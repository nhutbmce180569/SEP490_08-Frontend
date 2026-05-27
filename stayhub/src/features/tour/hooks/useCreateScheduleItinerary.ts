import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createScheduleItineraryBatch } from "../services/tourScheduleItinerary.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTourSchedule } from "./useTourSchedule";
import { useTour } from "./useTour";

export const useCreateScheduleItinerary = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

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
  const [itineraries, setItineraries] = useState<any[]>([
    {
      id: Date.now(),
      dayNumber: 1,
      itineraryDate: "",
      title: "",
      description: "",
      startDuration: "",
      endDuration: "",
      locationName: "",
      locationLat: undefined,
      locationLng: undefined,
    },
  ]);

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

  const handleAddItinerary = () => {
    const lastItinerary = itineraries.length > 0 ? itineraries[itineraries.length - 1] : null;
    const lastDayNumber = lastItinerary ? lastItinerary.dayNumber : 1;
    const lastItineraryDate = lastItinerary ? lastItinerary.itineraryDate : "";
    setItineraries((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        dayNumber: Number(lastDayNumber),
        itineraryDate: lastItineraryDate,
        title: "",
        description: "",
        startDuration: "",
        endDuration: "",
        locationName: "",
        locationLat: undefined,
        locationLng: undefined,
      },
    ]);
  };

  const handleRemoveItinerary = (indexToRemove: number) => {
    setItineraries((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const updateItinerary = (index: number, field: string, value: any) => {
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
  };

  const patchItinerary = (index: number, patch: Record<string, any>) => {
    setItineraries((prev) => {
      const newItis = [...prev];
      newItis[index] = { ...newItis[index], ...patch };
      return newItis;
    });
  };

  const geocodeAddress = (address: string): Promise<{ lat: number; lng: number; name: string } | null> => {
    return new Promise((resolve) => {
      if (!address || !(window as any).google?.maps?.places) {
        return resolve(null);
      }

      const dummyDiv = document.createElement("div");
      const service = new (window as any).google.maps.places.PlacesService(dummyDiv);

      service.findPlaceFromQuery(
        {
          query: address,
          fields: ["name", "geometry", "formatted_address"],
        },
        (results: any, status: any) => {
          if (status === "OK" && results?.[0]?.geometry?.location) {
            const place = results[0];
            resolve({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              name: place.name || place.formatted_address,
            });
          } else {
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ address, componentRestrictions: { country: "vn" } }, (geoResults: any, geoStatus: any) => {
              if (geoStatus === "OK" && geoResults?.[0]?.geometry?.location) {
                const place = geoResults[0];
                resolve({
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                  name: place.formatted_address,
                });
              } else {
                console.warn(`Geocoding failed for "${address}": ${geoStatus}`);
                resolve(null);
              }
            });
          }
        },
      );
    });
  };

  const handleCloneFromTour = async () => {
    if (!tour?.tourItineraries || tour.tourItineraries.length === 0) {
      showError("This tour does not have any itineraries to clone.");
      return;
    }

    setIsCloning(true);
    try {
      const clonedItinerariesPromises = tour.tourItineraries.map(async (iti) => {
        let { locationLat, locationLng, locationName, startDuration, endDuration } = iti;

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
          id: Date.now() + Math.random(), 
          dayNumber: iti.dayNumber,
          itineraryDate: dateString, 
          title: iti.title || "", 
          description: iti.description || "",
          startDuration: startDuration || "",
          endDuration: endDuration || "",
          locationName: locationName || "",
          locationLat, 
          locationLng,
        };
      });

      const resolvedItineraries = await Promise.all(clonedItinerariesPromises);
      setItineraries(resolvedItineraries);
      success("Cloned from tour! Coordinates were auto-filled if missing.");
    } catch (e: any) {
      showError(e.message || "An error occurred while cloning itineraries.");
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
      let { locationLat, locationLng, locationName, startDuration, endDuration } = tourItineraryToClone;

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
          locationLat: iti.locationLat ? Number(iti.locationLat) : null,
          locationLng: iti.locationLng ? Number(iti.locationLng) : null,
        })),
      };

      await createScheduleItineraryBatch(payload);
      success("Schedule itineraries created successfully!");
      navigate(PATH.MANAGER.SCHEDULE_DETAIL(scheduleId));
    } catch (error: any) {
      if (error.response?.status === 400 && error.response.data?.errors) {
        setServerErrors(error.response.data.errors);
        showError("Please check the form for errors.");
      } else {
        showError(
          error.response?.data?.message ||
            error.message ||
            "Failed to create schedule itineraries.",
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

  const isCloneVisible = !schedule?.tourScheduleItineraries || schedule.tourScheduleItineraries.length === 0;

  return {
    scheduleId,
    schedule,
    isScheduleLoading,
    handleSubmitBatch,
    handleCancel,
    isSubmitting,
    serverErrors,
    itineraries,
    missingDayNumbers,
    handleAddItinerary,
    handleRemoveItinerary,
    updateItinerary,
    patchItinerary,
    handleCloneFromTour,
    handleCloneSingleDayFromTour,
    isCloneVisible,
    isCloning,
    cloningDayIndex,
    isTourLoading,
  };
};
