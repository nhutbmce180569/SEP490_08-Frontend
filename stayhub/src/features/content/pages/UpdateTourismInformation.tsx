import React from "react";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getImg } from "../../../config/api/api";
import { TourismInformationForm } from "../components/TourismInformationForm";
import { useUpdateTourismInformation } from "../hooks/useUpdateTourismInformation";
import { TOURISM_DEFAULT_COUNTRY } from "../types/tourismInformation";

export const UpdateTourismInformation: React.FC = () => {
  const { t } = useTranslation();
  const {
    id,
    tourismInfo,
    isFetching,
    fetchError,
    isSubmitting,
    serverErrors,
    handleSubmit,
    handleCancel,
  } = useUpdateTourismInformation();

  if (isFetching) {
    return (
      <div className="flex justify-center p-10 text-slate-500">
        {t("content.loadingTourismInfo")}
      </div>
    );
  }

  if (fetchError) {
    return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  }

  if (!tourismInfo) {
    return (
      <div className="flex justify-center p-10 text-slate-500">
        {t("content.tourismInfoNotFound")}
      </div>
    );
  }

  return (
    <div className="min-w-0 pb-2">
      <TourismInformationForm
        title={t("content.updateTourismInfo")}
        description={t("content.updateTourismInfoDesc", { id: String(id) })}
        initialValues={{
          ...tourismInfo,
          country: tourismInfo.country || TOURISM_DEFAULT_COUNTRY,
          imageFile: tourismInfo.imageUrl ? getImg(tourismInfo.imageUrl) : undefined,
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitText={t("common.saveChanges")}
        serverErrors={serverErrors}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t("content.updatingTourismInfo")} />
    </div>
  );
};
