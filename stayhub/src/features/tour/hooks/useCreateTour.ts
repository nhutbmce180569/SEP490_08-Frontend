import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createTour } from "../services/tour.service";
import { type CreateTourRequest } from "../types/tour";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { AuthContext } from "../../../contexts/AuthContext";
// import { categoryService } from "../../content/services/category.service";

const buildCreateTourFormData = (data: CreateTourRequest): FormData => {
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
  }
  if (data.country) formData.append("country", data.country);
  if (data.city) formData.append("city", data.city);
  if (data.address) formData.append("address", data.address);
  return formData;
};

export const useCreateTour = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, any>>({});
  const [categoryOptions, setCategoryOptions] = useState<{ label: string, value: number }[]>([]);

  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { user } = useContext(AuthContext);

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
      // // opts.push({ label: "Not valid for test", value: 10 });
      // setCategoryOptions(opts);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    setServerErrors({});
    try {
      setIsSubmitting(true);

      const requestData: CreateTourRequest = {
        name: data.name,
        operatorId: Number(user?.id),
        categoryId: Number(data.categoryId),
        status: data.status || "Draft",
        description: data.description,
        image: data.image,
        country: data.country,
        city: data.city,
        address: data.address,
      };

      const payload = buildCreateTourFormData(requestData);
      await createTour(payload);

      success("Tour created successfully!");
      navigate(PATH.MANAGER.MY_TOURS);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        setServerErrors(err.response.data.errors);
        showError("Please check again the errors in the form.");
      } else {
        showError(err.response?.data?.message || err.message || "Failed to create tour.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(PATH.MANAGER.MY_TOURS);
  };

  return { handleSubmit, handleCancel, isSubmitting, serverErrors, categoryOptions };
};