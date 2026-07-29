import { apiClient } from "../../../utils/axiosClient";
import type { SystemSettingDTO, UpdateSystemSettingsDTO } from "../types/system";

export const systemService = {
  getAllSettings: async (): Promise<SystemSettingDTO[]> => {
    return apiClient.get<SystemSettingDTO[]>("/system-settings");
  },

  getSettingByKey: async (key: string): Promise<SystemSettingDTO> => {
    return apiClient.get<SystemSettingDTO>(`/system-settings/${key}`);
  },

  updateSettings: async (dto: UpdateSystemSettingsDTO): Promise<{ message: string }> => {
    const formData = new FormData();

    dto.settings.forEach((setting, index) => {
      formData.append(`Settings[${index}].SettingKey`, setting.settingKey);
      formData.append(`Settings[${index}].SettingValue`, setting.settingValue === "" ? " " : setting.settingValue);
    });

    if (dto.webLogoFile) {
      formData.append("WebLogoFile", dto.webLogoFile);
    }
    if (dto.webVideoLogoFile) {
      formData.append("WebVideoLogoFile", dto.webVideoLogoFile);
    }

    return apiClient.put<{ message: string }>("/system-settings", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
