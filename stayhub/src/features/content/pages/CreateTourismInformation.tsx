import React from "react";
import { TourismInformationForm } from "../components/TourismInformationForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useCreateTourismInformation } from "../hooks/useCreateTourismInformation";

export const CreateTourismInformation: React.FC = () => {
  const { t } = useTranslation();
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateTourismInformation();

  return (
    <>
      <TourismInformationForm
        title={t("content.createTourismInfo")}
        description={t("content.createTourismInfoDesc")}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitText={t("common.create")}
        serverErrors={serverErrors}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t("content.creatingTourismInfo")} />
    </>
  );
};
