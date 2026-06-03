import React, { useMemo } from "react";
import { Type, Link, Hash, Tag } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useCreateBanner } from "../hooks/useCreateBanner";

export const CreateBanner: React.FC = () => {
  const { t } = useTranslation();
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateBanner();

  const bannerFields: FormField[] = useMemo(
    () => [
      {
        name: "title",
        label: t("content.bannerTitle"),
        type: "text",
        icon: <Type className="h-4 w-4" />,
        colSpan: 2,
        required: true,
      },
      {
        name: "targetUrl",
        label: t("content.targetUrl"),
        type: "text",
        icon: <Link className="h-4 w-4" />,
        colSpan: 2,
      },
      {
        name: "priority",
        label: t("content.priorityHigherTop"),
        type: "number",
        icon: <Hash className="h-4 w-4" />,
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
      { name: "imageFile", label: t("content.bannerImage"), type: "file", colSpan: 2, required: true },
    ],
    [t],
  );

  return (
    <>
      <DynamicForm
        title={t("content.createBanner")}
        description={t("content.createBannerDesc")}
        fields={bannerFields}
        initialValues={{ isActive: "Active", priority: 0 }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t("content.creatingBanner")} />
    </>
  );
};
