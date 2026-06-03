import React, { useState } from "react";
import { FileText, Tag, MapPin, Layers } from "lucide-react";
import {
  DynamicForm,
  type FormField,
} from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateTour } from "../hooks/useCreateTour";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { MapPickerModal } from "../components/MapPickerModal";
import { useTranslation } from "../../../contexts/LocaleContext";

export const CreateTour: React.FC = () => {
  const { t } = useTranslation();
  const {
    handleSubmit,
    handleCancel,
    isSubmitting,
    serverErrors,
    categoryOptions,
  } = useCreateTour();

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [currentSetFormData, setCurrentSetFormData] = useState<React.Dispatch<
    React.SetStateAction<Record<string, any>>
  > | null>(null);
  const [mapInitialData, setMapInitialData] = useState<any>(null);

  const handleConfirmLocation = (locationData: any) => {
    if (currentSetFormData) {
      currentSetFormData((prev) => ({
        ...prev,
        country: locationData.country,
        city: locationData.city,
        address: locationData.address,
      }));
    }
  };

  const tourFields: FormField[] = [
    {
      name: "name",
      label: t("tour.tourName"),
      type: "text",
      placeholder: t("tour.tourNamePlaceholder"),
      colSpan: 2,
      required: true,
    },
    {
      name: "categoryId",
      label: t("tour.category"),
      type: "select",
      icon: <Layers className="h-4 w-4" />,
      options: categoryOptions,
      required: true,
    },
    {
      name: "status",
      label: t("common.status"),
      type: "custom",
      render: () => (
        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              disabled
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-500 outline-none"
              value="Inactive"
            >
              <option value="Inactive">{t("common.inactive")}</option>
            </select>
          </div>
          <span className="text-[11.5px] font-medium text-amber-600">
            {t("tour.tourInactiveDefault")}
          </span>
        </div>
      ),
    },
    {
      name: "address",
      label: t("tour.fullAddress"),
      type: "custom",
      colSpan: 2,
      required: true,
      render: (value, onChange, error, setFormData) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                readOnly
                onClick={() => {
                  setCurrentSetFormData(() => setFormData);
                  setMapInitialData({ single: { address: value || "" } });
                  setIsMapModalOpen(true);
                }}
                className={`w-full cursor-pointer rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
                placeholder={t("tour.clickPickOnMap")}
                value={value || ""}
              />
            </div>
            <ActionButton
              type="button"
              variant="secondary"
              onClick={() => {
                setCurrentSetFormData(() => setFormData);
                setMapInitialData({ single: { address: value || "" } });
                setIsMapModalOpen(true);
              }}
              className="gap-2 px-3 py-2 text-sm font-semibold text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-200 hover:text-indigo-700"
            >
              <MapPin className="h-4 w-4" /> {t("tour.pickOnMap")}
            </ActionButton>
          </div>
          {error && (
            <span className="text-xs font-medium text-rose-500">{error}</span>
          )}
        </div>
      ),
    },
    {
      name: "city",
      label: t("tour.city"),
      type: "text",
      placeholder: t("tour.autoFilledFromMap"),
      icon: <MapPin className="h-4 w-4" />,
      required: true,
      readOnly: true,
    },
    {
      name: "country",
      label: t("tour.country"),
      type: "text",
      placeholder: t("tour.autoFilledFromMap"),
      icon: <MapPin className="h-4 w-4" />,
      required: true,
      readOnly: true,
    },
    {
      name: "description",
      label: t("common.description"),
      type: "textarea",
      placeholder: t("tour.tourDescriptionPlaceholder"),
      icon: <FileText className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: "image",
      label: t("tour.tourImage"),
      type: "file",
      colSpan: 2,
    },
  ];

  return (
    <>
      <DynamicForm
        title={t("tour.createNewTour")}
        description={t("tour.createNewTourDesc")}
        fields={tourFields}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
        initialValues={{ status: "Inactive" }}
        submitText={t("tour.saveTour")}
        cancelText={t("common.cancel")}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t("tour.creatingTour")} />

      <MapPickerModal
        isOpen={isMapModalOpen}
        initialData={mapInitialData}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleConfirmLocation}
      />
    </>
  );
};
