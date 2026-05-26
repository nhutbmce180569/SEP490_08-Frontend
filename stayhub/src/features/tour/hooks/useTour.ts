import { useState, useEffect, useCallback } from "react";
import { type Tour } from "../types/tour";
import { getTourById, activeTour } from "../services/tour.service";
import { useToast } from "../../../contexts/ToastContext";
//import { categoryService } from "../../content/services/category.service";

export const useTour = (id: string | number | undefined) => {
  const [tour, setTour] = useState<Tour | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isToggling, setIsToggling] = useState(false);
  const { success, error: showError } = useToast();

  const fetchTour = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const data = await getTourById(id);
      setTour(data);

      if (data.categoryId) {
        try {
          // const categoryData = await categoryService.getCategoryById(data.categoryId);
          //setCategoryName(categoryData.name);
        } catch (catErr) {
          console.error("Failed to fetch category details", catErr);
        }
      }
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to fetch tour details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTour();
  }, [fetchTour]);

  const toggleTourStatus = async () => {
    if (!tour) return;
    const newStatusFlag = tour.status !== "Active"; // If current is not 'Active', new status will be 'Active' (isActive=true)
    
    try {
      setIsToggling(true);
      await activeTour(tour.id, newStatusFlag);
      success(`Tour successfully ${newStatusFlag ? 'activated' : 'deactivated'}!`);
      // Refetch data to update UI without reloading page
      await fetchTour();
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || "Failed to update tour status.");
      // Re-throw or handle as needed, for now just show error
    } finally {
      setIsToggling(false);
    }
  };

  return { tour, categoryName, isLoading, error, refetch: fetchTour, isToggling, toggleTourStatus };
};