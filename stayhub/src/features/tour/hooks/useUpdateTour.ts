import { useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateTour } from "../services/tour.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTour } from "./useTour";
import { AuthContext } from "../../../contexts/AuthContext";
// import { categoryService } from "../../content/services/category.service";

const buildUpdateTourFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();

  formData.append("name", data.name);
  formData.append("operatorId", String(data.operatorId));
  formData.append("categoryId", String(data.categoryId));
  if (data.description) {
    formData.append("description", data.description);
  }
  if (data.status) {
    formData.append("status", data.status);
  }
  if (data.image instanceof File) {
    formData.append("image", data.image);
  } else if (data.image === null) {
    // Nếu image là null (do người dùng bấm Remove), báo cho Backend xóa ảnh cũ
    formData.append("RemoveImage", "true");
  }
  if (data.country) formData.append("country", data.country);
  if (data.city) formData.append("city", data.city);
  if (data.address) formData.append("address", data.address);
  return formData;
};

export const useUpdateTour = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { user } = useContext(AuthContext);

  const { tour, isLoading: isFetching, error: fetchError } = useTour(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, any>>({});
  const [categoryOptions, setCategoryOptions] = useState<{ label: string, value: number }[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);
  const loadCategories = async () => {
    try {
      // const res = await categoryService.getActive(1, 9999);
      // const opts = (res.data || []).map((c: any) => ({
      //   label: c.name,
      //   value: c.id
      // }));
      // setCategoryOptions(opts);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };
  const handleSubmit = async (data: Record<string, any>) => {
    if (!id) return;
    setServerErrors({});
    try {
      setIsSubmitting(true);

      const payload = buildUpdateTourFormData({
        ...data,
        operatorId: Number(user?.id) // Tự động chèn ID người dùng hiện tại
      });
      await updateTour(id, payload);
      success("Tour updated successfully!");
      navigate(PATH.MANAGER.MY_TOURS);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        setServerErrors(err.response.data.errors);
        showError("Please check again the errors in the form.");
      } else {
        showError(err.response?.data?.message || err.message || "Failed to update tour.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate(PATH.MANAGER.MY_TOURS);

  return { id, tour, isFetching, fetchError, isSubmitting, serverErrors, handleSubmit, handleCancel, categoryOptions };
};