import type { Tour } from "../types/tour";

export const getTourDurationDays = (tour: Tour): number => {
  if (tour.tourItineraries && tour.tourItineraries.length > 0) {
    return tour.tourItineraries.length;
  }
  
  if (tour.tourSchedules && tour.tourSchedules.length > 0) {
    let maxDays = 0;
    for (const schedule of tour.tourSchedules) {
      if (schedule.departureDate && schedule.returnDate) {
        const start = new Date(schedule.departureDate);
        const end = new Date(schedule.returnDate);
        
        // Remove time portion for accurate day calculation
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        if (diffDays > maxDays) {
          maxDays = diffDays;
        }
      }
    }
    return maxDays > 0 ? maxDays : 0;
  }
  
  return 0;
};
