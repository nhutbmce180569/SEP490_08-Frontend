import React, { useState } from "react";
import { MapPin, Layers, Tag } from "lucide-react";
import {
  DynamicForm,
  type FormField,
} from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useUpdateTour } from "../hooks/useUpdateTour";
import { useProvinces } from "../hooks/useProvinces";
import { useCountries } from "../hooks/useCountries";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { SearchableSelect } from "../../../components/dashboard/SearchableSelect";
import { MapPickerModal } from "../components/MapPickerModal";
import { useTranslation } from "../../../contexts/LocaleContext";

export const UpdateTour: React.FC = () => {
  const { t } = useTranslation();
  const {
    id,
    tour,
    isFetching,
    fetchError,
    isSubmitting,
    serverErrors,
    handleSubmit,
    handleCancel,
    categoryOptions,
  } = useUpdateTour();

  const { provinces } = useProvinces();
  const { countries } = useCountries();

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [currentSetFormData, setCurrentSetFormData] = useState<React.Dispatch<React.SetStateAction<Record<string, any>>> | null>(null);
  const [mapInitialData, setMapInitialData] = useState<any>(null);

  const normalizeString = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]/g, "");
  };

  const handleConfirmLocation = (locationData: any) => {
    if (currentSetFormData) {
      let matchedCity = locationData.city;
      const targetCityInput = locationData.state || locationData.city;
      if (targetCityInput && provinces.length > 0) {
        const normalizedInput = normalizeString(targetCityInput).replace("thanhpho", "").replace("tinh", "");
        const match = provinces.find((p) => {
          const normP = normalizeString(p.label).replace("thanhpho", "").replace("tinh", "");
          return normP === normalizedInput || normP.includes(normalizedInput) || normalizedInput.includes(normP);
        });
        if (match) {
          matchedCity = match.value;
        }
      }

      currentSetFormData((prev) => ({
        ...prev,
        country: locationData.country,
        city: matchedCity,
        address: locationData.address,
      }));
    }
  };

  if (isFetching)
    return (
      <div className="flex justify-center p-10 text-slate-500">
        {t("tour.loadingTourDetailsMgr")}
      </div>
    );
  if (fetchError)
    return (
      <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>
    );
  if (!tour)
    return (
      <div className="flex justify-center p-10 text-slate-500">
        {t("tour.tourNotFound")}
      </div>
    );
  if (!tour.canEdit)
    return (
      <div className="flex justify-center p-10 text-rose-500">
        {t("tour.noEditPermission")}
      </div>
    );

  const tourFields: FormField[] = [
    {
      name: "name",
      label: t("tour.tourName"),
      type: "text",
      placeholder: t("tour.tourNamePlaceholder"),
      colSpan: 2,
      required: true,
      maxLength: 100,
      validate: (value) => {
        const length = String(value ?? "").trim().length;
        if (length < 5 || length > 100) return t("tour.nameLengthValidation");
        return undefined;
      },
    },
    {
      name: "categoryId",
      label: t("tour.category"),
      type: "select",
      icon: <Layers className="h-4 w-4" />,
      options: categoryOptions,
      placeholder: t("tour.selectCategory"),
      required: true,
    },
    {
      name: "status",
      label: t("common.status"),
      type: "select",
      icon: <Tag className="h-4 w-4" />,
      options: [
        { label: t("common.active"), value: "Active" },
        { label: t("common.inactive"), value: "Inactive" },
      ],
    },
    {
      name: "address",
      label: t("tour.fullAddress"),
      type: "custom",
      colSpan: 2,
      required: true,
      render: (value, onChange, error, setFormData, formData) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                onChange={(event) => onChange(event.target.value)}
                className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10 ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
                placeholder={t("tour.fullAddress")}
                value={value || ""}
              />
            </div>
            <ActionButton
              type="button"
              variant="secondary"
              onClick={() => {
                setCurrentSetFormData(() => setFormData);
                setMapInitialData({
                  single: {
                    address: [value, formData?.city, formData?.country]
                      .filter(Boolean)
                      .join(", "),
                  },
                });
                setIsMapModalOpen(true);
              }}
              className="gap-2 px-3 py-2 text-sm font-semibold text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-200 hover:text-indigo-700"
            >
              <MapPin className="h-4 w-4" /> {t("tour.pickOnMap")}
            </ActionButton>
          </div>
        </div>
      ),
    },
    {
      name: "city",
      label: t("tour.provinceCity"),
      type: "custom",
      required: true,
      render: (value, onChange, error) => (
        <div className="flex flex-col gap-1.5">
          <SearchableSelect
            options={provinces}
            value={value || ""}
            onChange={onChange}
            placeholder={t("tour.selectProvinceCity")}
            error={!!error}
          />
        </div>
      ),
    },
    {
      name: "country",
      label: t("tour.country"),
      type: "custom",
      required: true,
      render: (value, onChange, error) => (
        <div className="flex flex-col gap-1.5">
          <SearchableSelect
            options={countries}
            value={value || ""}
            onChange={onChange}
            placeholder={t("tour.country")}
            error={!!error}
          />
        </div>
      ),
    },
    {
      name: "description",
      label: t("common.description"),
      type: "custom",
      colSpan: 2,
      required: true,
      validate: (value) => {
        if (typeof value === "string" && value.includes("<img")) {
          return t("tour.descriptionNoImageValidation");
        }
        return undefined;
      },
      render: (value, onChange, error) => (
        <div className="flex flex-col gap-1.5">
          <div className="prose-sm max-w-none [&>.ql-toolbar]:rounded-t-xl [&>.ql-toolbar]:border-slate-200 [&>.ql-container]:rounded-b-xl [&>.ql-container]:border-slate-200">
            <ReactQuill
              theme="snow"
              value={value || ""}
              onChange={onChange}
              placeholder={t("tour.tourDescriptionPlaceholder")}
              className={error ? "[&>.ql-container]:!border-rose-500" : ""}
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                  [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                  ['link'],
                  [{ 'color': [] }, { 'background': [] }],
                  ['clean']
                ],
              }}
            />
          </div>
        </div>
      ),
    },
    {
      name: "image",
      label: t("tour.tourImage"),
      type: "file",
      colSpan: 2,
      validate: (value) => {
        if (!(value instanceof File)) return undefined;
        if (value.size > 5 * 1024 * 1024) return t("tour.imageSizeValidation");
        return ["image/jpeg", "image/png", "image/webp"].includes(value.type)
          ? undefined
          : t("tour.imageTypeValidation");
      },
    },
  ];

  const initialFormValues = {
    ...tour,
    image: tour.imageUrl,
  };

  return (
    <>
      <DynamicForm
        title={t("tour.updateTourTitle")}
        description={t("tour.editTourDetails", { id: id ?? "" })}
        fields={tourFields}
        initialValues={initialFormValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        serverErrors={serverErrors}
        submitText={t("tour.updateTourTitle")}
        cancelText={t("common.cancel")}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t("tour.updatingTour")} />

      <MapPickerModal
        isOpen={isMapModalOpen}
        initialData={mapInitialData}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleConfirmLocation}
      />
    </>
  );
};
