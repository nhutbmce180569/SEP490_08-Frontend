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
        type: "text",
        placeholder: t("content.categoryNamePlaceholder"),
        icon: <Type className="h-4 w-4" />,
        colSpan: 1,
        required: true,
      },
      {
        name: "slug",
        label: t("content.slug"),
        type: "text",
        placeholder: t("content.slugPlaceholder"),
        icon: <Type className="h-4 w-4" />,
        colSpan: 1,
        required: true,
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
        name: "isActive",
        label: t("common.status"),
        type: "select",
        icon: <Tag className="h-4 w-4" />,
        options: [
          { label: t("common.active"), value: "Active" },
          { label: t("common.inactive"), value: "Inactive" },
        ],
      },
      { name: "iconFile", label: t("content.categoryIcon"), type: "file", colSpan: 2 },
    ],
    [t],
  );

  return (
    <>
      <DynamicForm
        title={t("content.createCategory")}
        description={t("content.createCategoryDesc")}
        fields={categoryFields}
        initialValues={{ isActive: "Active" }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t("content.creatingCategory")} />
    </>
  );
};
