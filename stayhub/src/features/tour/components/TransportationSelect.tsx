import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../../contexts/LocaleContext';

interface TransportationSelectProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export const TransportationSelect: React.FC<TransportationSelectProps> = ({ value, onChange, error }) => {
  const { t } = useTranslation();
  const presets = ["Coach", "Flight", "Train", "Boat"];
  const isPreset = !value || presets.includes(value);
  const [isCustom, setIsCustom] = useState(!isPreset && value !== "");

  if (isCustom) {
    return (
      <div className="flex gap-2">
        <input 
           type="text" 
           value={value} 
           onChange={e => onChange(e.target.value)} 
           className={`flex-1 rounded-xl border text-sm px-4 py-2.5 outline-none transition-colors focus:border-brand ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-white"}`} 
           placeholder={t("tour.enterCustomTransportation") || "Enter custom transportation"}
           autoFocus
        />
        <button 
           type="button" 
           onClick={() => { setIsCustom(false); onChange(""); }}
           className="flex shrink-0 items-center justify-center w-11 h-[46px] rounded-xl border border-slate-200 bg-slate-50 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-700"
           title={t("common.cancel") || "Cancel"}
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <select 
       value={value || ""}
       onChange={e => {
         if (e.target.value === "custom") {
           setIsCustom(true);
           onChange("");
         } else {
           onChange(e.target.value);
         }
       }}
       className={`w-full rounded-xl border text-sm px-4 py-2.5 outline-none transition-colors focus:border-brand text-slate-700 ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-white"}`}
    >
      <option value="" disabled>{t("tour.selectTransportation")}</option>
      <option value="Coach">{t("tour.transportation_coach") || "Coach"}</option>
      <option value="Flight">{t("tour.transportation_flight") || "Flight"}</option>
      <option value="Train">{t("tour.transportation_train") || "Train"}</option>
      <option value="Boat">{t("tour.transportation_boat") || "Boat"}</option>
      <option value="custom">{t("common.other") || "Other..."}</option>
    </select>
  );
};
