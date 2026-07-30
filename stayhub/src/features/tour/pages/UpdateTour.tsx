import React, { useState } from "react";
import { MapPin, Layers, Tag, Trash2, X, Upload, Plus, ChevronDown } from "lucide-react";
import { TransportationSelect } from "../components/TransportationSelect";
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
import { DynamicText } from "../../../components/DynamicText";

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
      colSpan: 1,
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
      type: "custom",
      colSpan: 1,
      required: true,
      render: (value, onChange, error) => (
        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full appearance-none rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10 ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
            >
              <option value="">{t("tour.selectCategory")}</option>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  <DynamicText text={opt.label} />
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      ),
    },
    {
      name: "transportationType",
      label: t("tour.transportationType") || "Transportation Type",
      type: "custom",
      colSpan: 1,
      render: (value, onChange, error) => (
        <TransportationSelect value={value} onChange={onChange} error={error} />
      ),
      required: true,
    },
    {
      name: "status",
      label: t("common.status"),
      type: "select",
      colSpan: 1,
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
    {
      name: "tourImages",
      label: t("tour.tourImages") || "Tour Gallery",
      type: "custom",
      colSpan: 2,
      render: (value, onChange, error, setFormData, formData) => {
        const fileInputRef = React.useRef<HTMLInputElement>(null);
        const replaceInputRef = React.useRef<HTMLInputElement>(null);
        const replaceExistingInputRef = React.useRef<HTMLInputElement>(null);

        const [replaceIndex, setReplaceIndex] = React.useState<number | null>(null);
        const [replaceExistingId, setReplaceExistingId] = React.useState<number | null>(null);

        const existingImages = formData?.existingTourImages || [];
        const newFiles = value || [];

        const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files) {
            const addedFiles = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
            onChange([...newFiles, ...addedFiles]);
          }
          if (fileInputRef.current) fileInputRef.current.value = "";
        };

        const handleReplaceNewFile = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files[0] && replaceIndex !== null) {
            const file = e.target.files[0];
            const updated = [...newFiles];
            updated[replaceIndex] = file;
            onChange(updated);
            setReplaceIndex(null);
          }
          if (replaceInputRef.current) replaceInputRef.current.value = "";
        };

        const removeExistingImage = (id: number) => {
          if (setFormData) {
            setFormData((prev: any) => ({
              ...prev,
              removedTourImageIds: [...(prev.removedTourImageIds || []), id],
              existingTourImages: prev.existingTourImages.filter((img: any) => img.id !== id)
            }));
          }
        };

        const handleReplaceExistingFile = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files[0] && replaceExistingId !== null) {
            const file = e.target.files[0];
            removeExistingImage(replaceExistingId);
            onChange([...newFiles, file]);
            setReplaceExistingId(null);
          }
          if (replaceExistingInputRef.current) replaceExistingInputRef.current.value = "";
        };

        const removeNewFile = (index: number) => {
          const updated = [...newFiles];
          updated.splice(index, 1);
          onChange(updated);
        };

        return (
          <div className="flex flex-col gap-3">
            <input
              type="file"
              multiple
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFilesChange}
              className="hidden"
            />
            <input
              type="file"
              accept="image/*"
              ref={replaceInputRef}
              onChange={handleReplaceNewFile}
              className="hidden"
            />
            <input
              type="file"
              accept="image/*"
              ref={replaceExistingInputRef}
              onChange={handleReplaceExistingFile}
              className="hidden"
            />
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
              {existingImages.map((img: any) => (
                <div key={`existing-${img.id}`} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[4/3]">
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover opacity-80" />
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplaceExistingId(img.id);
                        replaceExistingInputRef.current?.click();
                      }}
                      className="text-xs font-semibold bg-white text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                    >
                      Change
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img.id)}
                    className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-1 left-1 text-[10px] font-semibold bg-black/50 text-white px-1.5 py-0.5 rounded">Saved</div>
                </div>
              ))}
              
              {newFiles.map((file: File, index: number) => (
                <div key={`new-${index}`} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[4/3]">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplaceIndex(index);
                        replaceInputRef.current?.click();
                      }}
                      className="text-xs font-semibold bg-white text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                    >
                      Change
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeNewFile(index)}
                    className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-1 left-1 text-[10px] font-semibold bg-brand/80 text-white px-1.5 py-0.5 rounded">New</div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-brand/5 hover:border-brand/30 text-slate-400 hover:text-brand aspect-[4/3] transition-colors"
              >
                <div className="text-2xl font-light">+</div>
                <div className="text-xs font-medium">{t("common.upload")}</div>
              </button>
            </div>
            
            {error && <p className="text-sm text-rose-500">{error}</p>}
          </div>
        );
      }
    },
  ];

  const initialFormValues = {
    ...tour,
    image: tour.imageUrl,
    removedTourImageIds: [],
    tourImages: [],
    existingTourImages: tour?.tourImages || [],
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
