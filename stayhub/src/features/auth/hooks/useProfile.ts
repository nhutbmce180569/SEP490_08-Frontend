import { useState, useContext } from "react";
import { updateProfile } from "../services/auth.service";
import type { UpdateProfileDTO } from "../types/auth";
import { AuthContext } from "../../../contexts/AuthContext";

export const useProfile = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { user, login } = useContext(AuthContext);

  const handleUpdateProfile = async (data: UpdateProfileDTO) => {
    setIsUpdating(true);
    try {
      const res = await updateProfile(data);
      // Vì BE trả về Token mới chứa Claims cập nhật, ta cần overwrite lại session.
      if (res.data && res.data.token && res.data.user) {
        
        // Giữ lại roles từ user cũ do C# UserResponseDTO không trả về trường roles
        const updatedUser = {
          ...res.data.user,
          roles: user?.roles || []
        };

        // Gọi hàm login từ AuthContext để lưu đè User + Token mới vào hệ thống
        login(res.data.token, res.data.refreshToken, updatedUser);
      }
      return res;
    } catch (err) {
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return { handleUpdateProfile, isUpdating };
};