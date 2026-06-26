import React, { useMemo } from "react";
import { Type, AlignLeft, Tag } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useUpdateCategory } from "../hooks/useUpdateCategory";
import { getImg } from "../../../config/api/api";

export const UpdateCategory: React.FC = () => {
  const { t } = useTranslation();
  const {
    id,
    category,
    isFetching,
    fetchError,
    isSubmitting,
    serverErrors,
    handleSubmit,
    handleCancel,
  } = useUpdateCategory();

  const categoryFields: FormField[] = useMemo(
    () => [
      {
        name: "name",
        label: t("content.categoryName"),
        type: "text",
        icon: <Type className="h-4 w-4" />,
        colSpan: 1,
        required: true,
      },

      {
        name: "description",
        label: t("common.description"),
        type: "textarea",
        icon: <AlignLeft className="h-4 w-4" />,
        colSpan: 2,
      },
      {
        name: "isActive",
        label: t("common.status"),
        type: "select",
        icon: <Tag className="h-4 w-4" />,
        options: [
          { label: t("common.active"), value: "Active" },
          { label: t("common.inactive"), value: "Inactive" },
        ],
      },
      {
        name: "iconFile",
        label: t("content.categoryIconKeepCurrent"),
        type: "file",
        colSpan: 2,
      },
    ],
    [t],
  );

  if (isFetching)
    return (
      <div className="flex justify-center p-10 text-slate-500">
        {t("content.loadingCategoryDetails")}
      </div>
    );
  if (fetchError) return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  if (!category)
    return (
      <div className="flex justify-center p-10 text-slate-500">{t("content.categoryNotFound")}</div>
    );

  return (
    <>
      <DynamicForm
        title={t("content.updateCategory")}
        description={t("content.updateCategoryDesc", { id: String(id) })}
        fields={categoryFields}
        initialValues={{
          ...category,
          isActive: category.isActive ? "Active" : "Inactive",
          iconFile: category.iconUrl ? getImg(category.iconUrl) : undefined,
        }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t("content.updatingCategory")} />
    </>
  );
};
