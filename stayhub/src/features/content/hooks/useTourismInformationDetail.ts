import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PATH } from "../../../config/routes/route";
import { tourismInformationService } from "../services/tourismInformation.service";

export const useTourismInformationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["tourism-information", id],
    queryFn: () => tourismInformationService.getAdminById(id!),
    enabled: !!id,
  });

  const handleEdit = () => navigate(PATH.ADMIN.EDIT_TOURISM_INFORMATION(id!));

  const handleBack = () => navigate(PATH.ADMIN.TOURISM_INFORMATION_MANAGEMENT);

  return {
    id,
    tourismInfo: query.data,
    isLoading: query.isLoading,
    error: query.isError ? "Failed to fetch tourism information details." : null,
    handleEdit,
    handleBack,
    refetch: query.refetch,
  };
};
