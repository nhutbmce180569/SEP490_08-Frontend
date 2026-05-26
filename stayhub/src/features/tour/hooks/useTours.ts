import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getTours} from "../services/tour.service";
import { type Tour } from "../types/tour";
import { PATH } from "../../../config/routes/route";
import type { PaginatedResponse } from "../types/paginatedReponse";
import { AuthContext } from "../../../contexts/AuthContext";

export const useTours = (initialPageSize: number = 5) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<PaginatedResponse<Tour> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTours();
    // Thêm user.id vào dependency array để hook chạy lại khi user thay đổi
  }, [page, initialPageSize, search]);

  // Tách luôn logic điều hướng ra khỏi component
  const handleCreate = () => navigate(PATH.MANAGER.CREATE_TOUR);
  const handleEdit = (id: number) => navigate(PATH.MANAGER.EDIT_TOUR(id));
  const handleDelete = (id: number) => navigate(PATH.MANAGER.DELETE_TOUR(id));
  const handleView = (id: number) => navigate(PATH.MANAGER.TOUR_DETAIL(id));
  const fetchTours = async () => {
    setIsLoading(true);
    try {
      // Truyền operatorId (user.id) vào service
      const res = await getTours(page, initialPageSize);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load tours");
    } finally {
      setIsLoading(false);
    }
  };
  return {
    data, isLoading, error, page, setPage, search, setSearch, pageSize: initialPageSize,
    handleCreate, handleEdit, handleDelete, handleView
  };
};
