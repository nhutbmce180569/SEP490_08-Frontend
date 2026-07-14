import type { Tour } from "../types/tour";
import { getNumberValue } from "./tourScheduleTicket";

export interface TourPriceInfo {
  price: number | null;
  originalPrice: number | null;
}

export const getTicketEffectivePriceInfo = (ticket: any): TourPriceInfo => {
  const basePrice = getNumberValue(ticket.price);
  if (basePrice === null) return { price: null, originalPrice: null };

  const now = new Date();
  const promo = ticket.promotion;
  
  if (promo && promo.status === "Active") {
    const startDate = promo.startDate ? new Date(promo.startDate) : null;
    const endDate = promo.endDate ? new Date(promo.endDate) : null;
    const isStarted = !startDate || startDate <= now;
    const isNotEnded = !endDate || endDate >= now;

    if (isStarted && isNotEnded && promo.discountValue) {
      let discountAmount = 0;
      if (promo.discountType === "PERCENTAGE") {
        discountAmount = basePrice * (promo.discountValue / 100);
        if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
          discountAmount = promo.maxDiscountAmount;
        }
      } else {
        discountAmount = promo.discountValue;
      }
      return {
        price: Math.max(0, basePrice - discountAmount),
        originalPrice: basePrice,
      };
    }
  }

  return { price: basePrice, originalPrice: null };
};

export const getTourPriceInfo = (tour: Tour): TourPriceInfo => {
  let lowestEffectivePrice: number | null = null;
  let correspondingOriginalPrice: number | null = null;

  const schedules = tour.tourSchedules || [];
  
  for (const schedule of schedules) {
    const tickets = schedule.tourScheduleTickets || [];
    
    for (const ticket of tickets) {
      const { price: effectivePrice, originalPrice } = getTicketEffectivePriceInfo(ticket);

      if (effectivePrice !== null) {
        if (lowestEffectivePrice === null || effectivePrice < lowestEffectivePrice) {
          lowestEffectivePrice = effectivePrice;
          correspondingOriginalPrice = originalPrice;
        }
      }
    }
  }

  return {
    price: lowestEffectivePrice,
    originalPrice: correspondingOriginalPrice,
  };
};
