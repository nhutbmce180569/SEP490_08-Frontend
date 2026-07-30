import { useState, useEffect } from "react";
import { useTranslation } from "../../../contexts/LocaleContext";

export const useProvinces = () => {
  const { t } = useTranslation();
  const [provinces, setProvinces] = useState<{ label: string; value: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    try {
      const options = [
        { value: "Ha Noi", labelKey: "tour.province_1" },
        { value: "Cao Bang", labelKey: "tour.province_4" },
        { value: "Tuyen Quang", labelKey: "tour.province_8" },
        { value: "Dien Bien", labelKey: "tour.province_11" },
        { value: "Lai Chau", labelKey: "tour.province_12" },
        { value: "Son La", labelKey: "tour.province_14" },
        { value: "Lao Cai", labelKey: "tour.province_15" },
        { value: "Thai Nguyen", labelKey: "tour.province_19" },
        { value: "Lang Son", labelKey: "tour.province_20" },
        { value: "Quang Ninh", labelKey: "tour.province_22" },
        { value: "Bac Ninh", labelKey: "tour.province_24" },
        { value: "Phu Tho", labelKey: "tour.province_25" },
        { value: "Hai Phong", labelKey: "tour.province_31" },
        { value: "Hung Yen", labelKey: "tour.province_33" },
        { value: "Ninh Binh", labelKey: "tour.province_37" },
        { value: "Thanh Hoa", labelKey: "tour.province_38" },
        { value: "Nghe An", labelKey: "tour.province_40" },
        { value: "Ha Tinh", labelKey: "tour.province_42" },
        { value: "Quang Tri", labelKey: "tour.province_44" },
        { value: "Hue", labelKey: "tour.province_46" },
        { value: "Da Nang", labelKey: "tour.province_48" },
        { value: "Quang Ngai", labelKey: "tour.province_51" },
        { value: "Gia Lai", labelKey: "tour.province_52" },
        { value: "Khanh Hoa", labelKey: "tour.province_56" },
        { value: "Dak Lak", labelKey: "tour.province_66" },
        { value: "Lam Dong", labelKey: "tour.province_68" },
        { value: "Dong Nai", labelKey: "tour.province_75" },
        { value: "Ho Chi Minh", labelKey: "tour.province_79" },
        { value: "Tay Ninh", labelKey: "tour.province_80" },
        { value: "Dong Thap", labelKey: "tour.province_82" },
        { value: "Vinh Long", labelKey: "tour.province_86" },
        { value: "An Giang", labelKey: "tour.province_91" },
        { value: "Can Tho", labelKey: "tour.province_92" },
        { value: "Ca Mau", labelKey: "tour.province_96" }
      ];

      const translatedOptions = options.map(opt => ({
        value: opt.value,
        label: t(opt.labelKey as any) || opt.value
      }));

      // Sort alphabetically by localized label
      translatedOptions.sort((a, b) => a.label.localeCompare(b.label));

      setProvinces(translatedOptions);
    } catch (err: any) {
      setError(err.message || "Failed to load provinces");
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  return { provinces, isLoading, error };
};
