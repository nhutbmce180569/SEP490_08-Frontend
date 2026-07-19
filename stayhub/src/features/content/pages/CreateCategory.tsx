import React, { useMemo } from "react";
import { Type, AlignLeft, Tag } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useCreateCategory } from "../hooks/useCreateCategory";

export const CreateCategory: React.FC = () => {
  const { t } = useTranslation();
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateCategory();

  const categoryFields: FormField[] = useMemo(
    () => [
      {
        name: "name",
        label: t("content.categoryName"),
        type: "custom",
        required: true,
        colSpan: 1,
        validate: (value: any) => {
          if (!value || typeof value !== "string" || !value.trim()) {
            return t("common.fieldRequired", { label: t("content.categoryName") });
          }
          const regex = /^[\p{L}\p{N}\s-]+$/u;
          if (!regex.test(value)) {
            return t("content.categoryNameNoSpecialChars");
          }
          return undefined;
        },
        render: (value, onChange, error, setFormData) => (
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Type className="h-4 w-4" />
            </div>
            <input
              type="text"
              className={`input-field py-2.5 pr-4 text-sm pl-10 w-full rounded-xl border border-slate-200 outline-none focus:border-brand ${
                error ? "!border-rose-500 !bg-rose-50/30" : ""
              }`}
              placeholder={t("content.categoryNamePlaceholder")}
              value={value || ""}
              onChange={(e) => {
                const nameVal = e.target.value;
                onChange(nameVal);
                
                // Auto generate slug from name
                const generatedSlug = nameVal
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .toLowerCase()
                  .trim()
                  .replace(/đ/g, "d")
                  .replace(/[^a-z0-9\s-]/g, "")
                  .replace(/[\s-]+/g, "-");
                  
                if (setFormData) {
                  setFormData((prev) => ({ ...prev, slug: generatedSlug }));
                }
              }}
            />
          </div>
        )
      },
      {
        name: "slug",
        label: "Slug",
        type: "text",
        placeholder: t("content.slugPlaceholder"),
        icon: <Tag className="h-4 w-4" />,
        colSpan: 1,
        required: true,
        validate: (value: any) => {
          if (!value || typeof value !== "string" || !value.trim()) {
            return t("common.fieldRequired", { label: "Slug" });
          }
          const regex = /^[a-z0-9-]+$/;
          if (!regex.test(value)) {
            return t("content.slugInvalidFormat");
          }
          return undefined;
        },
      },
      {
        name: "description",
        label: t("common.description"),
        type: "textarea",
        placeholder: t("content.descriptionPlaceholder"),
        icon: <AlignLeft className="h-4 w-4" />,
        colSpan: 2,
      },
      {
        name: "iconFile",
        label: t("content.categoryIcon"),
        type: "file",
        colSpan: 2,
        required: true,
        validate: (value: any) => {
          if (value instanceof File && !value.type.startsWith("image/")) {
            return t("content.onlyImageFilesAllowed");
          }
          if (!value) {
            return t("common.fieldRequired", { label: t("content.categoryIcon") });
          }
          return undefined;
        },
      },
    ],
    [t],
  );

  return (
    <>
      <DynamicForm
        title={t("content.createCategory")}
        description={t("content.createCategoryDesc")}
        fields={categoryFields}
        initialValues={{}}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t("content.creatingCategory")} />
    </>
  );
};
