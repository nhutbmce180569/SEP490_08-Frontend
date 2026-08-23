import type { Tour } from "../types/tour";
import { getNumberValue } from "./tourScheduleTicket";

export interface TourPriceInfo {
  price: number | null;
  originalPrice: number | null;
  discountType?: "PERCENTAGE" | "FIXED" | string;
  discountValue?: number;
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
      if (promo.discountType?.toLowerCase() === "percentage") {
        discountAmount = Math.round(basePrice * (promo.discountValue / 100));
        if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
          discountAmount = promo.maxDiscountAmount;
        }
      } else {
        discountAmount = promo.discountValue;
      }
      return {
        price: Math.max(0, basePrice - discountAmount),
        originalPrice: basePrice,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
      };
    }
  }

  return { price: basePrice, originalPrice: null };
};

export const getTourPriceInfo = (tour: Tour): TourPriceInfo => {
  let lowestEffectivePrice: number | null = null;
  let correspondingOriginalPrice: number | null = null;
  let correspondingDiscountType: string | undefined = undefined;
  let correspondingDiscountValue: number | undefined = undefined;

  const schedules = tour.tourSchedules || [];
  const now = new Date();
  
  for (const schedule of schedules) {
    if (schedule.departureDate && new Date(schedule.departureDate) <= now) {
      continue;
    }
    
    const tickets = schedule.tourScheduleTickets || [];
    
    for (const ticket of tickets) {
      const { price: effectivePrice, originalPrice, discountType, discountValue } = getTicketEffectivePriceInfo(ticket);

      if (effectivePrice !== null) {
        if (
          lowestEffectivePrice === null || 
          effectivePrice < lowestEffectivePrice ||
          (effectivePrice === lowestEffectivePrice && originalPrice !== null && correspondingOriginalPrice === null)
        ) {
          lowestEffectivePrice = effectivePrice;
          correspondingOriginalPrice = originalPrice;
          correspondingDiscountType = discountType;
          correspondingDiscountValue = discountValue;
        }
      }
    }
  }

  // Fallback: If no future schedules found, try to get price from past schedules (just for display)
  if (lowestEffectivePrice === null) {
    for (const schedule of schedules) {
      const tickets = schedule.tourScheduleTickets || [];
      for (const ticket of tickets) {
        const { price: effectivePrice, originalPrice, discountType, discountValue } = getTicketEffectivePriceInfo(ticket);
        if (effectivePrice !== null) {
          if (
            lowestEffectivePrice === null || 
            effectivePrice < lowestEffectivePrice ||
            (effectivePrice === lowestEffectivePrice && originalPrice !== null && correspondingOriginalPrice === null)
          ) {
            lowestEffectivePrice = effectivePrice;
            correspondingOriginalPrice = originalPrice;
            correspondingDiscountType = discountType;
            correspondingDiscountValue = discountValue;
          }
        }
      }
    }
  }

  return {
    price: lowestEffectivePrice,
    originalPrice: correspondingOriginalPrice,
    discountType: correspondingDiscountType,
    discountValue: correspondingDiscountValue,
  };
};
