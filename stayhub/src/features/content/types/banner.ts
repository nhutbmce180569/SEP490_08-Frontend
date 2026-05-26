export interface ReadBannerDTO {
  id: number;
  title: string;
  imageUrl: string;
  targetUrl?: string;
  priority?: number;
  isActive?: boolean;
}

export interface CreateBannerDTO {
  title: string;
  imageFile: File;
  targetUrl?: string;
  priority?: number;
  isActive?: boolean;
}

export interface UpdateBannerDTO {
  title: string;
  imageFile?: File;
  targetUrl?: string;
  priority?: number;
  isActive?: boolean;
}