import React, { useMemo } from "react";
import { Type, Link as LinkIcon, Hash, Tag } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useUpdateBanner } from "../hooks/useUpdateBanner";
import { getImg } from "../../../config/api/api";

export const UpdateBanner: React.FC = () => {
  const { t } = useTranslation();
  const {
    id,
    banner,
    isFetching,
    fetchError,
    isSubmitting,
    serverErrors,
    handleSubmit,
    handleCancel,
  } = useUpdateBanner();

  const bannerFields: FormField[] = useMemo(
    () => [
      {
        name: "title",
        label: t("content.bannerTitle"),
        type: "text",
        icon: <Type className="h-4 w-4" />,
        colSpan: 2,
        required: true,
        maxLength: 255,
      },
      {
        name: "targetUrl",
        label: t("content.targetUrl"),
        type: "text",
        icon: <LinkIcon className="h-4 w-4" />,
        colSpan: 2,
        maxLength: 500,
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
      {
        name: "imageFile",
        label: t("content.bannerImageKeepCurrent"),
        type: "file",
        colSpan: 2,
      },
    ],
    [t],
  );

  if (isFetching)
    return (
      <div className="flex justify-center p-10 text-slate-500">
        {t("content.loadingBannerDetails")}
      </div>
    );
  if (fetchError) return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  if (!banner)
    return (
      <div className="flex justify-center p-10 text-slate-500">{t("content.bannerNotFound")}</div>
    );

  return (
    <>
      <DynamicForm
        title={t("content.updateBanner")}
        description={t("content.updateBannerDesc", { id: String(id) })}
        fields={bannerFields}
        initialValues={{
          ...banner,
          isActive: banner.isActive ? "Active" : "Inactive",
          imageFile: banner.imageUrl ? getImg(banner.imageUrl) : undefined,
        }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t("content.updatingBanner")} />
    </>
  );
};
