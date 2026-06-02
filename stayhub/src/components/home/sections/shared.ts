export const HOME_CONTAINER =
  "mx-auto w-full max-w-[1320px] px-4 sm:px-5 lg:px-6";

export const getFreeApiImage = (seed: string, width: number, height: number) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;

/** Shared glass surface classes for home cards */
export const HOME_GLASS = "home-glass";
export const HOME_GLASS_MEDIA = "home-glass-media";
