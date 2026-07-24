export interface SystemSettingDTO {
  settingKey: string;
  settingValue: string;
  description?: string;
}

export interface SystemSettingUpdateItem {
  settingKey: string;
  settingValue: string;
}

export interface UpdateSystemSettingsDTO {
  settings: SystemSettingUpdateItem[];
  webLogoFile?: File;
  appLogoFile?: File;
}
