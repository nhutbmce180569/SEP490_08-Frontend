import React from "react";
import { useTranslation } from "../../contexts/LocaleContext";
import { useCurrency } from "./CurrencyContext";

type MoneyDisplayProps = {
  amountVnd: number;
  className?: string;
  subTextClassName?: string;
  showVndBacking?: boolean;
  forceVnd?: boolean;
  compact?: boolean;
};

const vndFormatter = new Intl.NumberFormat("vi-VN");
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const FALLBACK_USD_TO_VND_RATE = 26000;

export const formatVndAmount = (amount: number) =>
  `${vndFormatter.format(Math.round(Math.max(0, amount)))} đ`;

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  amountVnd,
  className,
  subTextClassName,
  showVndBacking = false,
  forceVnd = false,
  compact = false,
}) => {
  const { locale } = useTranslation();
  const { mode, usdToVndRate } = useCurrency();
  const validAmount = Number.isFinite(amountVnd) ? amountVnd : 0;

  if (mode !== "USD" || forceVnd) {
    return <span className={className}>{formatVndAmount(validAmount)}</span>;
  }

  const rate = usdToVndRate && usdToVndRate > 0 ? usdToVndRate : FALLBACK_USD_TO_VND_RATE;
  const usdAmount = validAmount / rate;
  const backingText =
    locale === "vi"
      ? `Thanh toán bằng ${formatVndAmount(validAmount)}`
      : `Paid in ${formatVndAmount(validAmount)}`;

  return (
    <span className={compact ? "inline-flex items-baseline gap-1" : "inline-flex flex-col"}>
      <span className={className}>
        {usdFormatter.format(usdAmount)}
      </span>
      {showVndBacking && (
        <span className={subTextClassName ?? "text-[11px] font-semibold text-slate-400"}>
          {backingText}
        </span>
      )}
    </span>
  );
};
