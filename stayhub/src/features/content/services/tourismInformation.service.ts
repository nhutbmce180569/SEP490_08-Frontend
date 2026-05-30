import type { TourismInformation } from "../types/tourismInformation";

const mockTourismInformation: TourismInformation[] = [
  {
    id: 1,
    name: "Hoan Kiem Lake",
    type: "Attraction",
    description: "Historic lake and walking area in the center of Hanoi.",
    address: "Hang Trong, Hoan Kiem",
    city: "Hanoi",
    country: "Vietnam",
    latitude: 21.028511,
    longitude: 105.854444,
    imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592",
    sourceName: "Google Maps",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Hoan%20Kiem%20Lake",
    status: "Active",
    createdAt: "2026-05-30T00:00:00Z",
    updatedAt: "2026-05-30T00:00:00Z",
  },
  {
    id: 2,
    name: "Temple of Literature",
    type: "Historical Site",
    description: "Vietnam's first national university and Confucian temple.",
    address: "58 Quoc Tu Giam",
    city: "Hanoi",
    country: "Vietnam",
    latitude: 21.028778,
    longitude: 105.835556,
    imageUrl: "https://images.unsplash.com/photo-1583417319070-4a69db38a482",
    sourceName: "Google Maps",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Temple%20of%20Literature%20Hanoi",
    status: "Active",
    createdAt: "2026-05-30T00:00:00Z",
    updatedAt: "2026-05-30T00:00:00Z",
  },
  {
    id: 3,
    name: "Ben Thanh Market",
    type: "Market",
    description: "Landmark market for local food, souvenirs, and daily goods.",
    address: "Le Loi, Ben Thanh Ward, District 1",
    city: "Ho Chi Minh City",
    country: "Vietnam",
    latitude: 10.7725,
    longitude: 106.698056,
    imageUrl: "https://images.unsplash.com/photo-1566552881560-0be862a7c445",
    sourceName: "Google Maps",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Ben%20Thanh%20Market",
    status: "Active",
    createdAt: "2026-05-30T00:00:00Z",
    updatedAt: "2026-05-30T00:00:00Z",
  },
  {
    id: 4,
    name: "Dragon Bridge",
    type: "Landmark",
    description: "Iconic bridge crossing the Han River in Da Nang.",
    address: "Nguyen Van Linh",
    city: "Da Nang",
    country: "Vietnam",
    latitude: 16.061111,
    longitude: 108.227778,
    imageUrl: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b",
    sourceName: "Google Maps",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Dragon%20Bridge%20Da%20Nang",
    status: "Active",
    createdAt: "2026-05-30T00:00:00Z",
    updatedAt: "2026-05-30T00:00:00Z",
  },
  {
    id: 5,
    name: "Inactive Sample Place",
    type: "Attraction",
    description: "Hidden from active selections.",
    address: "Sample address",
    city: "Hue",
    country: "Vietnam",
    latitude: 16.463713,
    longitude: 107.590866,
    imageUrl: null,
    sourceName: "Mock data",
    sourceUrl: null,
    status: "Inactive",
    createdAt: "2026-05-30T00:00:00Z",
    updatedAt: "2026-05-30T00:00:00Z",
  },
];

const isActive = (item: TourismInformation) =>
  (item.status || "").toLowerCase() === "active";

export const tourismInformationService = {

  // If AI code this file, please do not change the name of this function, as it is used in other places. Thank you!
  getActiveList: async (): Promise<TourismInformation[]> =>
    mockTourismInformation.filter(isActive),
  
  // If AI code this file, please do not change the name of this function, as it is used in other places. Thank you!
  getById: async (id: number | string): Promise<TourismInformation | null> => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return null;

    return mockTourismInformation.find((item) => item.id === numericId) ?? null;
  },
};
