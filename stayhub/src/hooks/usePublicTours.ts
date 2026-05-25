import type { Tour } from "../features/tour/types/tour";

const mockTours: Tour[] = [
  {
    id: 1,
    name: "Da Nang Coastal Discovery",
    city: "Da Nang",
    country: "Vietnam",
    imageUrl: "https://picsum.photos/seed/stayhub-da-nang/900/700",
    averageStar: 4.8,
    reviews: [{ id: 1, rating: 5 }, { id: 2, rating: 4 }],
    tourSchedules: [{ id: 1, price: 1290000 }],
    tourItineraries: [{ id: 1, title: "Beach" }, { id: 2, title: "Old town" }],
  },
  {
    id: 2,
    name: "Ha Long Bay Cruise Escape",
    city: "Quang Ninh",
    country: "Vietnam",
    imageUrl: "https://picsum.photos/seed/stayhub-ha-long/900/700",
    averageStar: 4.9,
    reviews: [{ id: 3, rating: 5 }, { id: 4, rating: 5 }, { id: 5, rating: 5 }],
    tourSchedules: [{ id: 2, price: 2490000 }],
    tourItineraries: [{ id: 3, title: "Cruise" }, { id: 4, title: "Cave" }],
  },
  {
    id: 3,
    name: "Saigon Street Food Night",
    city: "Ho Chi Minh City",
    country: "Vietnam",
    imageUrl: "https://picsum.photos/seed/stayhub-saigon-food/900/700",
    averageStar: 4.7,
    reviews: [{ id: 6, rating: 5 }],
    tourSchedules: [{ id: 3, price: 690000 }],
    tourItineraries: [{ id: 5, title: "Food walk" }],
  },
  {
    id: 4,
    name: "Sapa Mountain Trek",
    city: "Lao Cai",
    country: "Vietnam",
    imageUrl: "https://picsum.photos/seed/stayhub-sapa/900/700",
    averageStar: 4.8,
    reviews: [{ id: 7, rating: 5 }, { id: 8, rating: 4 }],
    tourSchedules: [{ id: 4, price: 1890000 }],
    tourItineraries: [{ id: 6, title: "Village" }, { id: 7, title: "Trek" }],
  },
  {
    id: 5,
    name: "Hoi An Lantern Evening",
    city: "Hoi An",
    country: "Vietnam",
    imageUrl: "https://picsum.photos/seed/stayhub-hoi-an/900/700",
    averageStar: 4.6,
    reviews: [{ id: 9, rating: 5 }],
    tourSchedules: [{ id: 5, price: 790000 }],
    tourItineraries: [{ id: 8, title: "Ancient town" }],
  },
  {
    id: 6,
    name: "Mekong Delta Day Trip",
    city: "Can Tho",
    country: "Vietnam",
    imageUrl: "https://picsum.photos/seed/stayhub-mekong/900/700",
    averageStar: 4.5,
    reviews: [{ id: 10, rating: 4 }, { id: 11, rating: 5 }],
    tourSchedules: [{ id: 6, price: 990000 }],
    tourItineraries: [{ id: 9, title: "Boat" }, { id: 10, title: "Market" }],
  },
];

export const usePublicTours = (page = 1, pageSize = 6) => {
  const start = (page - 1) * pageSize;
  const tours = mockTours.slice(start, start + pageSize);

  return {
    tours,
    isLoading: false,
    error: null as string | null,
  };
};
