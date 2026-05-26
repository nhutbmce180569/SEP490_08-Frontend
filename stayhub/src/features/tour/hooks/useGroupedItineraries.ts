import { useState, useMemo } from "react";

export const useGroupedItineraries = (tourItineraries: any[] | undefined) => {
  const [expandedItiIds, setExpandedItiIds] = useState<number[]>([]);

  const toggleIti = (id: number) => {
    setExpandedItiIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const groupedItineraries = useMemo(() => {
    if (!tourItineraries) return {};
    const groups: Record<number, any[]> = {};
    
    tourItineraries.forEach((iti) => {
      const day = Number(iti.dayNumber);
      if (!groups[day]) groups[day] = [];
      groups[day].push(iti);
    });
    
    Object.keys(groups).forEach((day) => {
      groups[Number(day)].sort((a, b) => {
        const timeA = a.startDuration || "24:00";
        const timeB = b.startDuration || "24:00";
        return timeA.localeCompare(timeB);
      });
    });
    
    return groups;
  }, [tourItineraries]);

  return { expandedItiIds, toggleIti, groupedItineraries };
};